## Running in local development

1. Compile the contract

```sh
npx hardhat compile
```

    - Compiles the solidity code
      - The tests depend on the structure of the compiled code
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

## Running in testnet

1. Clear existing deployments in hardhat cache

```sh
rm -rf ./ignition/deployments/chain-80002
```

2. Try to deploy

```sh
npm run deploy:polygonAmoy
```

```sh
> smart-contracts@1.0.0 deploy:polygonAmoy
> npx hardhat ignition deploy ignition/modules/JobEscrow.ts --network polygonAmoy

npm info using npm@10.9.0
npm info using node@v22.10.0
npm info config found workspace root at C:\Users\Zhixuan\Documents\GitHub\fr33
√ Confirm deploy to network polygonAmoy (80002)? ... yes
Hardhat Ignition 🚀

Deploying [ JobEscrowModule ]

Batch #1
  Executed JobEscrowModule#JobEscrow

[ JobEscrowModule ] successfully deployed 🚀

Deployed Addresses

JobEscrowModule#JobEscrow - 0xf92e8E9b3BE190a4bF7bdcC19e9f10094C712481
```

If it fails due to pending transactions, can consider using a new wallet and swapping the ADMIN_PRIVATE_KEY to that

Update the ESCROW_CONTRACT_ADDRESS in .env
