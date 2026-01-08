import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

// Escrow contract test suite
describe("JobEscrow", function () {
  /**
   * Setup variables for each test case
   * @returns escrow, admin, employer, worker
   */
  async function deployFixture() {
    const [admin, employer, worker] = await ethers.getSigners();

    const JobEscrow = await ethers.getContractFactory("JobEscrow");
    const escrow = await JobEscrow.deploy();

    return { escrow, admin, employer, worker };
  }

  // TC 1
  it("should create and fund a job ", async function () {
    const { escrow, employer, worker } = await deployFixture();

    const jobId = 1;
    const amount = ethers.parseEther("0.1");

    await escrow.connect(employer).fundJob(jobId, { value: amount });

    const job = await escrow.getJob(jobId);

    expect(job.amount).to.equal(amount);
    expect(job.state).to.equal(0); // 0 = FUNDED
  });

  // TC 2
  it("worker accepts job and gets paid", async function () {
    const { escrow, employer, worker } = await deployFixture();

    const jobId = 1;
    const amount = ethers.parseEther("0.1");

    await escrow.connect(employer).fundJob(jobId, { value: amount });

    await escrow.connect(worker).acceptJob(jobId);
    await escrow.connect(worker).requestRelease(jobId);

    const before = await ethers.provider.getBalance(worker.address);

    await escrow.connect(employer).approveRelease(jobId);

    const after = await ethers.provider.getBalance(worker.address);

    expect(after).to.be.gt(before);
  });
});
