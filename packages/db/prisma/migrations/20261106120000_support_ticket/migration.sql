-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportTicketSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "supportTicket" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "slaDueAt" TIMESTAMP(3) NOT NULL,
    "isidoroUserId" TEXT NOT NULL,
    "requesterName" TEXT,
    "requesterEmail" TEXT,
    "module" TEXT,
    "conversationId" TEXT,
    "severity" "SupportTicketSeverity",
    "companyId" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supportTicket_number_key" ON "supportTicket"("number");

-- CreateIndex
CREATE UNIQUE INDEX "supportTicket_tenantId_idempotencyKey_key" ON "supportTicket"("tenantId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "supportTicket_tenantId_idx" ON "supportTicket"("tenantId");

-- CreateIndex
CREATE INDEX "supportTicket_isidoroUserId_idx" ON "supportTicket"("isidoroUserId");

-- CreateIndex
CREATE INDEX "supportTicket_status_slaDueAt_idx" ON "supportTicket"("status", "slaDueAt");

-- CreateIndex
CREATE INDEX "supportTicket_assigneeId_idx" ON "supportTicket"("assigneeId");

-- CreateIndex
CREATE INDEX "supportTicket_companyId_idx" ON "supportTicket"("companyId");

-- CreateIndex
CREATE INDEX "supportTicket_createdById_idx" ON "supportTicket"("createdById");

-- AddForeignKey
ALTER TABLE "supportTicket" ADD CONSTRAINT "supportTicket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supportTicket" ADD CONSTRAINT "supportTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supportTicket" ADD CONSTRAINT "supportTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
