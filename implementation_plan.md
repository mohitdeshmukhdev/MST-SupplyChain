# Refined Multi-Stakeholder Supply Chain Architecture Plan

This plan details the real-world operational models, the final product end-view, database-to-smart-contract coordination, a native `tMST` crypto escrow mechanism, and the step-by-step development roadmap for **MST SaralChain**.

---

## User Review Required

> [!IMPORTANT]
> **No Direct Private Keys in Chat:** As requested, you will keep all actual connection strings, API keys, and private keys private. You will paste them directly into the `.env` file once we create the project folders. 
> 
> **Separate Markdown Files:** The architectural specifications (`Architecture.md`, `SRS.md`, `technical_spec.md`, `prisma.md`, etc.) will remain in the root directory and will not be moved inside `backend-engine/` or `frontend-portal/`.

---

## 1. Deep Dive: Real-World Enterprise Blockchain Supply Chain

In institutional setups (like IBM Food Trust or VeChain ToolChain), supply chain blockchain networks are governed under a **SaaS Platform + Multi-Tenant Consortium** structure:

1.  **Platform Owner (MST Team / Highest Admin):** Governs the core infrastructure, deploys the main smart contract, manages the cloud endpoints, and controls the administrator dashboard. They register the "Enterprise Clients" (companies).
2.  **Enterprise Clients (Brands/Corporations):** Create tracking workspaces. They register their own operational nodes and map their verified suppliers, manufacturers, shippers, and retailers.
3.  **Physical-to-Digital Bridge:** IoT sensors stream tracking logs (temperature, GPS) to a Web2 backend. The backend signs and batches these events, anchoring them to the L1 blockchain. This keeps operational costs predictable and hides complex Web3 details from field workers.
4.  **Auditors & Consumers:** Look up data using the public web portal. They verify that the digital timeline matches the immutable blockchain hash.

---

## 2. The Final "End View" of MST SaralChain

After completing this development, here is what the system will look like:

*   **The Ingestion Gateway (NestJS Backend):** An API engine that exposes secure endpoints for telemetry, compliance documents, and invoicing.
*   **The Relayer (BullMQ + Redis):** A processing queue that accepts concurrent updates from IoT sensors, signs transactions using the relayer wallet, and publishes them sequentially to the MST L1 chain.
*   **The Database (Supabase PostgreSQL):** Stores detailed off-chain metrics (exact GPS points, temperatures, and invoice statuses) linked to on-chain transaction hashes.
*   **The Smart Contract (Solidity):** Enforces access roles, keeps track of the batch lifecycle stage, stores cryptographic document and state hashes, and handles a native `tMST` escrow payment.
*   **The Verification UI (Next.js):** A premium, scannable dashboard where anyone can enter a Batch ID to see:
    *   A **vertical visual timeline** of the product's journey (Supplied ➡️ Manufactured ➡️ InTransit ➡️ CustomsCleared ➡️ RetailReady ➡️ Sold).
    *   **Cryptographic validation status:** The portal compares the hash of the Postgres record against the on-chain registry in real-time. If it matches, a green **"100% Authenticity Verified on MST Blockchain"** badge is shown.
    *   **Verified Customs Certificates:** Direct links to compliance PDFs hosted on IPFS.
    *   **Escrow Payment Status:** Displays whether `tMST` payment is held in escrow, released to the supplier, or refunded.

---

## 3. Database Schema & Smart Contract Coordination

The database schema and smart contract coordinate using **Cryptographic Hash Anchoring**:

```
[ IoT Telemetry Data ] ──> [ Calculate Keccak-256 Hash ]
                                   │
       ┌───────────────────────────┴───────────────────────────┐
       ▼                                                       ▼
[ Smart Contract (Notary) ]                             [ Database (Store) ]
Stores: dataHash, stage, handler                       Stores: Raw temperature, GPS,
                                                               blockchainHash (= dataHash),
                                                               txHash
```

During verification, the frontend queries the database, recalculates the hash of the telemetry payload, and reads the on-chain hash. If they match, it proves the database records have not been tampered with.

