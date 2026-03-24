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

  it("opens dispute, freezes escrow, and admin resolves to worker", async function () {
    const { escrow, employer, worker, admin } = await deployFixture();

    const jobId = 2;
    const amount = ethers.parseEther("0.2");

    await escrow.connect(employer).fundJob(jobId, { value: amount });
    await escrow.connect(worker).acceptJob(jobId);
    await escrow.connect(worker).requestRelease(jobId);

    await escrow.connect(worker).openDispute(jobId);

    const disputedJob = await escrow.getJob(jobId);
    expect(disputedJob.state).to.equal(4); // DISPUTED
    expect(disputedJob.isFrozen).to.equal(true);

    await expect(
      escrow.connect(employer).approveRelease(jobId),
    ).to.be.revertedWith("Job not pending approval");

    const reason = "Worker provided complete delivery proof";
    await escrow.connect(admin).resolveDispute(jobId, 0, 0, reason); // RELEASE_TO_WORKER

    const resolvedJob = await escrow.getJob(jobId);
    expect(resolvedJob.state).to.equal(3); // COMPLETED
    expect(resolvedJob.isFrozen).to.equal(false);
    expect(resolvedJob.amount).to.equal(0);

    const resolution = await escrow.getDisputeResolution(jobId);
    expect(resolution.exists).to.equal(true);
    expect(resolution.reason).to.equal(reason);
  });

  it("auto-releases funds after timeout when employer is inactive", async function () {
    const { escrow, employer, worker } = await deployFixture();

    const jobId = 3;
    const amount = ethers.parseEther("0.15");
    const timeoutSeconds = 3600;

    await escrow.connect(employer).fundJob(jobId, { value: amount });
    await escrow.connect(worker).acceptJob(jobId);
    await escrow.connect(worker).requestRelease(jobId);

    await ethers.provider.send("evm_increaseTime", [timeoutSeconds + 1]);
    await ethers.provider.send("evm_mine", []);

    await escrow
      .connect(employer)
      .autoReleaseAfterTimeout(jobId, timeoutSeconds);

    const completedJob = await escrow.getJob(jobId);
    expect(completedJob.state).to.equal(3); // COMPLETED
    expect(completedJob.amount).to.equal(0);
  });
});
