import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { issueVCController } from "../vc.controller";

jest.mock("../../services/issuer/vcIssuer.service", () => ({
  issueVC: jest.fn(),
}));

import { issueVC } from "../../services/issuer/vcIssuer.service";

const mockedIssueVC = issueVC as any;

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("vc.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for missing payload fields", async () => {
    const req: any = { body: { subjectDid: "did:ethr:abc" } };
    const res = makeRes();

    await issueVCController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid payload: missing subjectDid or kycData",
    });
  });

  it("returns VC issuance result for valid payload", async () => {
    mockedIssueVC.mockResolvedValue({ success: true, vcJwt: "token" });

    const req: any = {
      body: {
        subjectDid: "did:ethr:polygon:amoy:0x123",
        kycData: { name: "Alice" },
      },
    };
    const res = makeRes();

    await issueVCController(req, res);

    expect(mockedIssueVC).toHaveBeenCalledWith({
      subjectDid: "did:ethr:polygon:amoy:0x123",
      kycData: { name: "Alice" },
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, vcJwt: "token" });
  });

  it("returns 500 when issuer service throws", async () => {
    mockedIssueVC.mockRejectedValue(new Error("issuer unavailable"));

    const req: any = {
      body: {
        subjectDid: "did:ethr:polygon:amoy:0x123",
        kycData: { name: "Bob" },
      },
    };
    const res = makeRes();

    await issueVCController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "VC issuance failed due to error: issuer unavailable",
    });
  });
});
