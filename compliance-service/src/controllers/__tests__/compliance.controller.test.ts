import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  dismissComplianceCaseController,
  getComplianceProfileController,
  listComplianceCasesController,
  listComplianceMonitoringLogsController,
  revokeAnyVcController,
  revokeVcForComplianceCaseController,
} from "../compliance.controller";

jest.mock("../../services/compliance/compliance-case.service", () => ({
  actionCaseByRevokingVc: jest.fn(),
  dismissCase: jest.fn(),
  getWalletProfile: jest.fn(),
  listCases: jest.fn(),
  listMonitoringLogs: jest.fn(),
  revokeAnyVc: jest.fn(),
}));

import {
  actionCaseByRevokingVc,
  dismissCase,
  getWalletProfile,
  listCases,
  listMonitoringLogs,
  revokeAnyVc,
} from "../../services/compliance/compliance-case.service";

const mockedActionCaseByRevokingVc = actionCaseByRevokingVc as any;
const mockedDismissCase = dismissCase as any;
const mockedGetWalletProfile = getWalletProfile as any;
const mockedListCases = listCases as any;
const mockedListMonitoringLogs = listMonitoringLogs as any;
const mockedRevokeAnyVc = revokeAnyVc as any;

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("compliance.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("revokeVcForComplianceCaseController returns 400 for invalid caseId", async () => {
    const req: any = { params: { caseId: "bad" }, body: { vcHash: "abc" } };
    const res = makeRes();

    await revokeVcForComplianceCaseController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid caseId" });
    expect(mockedActionCaseByRevokingVc).not.toHaveBeenCalled();
  });

  it("revokeVcForComplianceCaseController returns case payload on success", async () => {
    mockedActionCaseByRevokingVc.mockResolvedValue({
      id: 10,
      status: "ACTIONED",
    });

    const req: any = {
      params: { caseId: "10" },
      body: { vcHash: "hash-abc", notes: "policy breach" },
    };
    const res = makeRes();

    await revokeVcForComplianceCaseController(req, res);

    expect(mockedActionCaseByRevokingVc).toHaveBeenCalledWith({
      caseId: 10,
      vcHash: "hash-abc",
      notes: "policy breach",
    });
    expect(res.json).toHaveBeenCalledWith({
      case: { id: 10, status: "ACTIONED" },
    });
  });

  it("dismissComplianceCaseController returns case payload on success", async () => {
    mockedDismissCase.mockResolvedValue({ id: 4, status: "DISMISSED" });

    const req: any = {
      params: { caseId: "4" },
      body: { notes: "insufficient evidence" },
    };
    const res = makeRes();

    await dismissComplianceCaseController(req, res);

    expect(mockedDismissCase).toHaveBeenCalledWith(4, "insufficient evidence");
    expect(res.json).toHaveBeenCalledWith({
      case: { id: 4, status: "DISMISSED" },
    });
  });

  it("listComplianceCasesController forwards filters", async () => {
    mockedListCases.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const req: any = { query: { status: "OPEN", wallet: "0xabc" } };
    const res = makeRes();

    await listComplianceCasesController(req, res);

    expect(mockedListCases).toHaveBeenCalledWith({
      status: "OPEN",
      wallet: "0xabc",
    });
    expect(res.json).toHaveBeenCalledWith({ cases: [{ id: 1 }, { id: 2 }] });
  });

  it("getComplianceProfileController returns 404 when profile is not found", async () => {
    mockedGetWalletProfile.mockResolvedValue(null);

    const req: any = { params: { wallet: "0xabc" } };
    const res = makeRes();

    await getComplianceProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Profile not found" });
  });

  it("revokeAnyVcController validates vcHash", async () => {
    const req: any = { body: {} };
    const res = makeRes();

    await revokeAnyVcController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "vcHash is required" });
    expect(mockedRevokeAnyVc).not.toHaveBeenCalled();
  });

  it("revokeAnyVcController returns service result", async () => {
    mockedRevokeAnyVc.mockResolvedValue({
      vcHash: "hash-1",
      txHash: "0xabc",
      notes: "manual",
    });

    const req: any = { body: { vcHash: "hash-1", notes: "manual" } };
    const res = makeRes();

    await revokeAnyVcController(req, res);

    expect(mockedRevokeAnyVc).toHaveBeenCalledWith({
      vcHash: "hash-1",
      notes: "manual",
    });
    expect(res.json).toHaveBeenCalledWith({
      vcHash: "hash-1",
      txHash: "0xabc",
      notes: "manual",
    });
  });

  it("listComplianceMonitoringLogsController sanitises bad numeric query values", async () => {
    mockedListMonitoringLogs.mockResolvedValue([{ id: 1 }]);

    const req: any = {
      query: {
        wallet: "0xabc",
        eventType: "JOB_CREATED",
        limit: "x",
        offset: "y",
      },
    };
    const res = makeRes();

    await listComplianceMonitoringLogsController(req, res);

    expect(mockedListMonitoringLogs).toHaveBeenCalledWith({
      wallet: "0xabc",
      eventType: "JOB_CREATED",
      limit: undefined,
      offset: undefined,
    });
    expect(res.json).toHaveBeenCalledWith({ logs: [{ id: 1 }] });
  });
});
