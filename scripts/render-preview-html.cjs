const fs = require('node:fs');
const ts = require('typescript');
const {pathToFileURL} = require('node:url');
(async()=>{
 const code = fs.readFileSync('app/routes/demo.tsx','utf8');
 const out = ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ESNext}}).outputText;
 fs.writeFileSync('.preview-temp.mjs',out);
 const {default:Demo} = await import(pathToFileURL(process.cwd()+'/.preview-temp.mjs'));
 const React = require('react');const {renderToStaticMarkup} = require('react-dom/server');const {MemoryRouter} = require('react-router');
 for(const screen of ['people','person','attributes']) {
 const markup=renderToStaticMarkup(React.createElement(MemoryRouter,{initialEntries:[`/demo?screen=${screen}`]},React.createElement(Demo)));
 fs.writeFileSync(`docs/screenshots/${screen}.html`, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Win C · ${screen} preview</title><link rel="stylesheet" href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"></head><body>${markup}</body></html>`);
 }
 fs.unlinkSync('.preview-temp.mjs');
})();
