import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const entrypoint = path.resolve("scripts/dev-entrypoint.sh");

test("development image installs and checks ps for Shopify CLI process management", () => {
  const containerfile = readFileSync("Containerfile.dev", "utf8").replace(/\\\n/g, " ");
  assert.match(containerfile, /apt-get install[^&\n]*\bprocps\b/);
  assert.match(containerfile, /&& command -v ps\s*&& ps --version/);
});

function fixture() {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "compose-entrypoint-"));
  const bin = path.join(cwd, "bin");
  mkdirSync(bin);
  writeFileSync(path.join(cwd, "package.json"), "{}");
  writeFileSync(path.join(cwd, "package-lock.json"), "{}");
  for (const [name, body] of Object.entries({
    npm: 'echo "$*" >> npm-calls; exit "${INSTALL_EXIT:-0}"',
    psql: 'echo called >> db-calls; exit "${DB_EXIT:-0}"',
    sleep: "exit 0",
  })) {
    writeFileSync(path.join(bin, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
  }
  const run = (overrides: Record<string, string> = {}) => spawnSync("sh", [
    entrypoint, process.execPath, "-e",
    'require("fs").writeFileSync("started", process.env.DATABASE_URL)',
  ], {
    cwd,
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      POSTGRES_PASSWORD: "test:/@?#% password",
      ...overrides,
    },
    encoding: "utf8",
  });
  return { cwd, run, cleanup: () => rmSync(cwd, { recursive: true, force: true }) };
}

test("compose entrypoint caches dependencies, encodes credentials, and starts the command", () => {
  const f = fixture();
  try {
    assert.equal(f.run().status, 0);
    const url = new URL(readFileSync(path.join(f.cwd, "started"), "utf8"));
    assert.equal(decodeURIComponent(url.password), "test:/@?#% password");
    assert.equal(url.hostname, "db");
    assert.equal(f.run().status, 0);
    assert.equal(readFileSync(path.join(f.cwd, "npm-calls"), "utf8"), "ci\n");
    writeFileSync(path.join(f.cwd, "package-lock.json"), '{"changed":true}');
    assert.equal(f.run().status, 0);
    assert.equal(readFileSync(path.join(f.cwd, "npm-calls"), "utf8"), "ci\nci\n");
    mkdirSync(path.join(f.cwd, "extensions/pixel"), { recursive: true });
    writeFileSync(path.join(f.cwd, "extensions/pixel/package.json"), "{}");
    assert.equal(f.run().status, 0);
    assert.equal(readFileSync(path.join(f.cwd, "npm-calls"), "utf8"), "ci\nci\nci\n");
  } finally { f.cleanup(); }
});

test("compose entrypoint fails closed on missing credentials or failed install", () => {
  const f = fixture();
  try {
    assert.notEqual(f.run({ POSTGRES_PASSWORD: "" }).status, 0);
    assert.equal(existsSync(path.join(f.cwd, "npm-calls")), false);
    assert.equal(f.run({ INSTALL_EXIT: "42" }).status, 42);
    assert.equal(existsSync(path.join(f.cwd, "node_modules/.compose-install-fingerprint")), false);
    assert.equal(existsSync(path.join(f.cwd, "started")), false);
    assert.equal(f.run().status, 0);
  } finally { f.cleanup(); }
});

test("compose entrypoint bounds database retries and does not start against an unavailable DB", () => {
  const f = fixture();
  try {
    const result = f.run({ DB_EXIT: "1" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /PostgreSQL was not ready/);
    assert.equal(readFileSync(path.join(f.cwd, "db-calls"), "utf8").trim().split("\n").length, 60);
    assert.equal(existsSync(path.join(f.cwd, "started")), false);
  } finally { f.cleanup(); }
});
