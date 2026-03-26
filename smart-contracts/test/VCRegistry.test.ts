import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("VCRegistry", function () {
  /**
   * Setup variables for each test case
   * @returns registry, owner, issuer, subject, randomUser
   */
  async function deployFixture() {
    const [owner, issuer, subject, randomUser] = await ethers.getSigners();

    const VCRegistry = await ethers.getContractFactory("VCRegistry");
    const registry = await VCRegistry.deploy();

    await registry.connect(owner).setAuthorisedIssuer(issuer.address, true);

    return { registry, owner, issuer, subject, randomUser };
  }

  // TC 1
  it("registers a credential hash with minimal metadata", async function () {
    const { registry, issuer, subject } = await deployFixture();

    const block = await ethers.provider.getBlock("latest");
    const now = block?.timestamp ?? Math.floor(Date.now() / 1000);
    const expiresAt = now + 3600;
    const vcHash = ethers.keccak256(ethers.toUtf8Bytes("signed-vc-jwt"));

    await expect(
      registry
        .connect(issuer)
        .registerCredential(vcHash, subject.address, expiresAt),
    )
      .to.emit(registry, "VCIssued")
      .withArgs(vcHash, subject.address, issuer.address, expiresAt);

    const credential = await registry.getCredential(vcHash);
    expect(credential.subject).to.equal(subject.address);
    expect(credential.issuer).to.equal(issuer.address);
    expect(credential.isRevoked).to.equal(false);
    expect(await registry.isValid(vcHash, subject.address)).to.equal(true);
  });

  it("allows issuer to revoke and invalidates the credential", async function () {
    const { registry, issuer, subject } = await deployFixture();

    const block = await ethers.provider.getBlock("latest");
    const now = block?.timestamp ?? Math.floor(Date.now() / 1000);
    const vcHash = ethers.keccak256(ethers.toUtf8Bytes("signed-vc-jwt-2"));

    await registry
      .connect(issuer)
      .registerCredential(vcHash, subject.address, now + 3600);

    await expect(registry.connect(issuer).revokeCredentialHash(vcHash))
      .to.emit(registry, "VCRevoked")
      .withArgs(vcHash, issuer.address);

    expect(await registry.isValid(vcHash, subject.address)).to.equal(false);
  });

  it("rejects registration by unauthorised issuer", async function () {
    const { registry, randomUser, subject } = await deployFixture();

    const block = await ethers.provider.getBlock("latest");
    const now = block?.timestamp ?? Math.floor(Date.now() / 1000);
    const vcHash = ethers.keccak256(ethers.toUtf8Bytes("signed-vc-jwt-3"));

    await expect(
      registry
        .connect(randomUser)
        .registerCredential(vcHash, subject.address, now + 3600),
    ).to.be.revertedWith("Unauthorised issuer");
  });

  it("marks credential invalid after expiry", async function () {
    const { registry, issuer, subject } = await deployFixture();

    const block = await ethers.provider.getBlock("latest");
    const now = block?.timestamp ?? Math.floor(Date.now() / 1000);
    const vcHash = ethers.keccak256(ethers.toUtf8Bytes("signed-vc-jwt-4"));

    await registry
      .connect(issuer)
      .registerCredential(vcHash, subject.address, now + 10);

    await ethers.provider.send("evm_increaseTime", [11]);
    await ethers.provider.send("evm_mine", []);

    expect(await registry.isValid(vcHash, subject.address)).to.equal(false);
  });

  it("registers credential via issuer authorisation signature", async function () {
    const { registry, issuer, subject } = await deployFixture();

    const nonce = await registry.nonces(subject.address);
    const block = await ethers.provider.getBlock("latest");
    const now = block?.timestamp ?? Math.floor(Date.now() / 1000);
    const expiresAt = now + 3600;
    const deadline = now + 900;
    const vcHash = ethers.keccak256(ethers.toUtf8Bytes("signed-vc-jwt-5"));

    const network = await ethers.provider.getNetwork();
    const signature = await issuer.signTypedData(
      {
        name: "VCRegistry",
        version: "1",
        chainId: Number(network.chainId),
        verifyingContract: await registry.getAddress(),
      },
      {
        RegisterCredential: [
          { name: "vcHash", type: "bytes32" },
          { name: "subject", type: "address" },
          { name: "expiresAt", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      {
        vcHash,
        subject: subject.address,
        expiresAt,
        nonce,
        deadline,
      },
    );

    await registry
      .connect(subject)
      .registerCredentialWithAuthorisation(
        vcHash,
        subject.address,
        expiresAt,
        nonce,
        deadline,
        signature,
      );

    expect(await registry.isValid(vcHash, subject.address)).to.equal(true);
    expect(await registry.nonces(subject.address)).to.equal(nonce + 1n);
  });

  it("rejects revoke by non-issuer account", async function () {
    const { registry, issuer, subject, randomUser } = await deployFixture();

    const block = await ethers.provider.getBlock("latest");
    const now = block?.timestamp ?? Math.floor(Date.now() / 1000);
    const vcHash = ethers.keccak256(ethers.toUtf8Bytes("signed-vc-jwt-6"));

    await registry
      .connect(issuer)
      .registerCredential(vcHash, subject.address, now + 3600);

    await expect(
      registry.connect(randomUser).revokeCredentialHash(vcHash),
    ).to.be.revertedWith("Only issuer can revoke");
  });
});
