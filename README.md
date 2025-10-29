# fr33

A blueprint for the first trust-minimised, compliance-aware online marketplace for freelance service payments in Singapore.

## Setup

### Prerequisites:
1. Node v22.20.0
```sh
# For macOS or Linux users
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install 22
nvm use 22
```
2. Hardhat v3 with Ethers.js integration and Mocha testing framework
```sh
npm install --save-dev hardhat
```
3. Solidity 0.8.28

### Steps to Set Up the Project:

1. Clone the repository:

```sh
git clone https://github.com/neozhixuan/fr33.git
```

2. Install dependencies:

```sh
# This installs dependencies from all folders' (FE, BE and Blockchain) package.json due to the "workspaces" field in package.json and compiles it to a single node_modules/
# Install all dependencies (root + all workspaces)
npm install

# Build everything
npm run build
```

3. Set up your environment variables:

   - Create a `.env` file in the root directory.
   - Add your Ethereum Sepolia testnet RPC URL and private key:
     ```
     SEPOLIA_RPC_URL=your_sepolia_rpc_url
     PRIVATE_KEY=your_private_key
     ```

4. Run everything

```sh
# Test everything
npm run test

# Work on specific parts
npm run dev:frontend
```

## Debugging issues

You can remove `node_modules` and reinstall necessary libraries in case of conflicting dependencies:

```sh
rm -rf node_modules package-lock.json
npm install
```
