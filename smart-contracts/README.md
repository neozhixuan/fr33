## Running in local development

1. Compile the contract

```sh
npx hardhat compile
```

    - Compiles the solidity code
    - Generate ABI and Bytecode
    - No interaction with chain

2. Start localhost chain

```sh
npx hardhat node
```

```sh
Accounts
========

WARNING: Funds sent on live network to accounts with publicly known private keys WILL BE LOST.

Account #0:  0xf39fd6e51aad88f6f4ce6ab8... (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4...
```

3. Deploy the contract to local chain

```sh
npx hardhat ignition deploy ignition/modules/JobEscrow.ts
```

```sh
You are running Hardhat Ignition against an in-process instance of Hardhat Network.
This will execute the deployment, but the results will be lost.
You can use --network <network-name> to deploy to a different network.

Hardhat Ignition 🚀

Deploying [ JobEscrowModule ]

Batch #1
  Executed JobEscrowModule#JobEscrow

[ JobEscrowModule ] successfully deployed 🚀

Deployed Addresses

JobEscrowModule#JobEscrow - 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

4. Test the contract

```sh
npx hardhat test
```

```sh
# Example output
  JobEscrow
    ✔ should create and fund a job  (114ms)
    ✔ worker accepts job and gets paid (135ms)
```
