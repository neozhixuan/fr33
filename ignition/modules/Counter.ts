import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Module tutorial: https://hardhat.org/ignition/docs/guides/creating-modules
// BuildModule takes a unique name e.g. "CounterModule", and a callback function, which is the content of the module
export default buildModule("CounterModule", (m) => {
  // Deploy the Counter.sol contract
  const counter = m.contract("Counter");

  m.call(counter, "incBy", [5n]);

  return { counter };
});
