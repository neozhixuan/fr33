import { Request, Response } from "express";
import {
  actionCaseByRevokingVc,
  dismissCase,
  getWalletProfile,
  listCases,
  listMonitoringLogs,
  revokeAnyVc,
} from "../services/compliance/compliance-case.service";
import { EscrowEventTypes } from "../type/compliance.types";

// Controllers for handling compliance-related API endpoints, including listing cases, dismissing cases, revoking VCs, and fetching wallet profiles.
export async function listComplianceCasesController(
  req: Request,
  res: Response,
) {
  try {
    const status = req.query.status as
      | "OPEN"
      | "DISMISSED"
      | "ACTIONED"
      | undefined;
    const wallet = req.query.wallet?.toString();

    const cases = await listCases({ status, wallet });
    return res.json({ cases });
  } catch (error) {
    return res.status(500).json({
      error: `Failed to list compliance cases: ${(error as Error).message}`,
    });
  }
}

// Controller for dismissing a compliance case by its ID, with optional notes.
export async function dismissComplianceCaseController(
  req: Request,
  res: Response,
) {
  try {
    const caseId = Number(req.params.caseId);

    if (!Number.isFinite(caseId)) {
      return res.status(400).json({ error: "Invalid caseId" });
    }

    const notes = req.body?.notes?.toString() || "Dismissed by admin";
    const result = await dismissCase(caseId, notes);

    return res.json({ case: result });
  } catch (error) {
    return res.status(500).json({
      error: `Failed to dismiss case: ${(error as Error).message}`,
    });
  }
}

// Controller for revoking a VC associated with a compliance case, which also marks the case as actioned with the provided notes.
export async function revokeVcForComplianceCaseController(
  req: Request,
  res: Response,
) {
  try {
    const caseId = Number(req.params.caseId);
    const vcHash = req.body?.vcHash?.toString();
    const notes = req.body?.notes?.toString() || "VC revoked by admin";

    if (!Number.isFinite(caseId)) {
      return res.status(400).json({ error: "Invalid caseId" });
    }

    if (!vcHash) {
      return res.status(400).json({ error: "vcHash is required" });
    }

    const result = await actionCaseByRevokingVc({ caseId, vcHash, notes });
    return res.json({ case: result });
  } catch (error) {
    return res.status(500).json({
      error: `Failed to action compliance case: ${(error as Error).message}`,
    });
  }
}

// Controller for fetching a compliance profile associated with a wallet address.
export async function getComplianceProfileController(
  req: Request,
  res: Response,
) {
  try {
    const wallet = req.params.wallet?.toString();

    if (!wallet) {
      return res.status(400).json({ error: "wallet is required" });
    }

    const profile = await getWalletProfile(wallet);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.json({ profile });
  } catch (error) {
    return res.status(500).json({
      error: `Failed to fetch profile: ${(error as Error).message}`,
    });
  }
}

// Controller for revoking a particular VC by its hash
export async function revokeAnyVcController(req: Request, res: Response) {
  try {
    console.log("trying");
    const vcHash = req.body?.vcHash?.toString();
    const notes = req.body?.notes?.toString() || "VC revoked by admin";

    if (!vcHash) {
      return res.status(400).json({ error: "vcHash is required" });
    }

    const result = await revokeAnyVc({ vcHash, notes });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: `Failed to revoke VC: ${(error as Error).message}`,
    });
  }
}

// Controller for listing compliance monitoring logs, with optional filtering by wallet and event type, and pagination support.
export async function listComplianceMonitoringLogsController(
  req: Request,
  res: Response,
) {
  try {
    const wallet = req.query.wallet?.toString();
    const eventType = req.query.eventType as EscrowEventTypes | undefined;
    const limitRaw = req.query.limit?.toString();
    const limit = limitRaw ? Number(limitRaw) : undefined;
    const offsetRaw = req.query.offset?.toString();
    const offset = offsetRaw ? Number(offsetRaw) : undefined;

    const logs = await listMonitoringLogs({
      wallet,
      eventType,
      limit: Number.isFinite(limit) ? limit : undefined,
      offset: Number.isFinite(offset) ? offset : undefined,
    });

    return res.json({ logs });
  } catch (error) {
    return res.status(500).json({
      error: `Failed to list compliance monitoring logs: ${
        (error as Error).message
      }`,
    });
  }
}
