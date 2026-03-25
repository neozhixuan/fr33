import { Router } from "express";
import {
  dismissComplianceCaseController,
  getComplianceProfileController,
  listComplianceMonitoringLogsController,
  listComplianceCasesController,
  revokeAnyVcController,
  revokeVcForComplianceCaseController,
} from "../controllers/compliance.controller";

const router = Router();

// Compliance Case APIs
router.get("/compliance/cases", listComplianceCasesController);
router.post(
  "/compliance/cases/:caseId/dismiss",
  dismissComplianceCaseController,
);
router.post(
  "/compliance/cases/:caseId/revoke-vc",
  revokeVcForComplianceCaseController,
);

// VC APIs
router.post("/compliance/vc/revoke", revokeAnyVcController);

// Monitoring Logs APIs
router.get(
  "/compliance/monitoring-logs",
  listComplianceMonitoringLogsController,
);

// Compliance Profile APIs
router.get("/compliance/profiles/:wallet", getComplianceProfileController);

export default router;
