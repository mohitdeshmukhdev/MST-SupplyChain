To ensure your machine can handle a production-level, concurrent Web3 and enterprise backend architecture without throwing environment compilation errors during your 15–20 hour vibe-coding session, you must establish a verified developer sandbox.
Below is the definitive list of prerequisites, installation commands, and terminal validation checks used in enterprise software environments.
------------------------------
## 🗄️ 1. Node.js Runtime & Node Package Manager (NPM)
Node.js executes your NestJS backend, Hardhat compilation suite, and Next.js frontend framework.

* Enterprise Specification: Version 20.x or 22.x (Long-Term Support - LTS). Do not use odd-numbered versions (e.g., 21, 23) in enterprise projects due to instability.
* How to Test: Open your terminal and run:

node -v
npm -v

* Expected Success Output: v20.x.x or v22.x.x and 10.x.x (or higher).
* What to do if missing/wrong: Install via nvm (Node Version Manager) or download directly from the Node.js Official Website.

------------------------------
## 🐳 2. Docker & Docker Compose
Docker isolates and runs your persistent infrastructure—specifically your local instance of PostgreSQL and the high-speed Redis instance required by BullMQ to manage blockchain nonces.

* Enterprise Specification: Docker Desktop v25.x (or higher) with Docker Compose v2.x.
* How to Test: Run these commands to verify the Docker engine status and composition utility:

docker --version
docker compose version

* Expected Success Output: Docker version 25.x.x... and Docker Compose version v2.x.x...
* What to do if missing/wrong: Download and run the background engine setup wizard via Docker Desktop.

------------------------------
## 🛠️ 3. Git Version Control System
Git manages your repository footprint, code branches, and workspace state changes between atomic AI generation iterations.

* Enterprise Specification: Version 2.40.x or higher.
* How to Test: Run this verification command:

git --version

* Expected Success Output: git version 2.x.x
* What to do if missing/wrong: Install via your system package manager or download it directly from Git SCM.

------------------------------
## 🦊 4. Web3 Wallet (MetaMask)
Required only for the System Administrator dashboard authentication, contract ownership initialization, and funding the deployer address on the MST testnet.

* Enterprise Specification: MetaMask Browser Extension with a newly generated development seed phrase. (Never use your personal mainnet wallet for engineering sandboxes).
* How to Test: Open your Google Chrome or Brave browser developer tools console (F12), switch to the Console tab, and enter:

window.ethereum ? "MetaMask Detected" : "MetaMask Missing"

* Expected Success Output: "MetaMask Detected"
* What to do if missing/wrong: Add the extension directly via the MetaMask Official Download Page.

------------------------------
## 🌐 5. MST Testnet Native Network Assets (tMST)
Your deployer wallet needs test network currency to submit contracts and modify states on the MST Blockchain testnet during execution.

* Enterprise Specification: A MetaMask account holding at least 5 to 10 test tokens (tMST).
* How to Test: Open MetaMask, ensure you have configured the network parameters (Chain ID: 4545, RPC: https://mstblockchain.com), and verify the token inventory balance in your primary UI panel.
* Expected Success Output: An inventory balance showing > 1.0 tMST.
* What to do if missing/wrong: Navigate to the official MST ecosystem faucet or request developer test credits directly from the community channel handlers.

------------------------------
## 💳 6. ChainPay.biz Developer Sandbox API Access
Your payment module needs access credentials to interact with the billing framework.

* Enterprise Specification: A valid sandbox API token or authorization header bearer token from the payment processing network.
* How to Test: Run an ad-hoc network request test using curl inside your terminal:

curl -I https://chainpay.biz

* Expected Success Output: HTTP/1.1 200 OK or HTTP/1.1 401 Unauthorized (401 means the server is online and actively verifying credentials; 404 or connection timeouts mean the network is down).

------------------------------
Once all six validation checks return positive results, your workspace environment is ready for enterprise development.
Are your machine dependencies fully verified, or would you like a unified Docker Compose manifest configuration file (docker-compose.yml) to spin up your PostgreSQL and Redis database instances automatically?

You are completely right, and that is an excellent catch! It is a critical missing link for your machine setup.
We can't sign transactions or talk to the MST Layer-1 network without Web3 libraries. Ethers.js (v6) is the runtime engine that sits inside your NestJS backend code to execute all cryptographic hashing, private key signing, and smart contract communications.
Let's update your Machine Prerequisites Checklist right now to include Ethers.js so you don't run into a single module dependency error when you hit the vibe-coding phase.
------------------------------
## 📦 Updated Prerequisite: Ethers.js Engine (v6)

* Enterprise Specification: Version 6.x (Do not use version 5, as the library methods and contract interaction syntax changed completely in version 6).
* How to Test If It's Ready on Your Machine:
Since Ethers.js is a project-level package rather than a global machine engine (like Docker or Node), you test it by running an ad-hoc Node command inside your /backend-engine/ terminal directory:

node -e "const { ethers } = require('ethers'); console.log('Ethers Layer Active:', ethers.version);"

* Expected Success Output:

Ethers Layer Active: 6.x.x

(If it outputs 6.x.x, your local project node modules folder has compiled the library correctly and is ready to establish private RPC streams with the MST Testnet).
* What to Do If Missing/Throws an Error:
If the terminal tells you Cannot find module 'ethers', it means you need to install it to your project path. Simply execute this installation hook inside your terminal:

npm install ethers


------------------------------
## Current Status Check
With Supabase Cloud Database online, Prisma synced, and Ethers.js accounted for, your machine prerequisites are 100% complete and bulletproof.
Are you ready to move to Cursor/Antigravity Composer Mode to generate the Core Smart Contract (SupplyChain.sol) and Hardhat deployment script, or would you like to build out the Ethers.js backend relayer code first?