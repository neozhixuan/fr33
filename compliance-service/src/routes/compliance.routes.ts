import { Router } from "express";
import {
  dismissComplianceCaseController,
  getComplianceProfileController,
  listComplianceCasesController,
  revokeVcForComplianceCaseController,
} from "../controllers/compliance.controller";

const router = Router();

router.get("/compliance/cases", listComplianceCasesController);
router.post(
  "/compliance/cases/:caseId/dismiss",
  dismissComplianceCaseController,
);
router.post(
  "/compliance/cases/:caseId/revoke-vc",
  revokeVcForComplianceCaseController,
);
router.get("/compliance/profiles/:wallet", getComplianceProfileController);

export default router;
