// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Declare a new smart contract
contract Counter {
	// Accessible from outside of the contract
	// - Creates a getter function so anyone can read it
	// - Default = 0
  uint public x;

	// Log activities in the blockchain
	// - Tracks whenever `by` changes
  event Increment(uint by);

	// Accessible from outside of the contract
  function inc() public {
    x++;
    emit Increment(1);
  }

  function incBy(uint by) public {
    require(by > 0, "incBy: increment should be positive");
    x += by;
    emit Increment(by);
  }
}
