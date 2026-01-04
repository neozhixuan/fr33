import { Request, Response } from "express";
import { issueVC } from "../services/vcIssuer.service";

export const issueVCController = async (req: Request, res: Response) => {
  try {
    const { subjectDid, kycData } = req.body;

    if (!subjectDid || !kycData) {
      return res
        .status(400)
        .json({ error: "Invalid payload: missing subjectDid or kycData" });
    }

    const result = await issueVC({ subjectDid, kycData });

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "VC issuance failed" });
  }
};
