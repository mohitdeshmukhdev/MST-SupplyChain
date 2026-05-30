# MST SaralChain: Enterprise Supply Chain Management

MST SaralChain is an enterprise-grade, distributed multi-registry blockchain supply chain system. It leverages the MST Layer-1 Network to provide a cryptographic trust layer while utilizing a high-performance Web2 backend to process high-frequency IoT telemetry data without blockchain nonce collision.

## 🏗 Architecture

The system utilizes a **Hybrid Hash-Anchoring** strategy. Instead of storing massive amounts of data on a slow, expensive EVM blockchain, we use a distributed Multi-Registry architecture:

### 1. Trust Anchor Layer (MST Blockchain)
A suite of 6 interconnected Smart Contracts (similar to the DYPCOE pattern) acting as a cryptographic notary:
- `GovernanceRegistry`: Core Admin & RBAC.
- `IdentityRegistry`: User Wallet-to-Identity Mapping (KYC).
- `BatchRegistry`: Core Asset Lifecycle & GS1 Compliance.
- `TelemetryRegistry`: GPS & Environmental Condition Checkpoints.
- `DocumentRegistry`: IPFS CIDs for Customs docs.
- `EscrowRegistry`: Native tMST Crypto Payments and automated settlements.

### 2. Ingestion & Performance Layer
- **NestJS (API Gateway):** Handles incoming REST updates from supply chain participants.
- **BullMQ + Redis (Upstash):** A serverless FIFO queue ensuring massive concurrent IoT sensor data is batched and executed sequentially to prevent EVM Nonce collisions.

### 3. Relational Storage Layer
- **PostgreSQL (Supabase):** Stores full relational metadata, complex geospatial queries, and historical analytics, all connected via Prisma ORM.

### 4. Client Presentation Layer
- **Next.js (React):** A responsive web portal.
- **HTML5-QRCode:** A zero-cost browser integration allowing users to scan physical QR codes via their webcam or mobile phone to instantly verify cryptographic supply chain history.

## 🚀 Tech Stack
- **Smart Contracts:** Solidity, Hardhat, Ethers.js
- **Backend:** NestJS, TypeScript, Prisma ORM
- **Database:** Supabase (PostgreSQL with pgbouncer)
- **Queue/Cache:** Upstash (Serverless Redis)
- **Frontend:** Next.js, Vercel

## 📦 Getting Started (Local Development)

### Prerequisites
- Node.js (v20+)
- A funded MST Testnet Wallet (tMST)

### Installation
1. Clone the repository
2. Navigate to `backend-engine` and install dependencies: `npm install`
3. Configure your `.env` file with your Supabase and Upstash credentials.
4. Run smart contract tests: `npx hardhat test`
5. Deploy contracts: `npx hardhat run scripts/deploy.js --network mstTestnet`

## 🛡 Security & Compliance
This project enforces zero mock data drift. It uses real live API endpoints, real cryptographic IPFS hashes for bill-of-lading documents, and strictly enforces the Checks-Effects-Interactions pattern for Escrow payouts.
