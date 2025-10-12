import { network } from "hardhat";

// Fetch the execution environment from the Hardhat network
const { ethers } = await network.connect();

async function main() {
  // Deploy the contract
  const counter = await ethers.deployContract("Counter");
  await counter.waitForDeployment();

  // Get the contract's address
  const address = await counter.getAddress();

  // Get initial value
  let currentValue = await counter.x();
  console.log(`Initial counter value: ${currentValue}\n`);

  // Increment by 1
  console.log("Calling inc() function...\n");
  const tx1 = await counter.inc();
  await tx1.wait();

  currentValue = await counter.x();
  console.log(`Counter value after inc(): ${currentValue}\n`);

  // Increment by 5
  console.log("Calling incBy(5) function...\n");
  const tx2 = await counter.incBy(5);
  await tx2.wait();

  currentValue = await counter.x();
  console.log(`Counter value after incBy(5): ${currentValue}\n`);

  // Listen for events
  console.log("Getting all Increment events...\n");
  const events = await counter.queryFilter(counter.filters.Increment());

  events.forEach((event, index) => {
    console.log(`Event ${index + 1}: Incremented by ${event.args.by}\n`);
  });

  console.log("Interaction complete\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
