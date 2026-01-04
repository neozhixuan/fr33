import { Router } from "express";
import { issueVCController } from "../controllers/vc.controller";

const router = Router();

router.post("/vc/issue", issueVCController);

export default router;
