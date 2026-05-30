# MST SaralChain Vibe-Coding Guidelines & Prompts

To successfully build this enterprise-level Web3 supply chain tracker in a 12-14 hour session, follow this step-by-step prompt sequence.

---

## 📋 Phase 4: Production-Grade Prompt Sequence (prompts.md)

Create a file named `prompts.md` in the root workspace and use your AI editor's Composer view to execute these prompts sequentially.

---

### 📦 Sprint 1: Hardhat, Smart Contract & Live MST L1 Deployment (Hours 1–3)

#### Prompt 1.1: Multi-Workspace Initialization
```
@Architecture.md
Act as a Principal Web3 Systems Engineer. We are establishing the MST SaralChain tracking framework.

Initialize a dual-workspace structure:
1. `backend-engine/` (NestJS Framework utilizing TypeScript, Prisma ORM, BullMQ, and Ethers.js v6).
2. `frontend-portal/` (Next.js utilizing Tailwind CSS and Ethers.js for wallet-less RPC state lookups).

Inside `backend-engine/`, initialize a standard Hardhat development suite. Install the following explicit dependencies:
`npm install @openzeppelin/contracts dotenv ethers @prisma/client @nestjs/bullmq bullmq`
`npm install --save-dev @nomicfoundation/hardhat-toolbox hardhat prisma`

Generate a comprehensive `.gitignore` in the root workspace blocking `.env`, `node_modules`, `artifacts`, `cache`, and `dist`.
```

#### Prompt 1.2: Hardhat Configuration & Core Compiler
```
@Architecture.md @technical_spec.md
Focus inside the `backend-engine/` directory.

1. Write a secure `hardhat.config.js` compiler configuration targeting Solidity 0.8.20. Enable optimizer flags (runs: 200). Configure networks for:
   - `mstTestnet`: URL: 'https://mstblockchain.com', Chain ID: 4545, accounts: [process.env.RELAYER_PRIVATE_KEY]
   - `mstMainnet`: URL: 'https://mstblockchain.com', Chain ID: 4646, accounts: [process.env.RELAYER_PRIVATE_KEY]

2. Generate `contracts/SupplyChain.sol` exactly as defined in section 3 of `technical_spec.md`. Ensure strict Role-Based Access Control and enums for stages (Supplied, Manufactured, InTransit, CustomsCleared, RetailReady, Sold) and native tMST escrow functions are implemented.

3. Write `scripts/deploy.js` that instantiates the contract, passing the deployer wallet address as the primary Root Admin into the contract constructor. Print out the deployed contract address.
```

---

### ⚙️ Sprint 2: Prisma Modeling, BullMQ Queue Setup & NestJS Architecture (Hours 4–8)

#### Prompt 2.1: Prisma Schema Compilation & PostgreSQL Sync
```
@Architecture.md @prisma.md
Focus inside the `backend-engine/` directory. 

1. Write `prisma/schema.prisma` mapping the entity tables: `Batch`, `Checkpoint`, `CustomsDoc`, and `Payment`, as well as enums `PaymentStatus`, `BatchStage`, and `EscrowStatus`. Ensure indexes are set on blockchain IDs and connection strings point to pgBouncer port 6543.
2. Initialize Prisma client libraries and output the migration command.
```

#### Prompt 2.2: NestJS Infrastructure & BullMQ Nonce Protection Queue
```
@Architecture.md @technical_spec.md @prisma.md
Focus inside `backend-engine/src/`. Initialize a decoupled NestJS microservice layout:
1. `PrismaService` wrapper file to handle persistent database queries.
2. `BlockchainModule` containing a `BlockchainProcessor` (extending WorkerHost via `@nestjs/bullmq`) processing jobs sequentially from `blockchain-tx-queue` using Redis.
3. The processor must listen to the queue, execute `transferCustody` on-chain, wait for 1 block confirmation, and write environmental logs (temperature, humidity, GPS) to the database with the transaction hash.
```

#### Prompt 2.3: Ingestion Controllers, Escrow & webhook APIs
```
@Architecture.md @technical_spec.md @prisma.md
Focus inside `backend-engine/src/`. Create REST endpoints:
1. `POST /api/telemetry/update`: Validates sensor data (temp, humidity, GPS) and pushes them onto the BullMQ queue, returning an immediate HTTP 202 status.
2. `POST /api/escrow/deposit`: Accepts a `batchId` and `beneficiary` address, creates an invoice mapping, and locks tokens inside the smart contract escrow.
3. `POST /api/payment/webhook`: An open webhook handler to parse incoming IPN notifications from ChainPay.biz, updating invoice records to `PAID` or `CONFIRMED`.
```

---

### 🎨 Sprint 3: Wallet-less Next.js Verification Dashboard & Mobile Scanner (Hours 9–11)

#### Prompt 3.1: Next.js Web3 Consumer Portal Setup
```
@Architecture.md @technical_spec.md
Focus inside `frontend-portal/`. Set up Next.js.
1. Connect an `ethers.JsonRpcProvider` directly to the MST L1 Testnet.
2. Write a highly responsive homepage `pages/index.js` styled with Tailwind CSS. Include a prominent search bar to look up a Batch ID.
3. Upon search, query the smart contract and database. If the hash of the Postgres record matches the on-chain hash, display a prominent green "100% Authenticity Verified" badge.
```

#### Prompt 3.2: Chronological Timeline UI & PWA Camera Scanner
```
@Architecture.md @technical_spec.md
Expand the Next.js frontend:
1. Render a clean vertical visual timeline tracking the 6 stages (Supplied, Manufactured, InTransit, CustomsCleared, RetailReady, Sold).
2. Integrate `html5-qrcode` to access the mobile device camera. Allow operators to scan a QR code representing a Batch ID and automatically update coordinates and temperatures.
3. Add a document table for border custom forms linking to IPFS files.
```

---

### 🔌 Sprint 4: System Integration, Stress Test & Validation Checks (Hours 12–14)

#### Prompt 4.1: Live Telemetry & Scalability Stress Simulator
```
@Architecture.md @technical_spec.md
Create a standalone `scripts/simulator.js` script in the root directory:
1. **Interactive Demo Mode:** Simulates a realistic transit route, sending updates every 4 seconds (changing locations and temperature values).
2. **Stress Test Mode:** Fires 50 concurrent telemetry REST updates to the API at the exact same millisecond. 
3. Outputs traces to the console showing queue length spiking in Redis, draining sequentially, and anchoring on-chain with zero nonce errors.
```
