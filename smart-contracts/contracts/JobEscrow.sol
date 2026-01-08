// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract JobEscrow {
    enum JobState {
        FUNDED,
        IN_PROGRESS,
        PENDING_APPROVAL,
        COMPLETED,
        DISPUTED,
        CANCELLED
    }

    struct Job {
        address employer;
        address worker;
        uint256 amount;
        JobState state;
        uint256 createdAt;
    }

    // Public variables (have an automatic getter function)
    mapping(uint256 => Job) public jobs; // Dictionary of ID to Job
    uint256 public jobCounter;
    address public admin;

    // Events
    // TODO: indexed
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

    // Modifiers
    modifier onlyEmployer(uint256 jobId) {
        require(jobs[jobId].employer == msg.sender, "Not employer");
        _; // TODO
    }
    modifier onlyWorker(uint256 jobId) {
        require(jobs[jobId].worker == msg.sender, "Not worker");
        _; // TODO
    }
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _; // TODO
    }
    modifier jobExists(uint256 jobId) {
        require(jobs[jobId].employer != address(0), "Job does not exist");
        _; // TODO
    }

    constructor() {
        admin = msg.sender; // TODO
        jobCounter = 0;
    }

    /*
    @title Create a new job escrow
    @notice Employer creates a new job and funds the escrow
    @param jobId The unique ID for the job
    @param worker The address of the worker
    */
    function fundJob(uint256 jobId) external payable {
        require(msg.value > 0, "Must send funds");
        require(jobs[jobId].employer == address(0), "Job already exists");

        jobs[jobId] = Job({
            employer: msg.sender,
            worker: address(0),
            amount: msg.value,
            state: JobState.FUNDED,
            createdAt: block.timestamp
        });

        jobCounter++;

        emit JobCreated(jobId, msg.sender, msg.value);
    }

    /*
    @title Worker accepts a job
    @notice Worker accepts the job to start working
    @param jobId The unique ID for the job
    */
    function acceptJob(uint256 jobId) external jobExists(jobId) {
        Job storage job = jobs[jobId];
        require(job.state == JobState.FUNDED, "Job not funded");
        require(job.worker == address(0), "Job already accepted");

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
    ) external jobExists(jobId) onlyWorker(jobId) {
        Job storage job = jobs[jobId];
        require(job.state == JobState.IN_PROGRESS, "Job not in progress");

        job.state = JobState.PENDING_APPROVAL;

        emit ReleaseRequested(jobId);
    }

    // TODO external
    /*
    @title Employer approves the release of funds to worker
    @param jobId The unique ID for the job
    */
    function approveRelease(
        uint256 jobId
    ) external jobExists(jobId) onlyEmployer(jobId) {
        Job storage job = jobs[jobId];
        require(
            job.state == JobState.PENDING_APPROVAL,
            "Job not pending approval"
        );

        job.state = JobState.COMPLETED;

        uint256 amount = job.amount;
        address worker = job.worker;

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
    ) external jobExists(jobId) onlyEmployer(jobId) {
        Job storage job = jobs[jobId];
        require(
            job.state == JobState.FUNDED,
            "Job cannot be cancelled at this stage"
        );

        job.state = JobState.CANCELLED;

        uint256 amount = job.amount;
        address employer = job.employer;

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
            uint256 createdAt
        )
    {
        // TODO memory
        Job memory job = jobs[jobId];
        return (job.employer, job.worker, job.amount, job.state, job.createdAt);
    }

    /*
    @title Transfer admin rights to the new admin
    @param newAdmin address of the incumbent admin
    */
    function updateAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid address of incumbent admin");
        admin = newAdmin;
    }
}
