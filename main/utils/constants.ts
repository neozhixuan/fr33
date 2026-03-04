export const POL_TO_SGD_RATE = 6.5721; // 1 SGD = 6.5721 POL
export const SGD_TO_POL_RATE = 1 / POL_TO_SGD_RATE; // 1 POL = 0.1522 SGD

export const ESCROW_ABI = [
  "function fundJob(uint256 jobId) external payable",
  "function acceptJob(uint256 jobId) external",
  "function requestRelease(uint256 jobId) external",
  "function approveRelease(uint256 jobId) external",
  "function cancelJob(uint256 jobId) external",
  "function raiseDispute(uint256 jobId) external",
  "function resolveDispute(uint256 jobId, address winner, uint256 percentage) external",
  "function getJob(uint256 jobId) external view returns (address, address, uint256, uint8, uint256)",
  "event JobCreated(uint256 indexed jobId, address indexed employer, uint256 amount)",
  "event JobAccepted(uint256 indexed jobId, address indexed worker)",
  "event ReleaseRequested(uint256 indexed jobId)",
  "event FundsReleased(uint256 indexed jobId, address indexed worker, uint256 amount)",
  "event DisputeRaised(uint256 indexed jobId)",
  "event DisputeResolved(uint256 indexed jobId, address indexed winner, uint256 amount)",
  "event JobCancelled(uint256 indexed jobId)",
];
