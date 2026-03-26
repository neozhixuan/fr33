import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  buildVcRegistrationAuthorisation,
  revokeVcRegistryTx,
} from "../blockchain.service";

jest.mock("../../../lib/ether", () => ({
  getIssuerAuthorisationSigner: jest.fn(),
  getProvider: jest.fn(),
  getVcRegistryReadContract: jest.fn(),
  getVcRegistryWriteContract: jest.fn(),
}));

import {
  getIssuerAuthorisationSigner,
  getProvider,
  getVcRegistryReadContract,
  getVcRegistryWriteContract,
} from "../../../lib/ether";

const mockedGetProvider = getProvider as any;
const mockedGetReadContract = getVcRegistryReadContract as any;
const mockedGetWriteContract = getVcRegistryWriteContract as any;
const mockedGetSigner = getIssuerAuthorisationSigner as any;

describe("blockchain.service", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("builds registration authorisation payload with expected fields", async () => {
    const signTypedData = jest.fn(async () => "0xsig");
    mockedGetSigner.mockReturnValue({ signTypedData });

    mockedGetProvider.mockReturnValue({
      getNetwork: jest.fn(async () => ({ chainId: 80002n })),
    });

    mockedGetReadContract.mockResolvedValue({
      getAddress: jest.fn(async () => "0xRegistry"),
      nonces: jest.fn(async () => 3n),
    });

    const result = await buildVcRegistrationAuthorisation(
      "a".repeat(64),
      "did:ethr:polygon:amoy:0x1234567890123456789012345678901234567890",
      1_900_000_000,
    );

    expect(result.vcHash).toBe(`0x${"a".repeat(64)}`);
    expect(result.subjectAddress).toBe(
      "0x1234567890123456789012345678901234567890",
    );
    expect(result.nonce).toBe("3");
    expect(result.signature).toBe("0xsig");
    expect(signTypedData).toHaveBeenCalledTimes(1);
  });

  it("revokeVcRegistryTx uses hash route for bytes32 vc hash", async () => {
    const wait = jest.fn(async () => ({ hash: "0xtxhash" }));
    const revokeCredentialHash = jest.fn(async () => ({ wait }));
    const revokeCredential = jest.fn();

    mockedGetWriteContract.mockResolvedValue({
      revokeCredentialHash,
      revokeCredential,
    });

    const txHash = await revokeVcRegistryTx("b".repeat(64));

    expect(txHash).toBe("0xtxhash");
    expect(revokeCredentialHash).toHaveBeenCalledWith(`0x${"b".repeat(64)}`);
    expect(revokeCredential).not.toHaveBeenCalled();
  });

  it("revokeVcRegistryTx wraps underlying errors", async () => {
    mockedGetWriteContract.mockResolvedValue({
      revokeCredentialHash: jest.fn(async () => {
        throw new Error("boom");
      }),
      revokeCredential: jest.fn(),
    });

    await expect(revokeVcRegistryTx("0x" + "c".repeat(64))).rejects.toThrow(
      "[revokeVcRegistryTx] Error revoking VC: boom",
    );
  });
});