### 💰 Added Feature: Native tMST Crypto Escrow System
To demonstrate advanced Web3 utility, the contract will include a lightweight escrow system:
*   When a batch is initialized, a buyer can deposit `tMST` tokens into the contract using `depositEscrow(uint256 batchId, address beneficiary)`.
*   The contract holds these tokens securely.
*   When the batch is received by the retailer (`receiveAtRetail`) or sold (`sellToConsumer`), the contract automatically releases the escrowed `tMST` directly to the beneficiary's wallet.
*   If a batch fails inspection (or is marked `FAILED`), the buyer can request a refund of the escrowed funds.

---

## 4. Proposed Changes

We will modify the specification markdown files in the root workspace directory to detail this exact setup:

### Specifications and Layout

#### [MODIFY] [Architecture.md](file:///d:/MST%20Blockchain%20Grant%20Program/MST%20SaralChain/Architecture.md)
*   Include the multi-tenant governance model and describe how the Web2-to-Web3 translation works.

#### [MODIFY] [SRS.md](file:///d:/MST%20Blockchain%20Grant%20Program/MST%20SaralChain/SRS.md)
*   Update state transitions to include the escrow release flow.
*   Define the platform governance architecture (MST Admin role vs Tenant roles).

#### [MODIFY] [technical_spec.md](file:///d:/MST%20Blockchain%20Grant%20Program/MST%20SaralChain/technical_spec.md)
*   Update database schema models (Prisma) to support the new `BatchStage` enum.
*   Update `SupplyChain.sol` to include `Escrow` structures, `depositEscrow` function, and automated release events during custody updates.
*   Detail the escrow states: `EscrowStatus { NONE, HELD, RELEASED, REFUNDED }`.

#### [MODIFY] [prisma.md](file:///d:/MST%20Blockchain%20Grant%20Program/MST%20SaralChain/prisma.md)
*   Update Prisma schema block representation to align with the new models.

#### [MODIFY] [Vibecoding_guidelinesNprompts.md](file:///d:/MST%20Blockchain%20Grant%20Program/MST%20SaralChain/Vibecoding_guidelinesNprompts.md)
*   Adjust Sprint 1-3 prompts to ensure Ethers.js commands and Smart Contract structures match the updated escrow and multi-stakeholder design.

---

## 5. Step-by-Step Development Process

We will follow this sequence step-by-step, validating at each checkpoint before proceeding:

### Step 1: Update Specifications
*   Modify `Architecture.md`, `SRS.md`, `technical_spec.md`, `prisma.md`, and `Vibecoding_guidelinesNprompts.md` in the root folder to document the new architecture.

### Step 2: Initialize Workspaces
*   Create the directories `backend-engine/` and `frontend-portal/`.
*   Initialize the NestJS app inside `backend-engine/`.
*   Install project dependencies (Ethers.js v6, Hardhat, Prisma, BullMQ, Tailwind CSS, etc.).
*   Set up `.gitignore` and template `.env` files.

### Step 3: Write, Compile & Test Smart Contract
*   Write `SupplyChain.sol` (with roles, stages, and escrow logic) in `backend-engine/contracts/`.
*   Write Hardhat configuration (`hardhat.config.js`) and deployment script.
*   Write unit tests to verify access control, stages transitions, and escrow deposits/releases.
*   Compile and run tests (`npx hardhat test`).

### Step 4: Deploy Contract on MST Testnet
*   Compile and deploy the contract to the live MST Testnet using the faucet-funded deployer key.
*   Record the deployed contract address.

### Step 5: Database Setup & Prisma Sync
*   Initialize Prisma, sync the schema with the live Supabase PostgreSQL instance using the Transaction Pooler connection string, and run migrations.

### Step 6: Backend Development (NestJS Core)
*   Create services for database queries, BullMQ queues, and MST Testnet transaction relayer.
*   Implement endpoints for IoT telemetry updates, ChainPay invoicing, and webhooks.

### Step 7: Frontend Development (Next.js Portal)
*   Set up the web portal, connect a read-only RPC provider to the MST network, and design the search dashboard.
*   Implement visual step timeline, cryptographic hash validation, and escrow logs UI.

### Step 8: E2E Integration Testing
*   Write the automated hardware telemetry simulator script to run through the entire flow (Supplied ➡️ Manufactured ➡️ InTransit ➡️ Customs ➡️ Retailer ➡️ Sold) and verify zero-compromise database-to-blockchain sync.
