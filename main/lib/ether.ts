import { ethers } from "ethers";

export const ESCROW_CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS!;
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY!;
const RPC_URL = process.env.RPC_URL!;

const ESCROW_ABI = [
  "function createEscrow(uint256 jobId) external payable",
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

export function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getContract(signerOrProvider: ethers.Provider | ethers.Signer) {
  return new ethers.Contract(
    ESCROW_CONTRACT_ADDRESS,
    ESCROW_ABI,
    signerOrProvider
  );
}

export function getAdminSigner() {
  const provider = getProvider();
  return new ethers.Wallet(PRIVATE_KEY, provider);
}

export function parseEther(amountInEth: string): bigint {
  return ethers.parseEther(amountInEth);
}
