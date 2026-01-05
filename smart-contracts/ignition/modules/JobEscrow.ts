import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("JobEscrowModule", (m) => {
  const jobEscrow = m.contract("JobEscrow");

  return { jobEscrow };
});
