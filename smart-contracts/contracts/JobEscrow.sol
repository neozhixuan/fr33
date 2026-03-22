// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract JobEscrow is Pausable, ReentrancyGuard {
    enum JobState {
        FUNDED,
        IN_PROGRESS,
        PENDING_APPROVAL,
        COMPLETED,
        DISPUTED,
        CANCELLED
    }

    enum DisputeResolution {
        RELEASE_TO_WORKER,
        RETURN_TO_EMPLOYER,
        SPLIT
    }

    struct Job {
        address employer;
        address worker;
        uint256 amount;
        JobState state;
        uint256 createdAt;
        uint256 releaseRequestedAt;
        bool isFrozen;
    }

    // Public variables (have an automatic getter function)
    mapping(uint256 => Job) public jobs; // Dictionary of ID to Job
    uint256 public jobCounter;
    address public admin;

    // Events
    event JobCreated(
        uint256 indexed jobId,
        address indexed employer,
        uint256 amount
    );
    event JobAccepted(uint256 indexed jobId, address indexed worker);
    event ReleaseRequested(uint256 indexed jobId);
    event FundsReleased(
        uint256 indexed jobId,
        address indexed worker,
        uint256 amount
    );
    event JobCancelled(uint256 indexed jobId);
    event AdminUpdated(address indexed previousAdmin, address indexed newAdmin);
    event ContractPaused(address indexed admin);
    event ContractUnpaused(address indexed admin);
    event EscrowFrozen(uint256 indexed jobId, address indexed triggeredBy);
    event EscrowUnfrozen(uint256 indexed jobId, address indexed triggeredBy);
    event DisputeOpened(uint256 indexed jobId, address indexed raisedBy);
    event DisputeResolved(
        uint256 indexed jobId,
        DisputeResolution resolution,
        uint16 workerShareBps,
        uint256 workerAmount,
        uint256 employerAmount
    );
    event TimeoutAutoReleaseExecuted(
        uint256 indexed jobId,
        address indexed triggeredBy,
        uint256 amount,
        uint256 deadline
    );

    // Modifiers
    modifier onlyEmployer(uint256 jobId) {
        require(jobs[jobId].employer == msg.sender, "Not employer");
        _;
    }
    modifier onlyWorker(uint256 jobId) {
        require(jobs[jobId].worker == msg.sender, "Not worker");
        _;
    }
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }
    modifier jobExists(uint256 jobId) {
        require(jobs[jobId].employer != address(0), "Job does not exist");
        _;
    }

    // The admin is the creator of this smart contract.
    constructor() {
        admin = msg.sender;
        jobCounter = 0;
    }

    /*
    @title Create a new job escrow
    @notice Employer creates a new job and funds the escrow
    @param jobId The unique ID for the job
    @param worker The address of the worker
    */
    function fundJob(uint256 jobId) external payable whenNotPaused {
        require(msg.value > 0, "Must send funds");

        Job storage existingJob = jobs[jobId];
        // Allow funding if job doesn't exist OR was previously cancelled
        require(
            existingJob.employer == address(0) ||
                existingJob.state == JobState.CANCELLED,
            "Job already exists and is not cancelled"
        );

        jobs[jobId] = Job({
            employer: msg.sender,
            worker: address(0),
            amount: msg.value,
            state: JobState.FUNDED,
            createdAt: block.timestamp,
            releaseRequestedAt: 0,
            isFrozen: false
        });

        jobCounter++;

        emit JobCreated(jobId, msg.sender, msg.value);
    }

    /*
    @title Worker accepts a job
    @notice Worker accepts the job to start working
    @param jobId The unique ID for the job
    */
    function acceptJob(uint256 jobId) external jobExists(jobId) whenNotPaused {
        Job storage job = jobs[jobId];
        require(job.state == JobState.FUNDED, "Job not funded");
        require(job.worker == address(0), "Job already accepted");
        require(msg.sender != job.employer, "Employer cannot be worker");

        job.worker = msg.sender;
        job.state = JobState.IN_PROGRESS;

        emit JobAccepted(jobId, msg.sender);
    }

    /*
    @title Worker requests to release funds from escrow
    @param jobId The unique ID for the job
    */
    function requestRelease(
        uint256 jobId
    ) external jobExists(jobId) onlyWorker(jobId) whenNotPaused {
        Job storage job = jobs[jobId];
        require(job.state == JobState.IN_PROGRESS, "Job not in progress");
        require(!job.isFrozen, "Escrow frozen");

        job.state = JobState.PENDING_APPROVAL;
        job.releaseRequestedAt = block.timestamp;

        emit ReleaseRequested(jobId);
    }

    /*
    @title Employer approves the release of funds to worker
    @param jobId The unique ID for the job
    */
    function approveRelease(
        uint256 jobId
    ) external jobExists(jobId) onlyEmployer(jobId) whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        require(
            job.state == JobState.PENDING_APPROVAL,
            "Job not pending approval"
        );
        require(!job.isFrozen, "Escrow frozen");
        require(job.worker != address(0), "Worker not set");
        require(job.amount > 0, "No funds to release");

        job.state = JobState.COMPLETED;

        uint256 amount = job.amount;
        address worker = job.worker;
        job.amount = 0;

        (bool success, ) = worker.call{value: amount}("");
        require(success, "Transfer to worker failed");

        emit FundsReleased(jobId, worker, amount);
    }

    /*
    @title Employer cancels the job and refunds the escrow
    @param jobId The unique ID for the job  
    */
    function cancelJob(
        uint256 jobId
    ) external jobExists(jobId) onlyEmployer(jobId) whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        require(
            job.state == JobState.FUNDED,
            "Job cannot be cancelled at this stage"
        );
        require(!job.isFrozen, "Escrow frozen");
        require(job.amount > 0, "No funds to refund");

        job.state = JobState.CANCELLED;

        uint256 amount = job.amount;
        address employer = job.employer;
        job.amount = 0;

        (bool success, ) = employer.call{value: amount}("");
        require(success, "Refund to employer failed");

        emit FundsReleased(jobId, employer, amount);
        emit JobCancelled(jobId);
    }

    /*
    @title Get the job details from on-chain
    @param jobId The unique ID for the job
    */
    function getJob(
        uint256 jobId
    )
        external
        view
        jobExists(jobId)
        returns (
            address employer,
            address worker,
            uint256 amount,
            JobState state,
            uint256 createdAt,
            uint256 releaseRequestedAt,
            bool isFrozen
        )
    {
        Job memory job = jobs[jobId];
        return (
            job.employer,
            job.worker,
            job.amount,
            job.state,
            job.createdAt,
            job.releaseRequestedAt,
            job.isFrozen
        );
    }

    function openDispute(
        uint256 jobId
    ) external jobExists(jobId) whenNotPaused {
        Job storage job = jobs[jobId];
        require(
            msg.sender == job.employer || msg.sender == job.worker,
            "Only employer or worker"
        );
        require(
            job.state == JobState.IN_PROGRESS ||
                job.state == JobState.PENDING_APPROVAL,
            "Dispute not allowed for this state"
        );
        require(!job.isFrozen, "Escrow already frozen");

        job.isFrozen = true;
        job.state = JobState.DISPUTED;

        emit EscrowFrozen(jobId, msg.sender);
        emit DisputeOpened(jobId, msg.sender);
    }

    function adminFreezeEscrow(
        uint256 jobId
    ) external onlyAdmin jobExists(jobId) whenNotPaused {
        Job storage job = jobs[jobId];
        require(
            job.state == JobState.IN_PROGRESS ||
                job.state == JobState.PENDING_APPROVAL,
            "Freeze not allowed for this state"
        );
        require(!job.isFrozen, "Escrow already frozen");

        job.isFrozen = true;
        job.state = JobState.DISPUTED;

        emit EscrowFrozen(jobId, msg.sender);
    }

    function resolveDispute(
        uint256 jobId,
        DisputeResolution resolution,
        uint16 workerShareBps
    ) external onlyAdmin jobExists(jobId) whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        require(job.state == JobState.DISPUTED, "Job not disputed");
        require(job.isFrozen, "Escrow not frozen");
        require(job.amount > 0, "No funds to resolve");
        require(job.worker != address(0), "Worker not set");

        uint256 amount = job.amount;
        uint256 workerAmount = 0;
        uint256 employerAmount = 0;

        if (resolution == DisputeResolution.RELEASE_TO_WORKER) {
            workerAmount = amount;
        } else if (resolution == DisputeResolution.RETURN_TO_EMPLOYER) {
            employerAmount = amount;
        } else {
            require(workerShareBps <= 10_000, "Invalid split bps");
            workerAmount = (amount * workerShareBps) / 10_000;
            employerAmount = amount - workerAmount;
        }

        job.amount = 0;
        job.isFrozen = false;
        job.state = resolution == DisputeResolution.RETURN_TO_EMPLOYER
            ? JobState.CANCELLED
            : JobState.COMPLETED;

        if (workerAmount > 0) {
            (bool workerSuccess, ) = job.worker.call{value: workerAmount}("");
            require(workerSuccess, "Transfer to worker failed");
        }

        if (employerAmount > 0) {
            (bool employerSuccess, ) = job.employer.call{value: employerAmount}(
                ""
            );
            require(employerSuccess, "Refund to employer failed");
        }

        emit DisputeResolved(
            jobId,
            resolution,
            workerShareBps,
            workerAmount,
            employerAmount
        );
        emit EscrowUnfrozen(jobId, msg.sender);
    }

    function autoReleaseAfterTimeout(
        uint256 jobId,
        uint256 timeoutSeconds
    ) external jobExists(jobId) whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        require(
            job.state == JobState.PENDING_APPROVAL,
            "Job not pending approval"
        );
        require(!job.isFrozen, "Escrow frozen");
        require(job.worker != address(0), "Worker not set");
        require(job.amount > 0, "No funds to release");
        require(job.releaseRequestedAt > 0, "Release not requested");

        uint256 deadline = job.releaseRequestedAt + timeoutSeconds;
        require(block.timestamp >= deadline, "Timeout not reached");

        uint256 amount = job.amount;
        address worker = job.worker;
        job.amount = 0;
        job.state = JobState.COMPLETED;

        (bool success, ) = worker.call{value: amount}("");
        require(success, "Transfer to worker failed");

        emit FundsReleased(jobId, worker, amount);
        emit TimeoutAutoReleaseExecuted(jobId, msg.sender, amount, deadline);
    }

    function getReleaseDeadline(
        uint256 jobId,
        uint256 timeoutSeconds
    ) external view jobExists(jobId) returns (uint256 deadline) {
        Job memory job = jobs[jobId];
        if (job.releaseRequestedAt == 0) {
            return 0;
        }
        return job.releaseRequestedAt + timeoutSeconds;
    }

    /*
    @title Transfer admin rights to the new admin
    @param newAdmin address of the incumbent admin
    */
    function updateAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid address of incumbent admin");
        address previousAdmin = admin;
        admin = newAdmin;
        emit AdminUpdated(previousAdmin, newAdmin);
    }

    function pause() external onlyAdmin {
        _pause();
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyAdmin {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    receive() external payable {
        revert("Direct ETH transfer not allowed");
    }

    fallback() external payable {
        revert("Invalid call");
    }
}
