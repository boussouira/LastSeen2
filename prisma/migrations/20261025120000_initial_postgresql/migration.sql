-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'DATE');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitSession" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "VisitSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "path" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeDefinition" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" "AttributeType" NOT NULL,

    CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeValue" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contact_shop_lastSeen_idx" ON "Contact"("shop", "lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_shop_id_key" ON "Contact"("shop", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_shop_externalId_key" ON "Contact"("shop", "externalId");

-- CreateIndex
CREATE INDEX "VisitSession_shop_contactId_startedAt_idx" ON "VisitSession"("shop", "contactId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VisitSession_shop_id_key" ON "VisitSession"("shop", "id");

-- CreateIndex
CREATE INDEX "ActivityEvent_shop_sessionId_occurredAt_idx" ON "ActivityEvent"("shop", "sessionId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityEvent_shop_sourceId_key" ON "ActivityEvent"("shop", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_shop_id_key" ON "AttributeDefinition"("shop", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_shop_key_key" ON "AttributeDefinition"("shop", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeValue_shop_contactId_definitionId_key" ON "AttributeValue"("shop", "contactId", "definitionId");

-- AddForeignKey
ALTER TABLE "VisitSession" ADD CONSTRAINT "VisitSession_shop_contactId_fkey" FOREIGN KEY ("shop", "contactId") REFERENCES "Contact"("shop", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_shop_sessionId_fkey" FOREIGN KEY ("shop", "sessionId") REFERENCES "VisitSession"("shop", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_shop_contactId_fkey" FOREIGN KEY ("shop", "contactId") REFERENCES "Contact"("shop", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_shop_definitionId_fkey" FOREIGN KEY ("shop", "definitionId") REFERENCES "AttributeDefinition"("shop", "id") ON DELETE CASCADE ON UPDATE CASCADE;

