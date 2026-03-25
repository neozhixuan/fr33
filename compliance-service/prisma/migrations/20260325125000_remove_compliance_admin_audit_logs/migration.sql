/*
  Warnings:

  - You are about to drop the `compliance_audit_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "compliance_service"."compliance_audit_logs";

-- DropEnum
DROP TYPE "compliance_service"."ComplianceAuditAction";

-- DropEnum
DROP TYPE "compliance_service"."ComplianceAuditResult";
