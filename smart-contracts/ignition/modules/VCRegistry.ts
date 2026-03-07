import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VCRegistryModule", (m) => {
  const VCRegistryEscrow = m.contract("VCRegistry");

  return { VCRegistryEscrow };
});
