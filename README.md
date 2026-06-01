<div align="center">

# ⛓️ MST SaralChain: Enterprise Supply Chain Ecosystem

<h3>Decentralized Identity, Real-Time IoT Telemetry & Carbon Tracking on the MST Blockchain</h3>

<p>
  <img src="https://img.shields.io/badge/Blockchain-MST_Network-7c3aed?style=for-the-badge&logo=web3.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Contracts-Solidity_0.8.24-6d28d9?style=for-the-badge&logo=solidity&logoColor=white" />
  <img src="https://img.shields.io/badge/Frontend-Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Backend-NestJS_10-e0234e?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL_|_Supabase-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

<p>
  <img src="https://img.shields.io/badge/Status-Demo_Ready-22c55e?style=flat-square" />
  <img src="https://img.shields.io/badge/Queue-BullMQ_%7C_Redis-ff1122?style=flat-square" />
  <img src="https://img.shields.io/badge/Wallet-MetaMask_RBAC-f59e0b?style=flat-square" />
</p>

</div>

---

> **"Bridging enterprise Web2 transaction speeds with the immutable, zero-trust guarantees of the Layer-1 MST Testnet Blockchain."**

---

## 📖 Overview

**MST SaralChain** is a state-of-the-art, Web3-enabled supply chain traceability and financial settlement engine built specifically for the **MST Testnet Blockchain**. The platform guarantees complete, end-to-end transparency for global logistics by anchoring critical milestones, sensor records, compliance documents, and carbon footprints to an immutable ledger while ensuring lightning-fast user interactions through a hybrid off-chain synchronization layer.

### Platform Architecture & Data Ingestion Pipeline

The platform uses a hybrid stack of **Next.js (App Router)** for Web3-enabled user portals, **NestJS** as the core backend gateway, a **Redis + BullMQ queue** to guarantee error-free asynchronous transaction broadcasting, **Supabase PostgreSQL** for sub-15ms querying, and **7 specialized Smart Contracts** on the MST Testnet for decentralization:

![MST SaralChain — Full Platform Architecture](./over%20all%20workflow.png)

> **Core Workflow Topology:** 4 Client Portals → NestJS API Gateway → Redis/BullMQ Asynchronous Queue → Supabase Postgres + IPFS → L1 MST Testnet (7 Smart Contracts)

---

## 💡 Systemic Supply Chain Gaps & Cryptographic Solutions

Traditional supply chains face massive bottlenecks, trust gaps, and infrastructure failures. Here is how MST SaralChain addresses them:

### 1. The Trust Deficit & Document Forgery
* **The Gap:** Paper bills of lading, compliance documents, and quality certificates are easily altered. Background verification requires days of auditing, manual document reviews, and costly third-party checks.
* **The Solution:** **Hash-Anchoring Proofs**. Uploaded documents are saved on IPFS and their cryptographically secure `keccak256` content hashes are anchored to the blockchain via `DocumentRegistry.sol`. Any alteration of the document breaks the mathematical verification.

### 2. Transaction Collision & Ingestion Latency (The Nonce Crisis)
* **The Gap:** In a high-speed logistics chain, thousands of IoT devices and scanners push telemetry logs simultaneously. Submitting these directly to EVM blockchain nodes from a single backend wallet triggers **EVM Nonce Conflicts**, resulting in dropped transactions and synchronization failures.
* **The Solution:** **Redis & BullMQ FIFO Transaction Queue**. Incoming telemetry data returns a `202 Accepted` to the client instantly. A robust background worker processes the queue sequentially, ensuring the relayer's transaction nonces are strictly incremented and broadcasted one-by-one with zero collisions.

### 3. ESG Greenwashing
* **The Gap:** Carbon emission reports are self-reported by logistics providers at the end of the year, leading to fabricated ESG metrics.
* **The Solution:** **DEFRA-Compliant Transit Emissions Logging**. Every leg of transport is calculated dynamically in the NestJS backend based on vehicle engine type, load, and actual GPS distance, then immediately logged to `CarbonRegistry.sol` on-chain.

### 4. Zero-Trust Condition Checks
* **The Gap:** A supplier claims goods arrived in perfect temperature range; the retailer claims they were spoiled. There is no unforgeable link between the IoT sensor telemetry and the escrow payout.
* **The Solution:** **On-Chain Hash Reconciliation**. Sensor logs are stored off-chain for rapid display, but their cryptographic state hash is anchored to `TelemetryRegistry.sol`. The frontend client pulls raw DB records, hashes them locally, and compares it to the blockchain registry. If a db admin tries to alter telemetry to cover up a spoilage event, the hash mismatch is flagged instantly.

---

## 🏗️ System Architecture & Data Separation

To optimize performance and security, MST SaralChain enforces a strict **three-layer separation of concerns**:

1. **The Consensus & Trust Layer (MST L1 Blockchain):** Stores zero plain-text data. It anchors sequential IDs, hashes (`keccak256`), wallet addresses, and locks escrow funds.
2. **The Relational Storage Layer (Supabase PostgreSQL):** Houses relational metadata, full telemetry streams, transit profiles, coordinates, and identities.
3. **The In-Memory Caching & Queue Layer (Redis):** Backs the BullMQ worker queue to handle asynchronous blockchain transaction processing and cache timelines.

```mermaid
flowchart LR
    classDef client fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#0f172a
    classDef backend fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    classDef db fill:#fff7ed,stroke:#f97316,stroke-width:2px,color:#7c2d12
    classDef blockchain fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d
    classDef rpc fill:#dcfce7,stroke:#16a34a,stroke-width:3px,color:#14532d,stroke-dasharray: 5 5

    subgraph UserLayer ["1. Client & Presentation Layer"]
        direction TB
        Wagmi["Web3 Provider & RBAC\n- Manages MetaMask wallet connections\n- Enforces strictly typed Manufacturer/Transporter roles\n- Handles EIP-712 cryptographic signatures"]:::client
        UI["React Web Interface (Next.js)\n- Renders SSR Dashboards & visual pipelines\n- Processes HTML5 QR Code scanning for custody\n- Responsive TailwindCSS & shadcn/ui components"]:::client
    end

    subgraph BackendLayer ["2. Core Backend Engine (NestJS)"]
        direction TB
        API["REST API Controllers\n- Exposes secure, rate-limited endpoints\n- Validates incoming JSON payloads\n- Parses authentication headers"]:::backend
        Services["Business Logic & Smart Contract Relayer\n- Executes core supply chain rules & constraints\n- Signs txs server-side via ethers.js Relayer wallet\n- Eliminates gas fees for end-users (Gasless UX)"]:::backend
        Prisma["Prisma ORM (Data Access Layer)\n- Manages highly concurrent PostgreSQL connections\n- Executes type-safe, optimized SQL queries\n- Translates blockchain state to relational DB"]:::backend
        BullMQ["BullMQ Task Queues (Async Workers)\n- Handles async blockchain tx broadcasting\n- Ensures reliable delivery with exponential backoff\n- Prevents RPC node rate-limiting and drops"]:::backend
    end

    subgraph DataLayer ["3. Off-Chain Infrastructure"]
        direction TB
        Supabase[("Supabase PostgreSQL DB\n- Mirrors on-chain state for instant UI rendering\n- Stores raw, unstructured telemetry & batch data\n- Provides complex JOIN queries impossible on-chain")]:::db
        Upstash[("Upstash Redis Cache\n- Stores volatile BullMQ background job states\n- Caches frequently accessed supply chain lookups\n- High-speed, low-latency key-value store")]:::db
    end

    subgraph BlockchainLayer ["4. MST Testnet Blockchain - Layer 1"]
        direction TB
        RPC(("MST Testnet RPC Node\nethers.js Provider Endpoint\n(Broadcasts Signed Txs)")):::rpc
        IdentitySC["IdentityRegistry.sol\n- Stores IPFS KYC CIDs & Entity Roles\n- Validates on-chain permissions"]:::blockchain
        BatchSC["BatchRegistry.sol\n- Tracks granular product lifecycle stages\n- Immutable links to Manufacturer & Custodian"]:::blockchain
        CheckpointSC["Checkpoint.sol\n- Logs spatial custody handovers & GPS data\n- Maintains unforgeable transit history"]:::blockchain
        EscrowSC["EscrowRegistry.sol\n- Locks Retailer funds in secure smart contract\n- Automates zero-trust milestone payouts"]:::blockchain
        CarbonSC["CarbonRegistry.sol\n- Logs DEFRA-compliant emission records\n- Tracks kgCO2 footprint per transit leg"]:::blockchain
        DocSC["DocumentRegistry.sol\n- Anchors IPFS document Keccak256 hashes\n- Mathematically validates Bill of Lading integrity"]:::blockchain
        TelemetrySC["TelemetryRegistry.sol\n- Anchors IoT sensor Keccak256 hashes\n- Proves untampered temperature/humidity datasets"]:::blockchain
    end

    %% Flow Connections
    Wagmi -->|1. Signatures| UI
    UI -->|2. HTTP Requests| API
    API -->|3. Routes Data| Services
    
    Services -->|4. Reads/Writes| Prisma
    Prisma -->|5. Executes SQL| Supabase
    
    Services -->|6. Enqueues Tx| BullMQ
    BullMQ -.->|7. Worker Processing| Services
    BullMQ -->|8. Manages State| Upstash
    
    Services -->|9. Broadcasts Tx| RPC
    RPC -->|mintBatch| BatchSC
    RPC -->|logCheckpoint| CheckpointSC
    RPC -->|fundEscrow| EscrowSC
    RPC -->|registerIdentity| IdentitySC
    RPC -->|logEmissions| CarbonSC
    RPC -->|anchorTelemetry| TelemetrySC
    RPC -->|anchorDocument| DocSC
```

---

## 🚶‍♂️ Unified Stakeholder Journey

This process shows the logical flow of goods, telemetry inputs, escrow transactions, and auditor checks as a batch traverses the supply chain:

```mermaid
flowchart TD
    classDef actor fill:#fef08a,stroke:#ca8a04,stroke-width:2px,color:#000
    classDef action fill:#ffffff,stroke:#64748b,stroke-width:2px,color:#0f172a
    
    Manufacturer(("🏭 Manufacturer")):::actor
    Retailer(("🏪 Retailer")):::actor
    Transporter(("🚚 Transporter")):::actor
    Auditor(("🕵️ Auditor")):::actor

    Manufacturer -->|1. Creates Product Batch| Step1[Batch Minted on Blockchain]:::action
    Retailer -->|2. Locks Payment in Escrow| Step1
    
    Step1 -->|3. Goods Handed Over| Transporter
    Transporter -->|4. Scans QR Code| Step2[Custody Checkpoint Logged]:::action
    
    Transporter -->|5. Transit Begins| Step3[IoT Sensors Anchor Temp/Humidity]:::action
    Step3 -->|6. Journey Completes| Step4[DEFRA Carbon Emissions Calculated]:::action
    
    Step4 -->|7. Goods Arrive| Retailer
    Retailer -->|8. Confirms Receipt| Step5[Smart Contract Releases Funds to Manufacturer]:::action
    
    Auditor -.->|Monitors Supply Chain Integrity| Step5
```

---

## 🛠️ The Operational Portals (Implemented Routes)

The platform is divided into specialized Web3-gated modules, which change in real-time depending on the MetaMask wallet address connected to the application:

* **Landing Page (`/`):** The client-facing entry point highlighting MST blockchain benefits, the system topology, and launching the portal gateway.
* **Identity & KYC Registration (`/identity`):** Where entities submit corporate metadata and their IPFS-based KYC documents to register on the blockchain registry.
* **Batch Minting (`/manufacturer/mint`):** Accessible only to wallets holding the `SUPPLIER` role. Initiates a new batch by providing GTINs, weights, facility details, and generating a unique QR code.
* **Batch Dashboard (`/dashboard/[batchId]`):** Interactive ReactFlow tracing interface displaying the step-by-step custody timeline, carbon totals, telemetry metrics (temp/humidity charts), and links to EVM transaction hashes.
* **Transporter Hub (`/transporter`):** Accessible only to wallets holding the `TRANSPORTER` role. Features tabbed workspaces for:
  - **Custody Handover (Checkpoint):** Signing and logging spatial handovers on-chain.
  - **IoT Telemetry Logging:** Simulating telemetry broadcasts (temperature and humidity pings) to anchor hashes.
  - **Carbon Footprint Log:** Specifying vehicle type, load, and mileage to record emissions on-chain.
* **Retailer Portal (`/retailer`):** Accessible only to wallets holding the `RETAILER` role. Allows querying specific batches to fund escrows, check transit status, verify integrity hashes, and release funds upon safe arrival.
* **QR Scanner (`/scanner`):** Mobile-responsive camera portal using `html5-qrcode` to scan a physical package's QR code and instantly load its provenance timeline.

---

## ⚙️ Core Technical Specifications

### Technical Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Manufacturer
    actor Transporter
    actor Auditor
    actor Retailer
    participant Portal as Next.js Portal
    participant API as NestJS Backend
    participant DB as Supabase DB
    participant Chain as MST Testnet

    Note over Manufacturer, Chain: Phase 1: Production & Order Creation
    Manufacturer->>Portal: Login via MetaMask (RBAC: Manufacturer)
    Manufacturer->>Portal: Enter GTIN, Name, Weight, Upload Docs
    Portal->>API: POST /api/batch
    API->>Chain: Relayer executes mintBatch() & anchorDocument()
    Chain-->>API: Emits BatchMinted Event
    API->>DB: Prisma stores Batch & Document metadata
    DB-->>Portal: Returns Batch ID
    
    Retailer->>Portal: Login via MetaMask (RBAC: Retailer)
    Retailer->>API: Requests Escrow Funding
    Portal->>Chain: Direct MetaMask Tx: fundEscrow() [payable]
    Chain-->>API: Emits EscrowFunded Event
    API->>DB: Updates Escrow status to FUNDED

    Note over Manufacturer, Chain: Phase 2: Transit, Telemetry & Carbon Tracking
    Transporter->>Portal: Login via MetaMask (RBAC: Transporter)
    Transporter->>Portal: Scans QR Code for Batch Handover
    Portal->>API: POST /api/checkpoint
    API->>Chain: Relayer executes logCheckpoint()
    API->>DB: Saves custody transfer & location
    
    Transporter->>Portal: IoT Devices Push Temp/Humidity Data
    Portal->>API: POST /api/telemetry
    API->>DB: Stores raw telemetry values
    API->>Chain: Relayer executes anchorTelemetry(keccak256 hash)
    
    Transporter->>Portal: Submits Transit Leg (Distance, Vehicle)
    Portal->>API: POST /api/carbon
    API->>API: Calculates Emissions (DEFRA Protocols)
    API->>Chain: Relayer executes logEmissions(kgCO2)
    API->>DB: Stores Emission logs

    Note over Manufacturer, Chain: Phase 3: Audit, Delivery & Settlement
    Auditor->>Portal: Login via MetaMask (RBAC: Auditor)
    Auditor->>DB: Queries Batch History
    DB-->>Auditor: Returns Off-chain Telemetry
    Auditor->>Chain: Verifies hashes on Block Explorer (Zero-Trust)
    
    Retailer->>Portal: Confirms receipt of goods via Dashboard
    Portal->>API: POST /api/escrow/release
    API->>Chain: Relayer executes releaseEscrow()
    Chain-->>Manufacturer: Transfers tMST funds automatically
    API->>DB: Updates status to DELIVERED and RELEASED
```

### Relational Database Schema (ERD)

```mermaid
erDiagram
    Identity {
        string id PK
        string walletAddress UK
        string entityType
        boolean isVerified
    }
    Batch {
        string id PK
        int blockchainId UK
        string gtin
        string stage
        string name
        string origin
        float quantity
        float weight
    }
    Checkpoint {
        string id PK
        string batchId FK
        string location
        string custodian
        string txHash
    }
    TelemetryAnchor {
        string id PK
        string batchId FK
        float temperatureC
        float humidity
        string dataHash
        string txHash
    }
    CarbonLog {
        string id PK
        string batchId FK
        float emissionsKg
        string txHash
    }
    Escrow {
        string id PK
        string batchId FK
        float amountEth
        string status
    }
    BlockchainTx {
        string txHash PK
        string contractName
        string status
    }

    Identity ||--o{ Batch : "creates"
    Batch ||--o{ Checkpoint : "tracks"
    Batch ||--o{ TelemetryAnchor : "sensors"
    Batch ||--o{ CarbonLog : "emissions"
    Batch ||--|| Escrow : "payment"
```

### Deployed smart contracts (MST Testnet)

All smart contracts are written in Solidity 0.8.24 and deployed on the MST Testnet. Addresses are configured dynamically inside the relayer service.

* **`GovernanceRegistry`:** Enforces system roles (`DEFAULT_ADMIN_ROLE`, `SYSTEM_ADMIN`, etc.).
* **`IdentityRegistry`:** Houses on-chain KYC approvals and company-to-role mappings.
* **`BatchRegistry`:** Governs batch state transitions, GTIN assignments, and manufacturer provenance.
* **`Checkpoint`:** Manages spatial coordinate logs and transit custody handovers.
* **`EscrowRegistry`:** Automates secure locked-value deposits and condition-based milestone releases.
* **`CarbonRegistry`:** Records DEFRA-calculated carbon weights.
* **`DocumentRegistry` & `TelemetryRegistry`:** Anchor cryptographic hashes (`keccak256`) of compliance PDFs and raw telemetry arrays.

---

## 🎬 Live Demo Planning & Execution

For evaluators, recruiters, or grant reviewers, the project is configured with a **fully automated live demo environment** that eliminates administrative delays.

### Required MetaMask Accounts (Personas)
Import or create **4 separate accounts** in MetaMask, all configured to the **MST Testnet**:

| Account Name | Supply Chain Persona | Primary Dashboard View |
|---|---|---|
| `RELAYER` | System Relayer (Gasless Execution) | Backend Engine (Automated) |
| `SUPPLIER` | Manufacturer | `/manufacturer/mint` |
| `TRANSPORTER` | Transporter / Logistics | `/transporter` |
| `RETAILER` | Retailer / Purchaser | `/retailer` |
| `CONSUMER` | Public Auditor | `/scanner` (No login needed) |

> 🌐 **Frictionless Demo Bypass:** The backend relayer auto-authenticates itself and auto-verifies user KYC requests. When you submit a KYC request on `/identity`, the portal triggers a simulated 5-second admin approval loading sequence, after which the identity status transitions to "VERIFIED" without requiring a manual admin login.

To study the complete step-by-step user script, setup guidelines, and transition mechanisms back to production, read [DEMO_REQUIREMENTS.md](file:///d:/MST%20Blockchain%20Grant%20Program/MST%20SaralChain/DEMO_REQUIREMENTS.md).

---

## 🚀 Quick Start (Local Setup)

Follow these steps to launch the ecosystem locally:

### 1. Configure the MetaMask Network
Connect MetaMask to the **MST Testnet**:
* **RPC URL:** `https://testnetrpc.mstblockchain.com`
* **Chain ID:** `(Available in MSTtestnet.md)`
* **Currency Symbol:** `tMST`
* **Block Explorer:** `https://testnetscan.mstblockchain.com`

*Request faucet gas tokens from `https://faucet.mstblockchain.com` before testing.*

### 2. Clone the Repository
```bash
git clone https://github.com/mohitdeshmukhdev/MST-SupplyChain.git
cd MST-SupplyChain
```

### 3. Start the Backend Engine (NestJS)
Navigate to the backend, populate your `.env` variables, and run development mode:
```bash
cd backend-engine
npm install

# Ensure database URL is populated for Supabase PostgreSQL
npx prisma generate

# Starts on http://localhost:5000
npm run start:dev
```

### 4. Start the Frontend Portal (Next.js)
In a new terminal window, initialize and boot up the UI server:
```bash
cd frontend-portal
npm install

# Starts on http://localhost:3000
npm run dev
```

### 5. Launch Prisma Studio (Optional Database View)
To view raw database records synced from smart contract events in real-time:
```bash
cd backend-engine
npx prisma studio
# Starts on http://localhost:5555
```

---

## 📚 Project Documentation Directory

| Resource | Scope | Path |
|---|---|---|
| **Demo Setup & Script** | End-to-end user flows, wallets, and demo planning. | [DEMO_REQUIREMENTS.md](file:///d:/MST%20Blockchain%20Grant%20Program/MST%20SaralChain/DEMO_REQUIREMENTS.md) |
| **Testing Guide** | Commands and validation scenarios for end-to-end testing. | [DEMO_TESTING_GUIDE.md](file:///d:/MST%20Blockchain%20Grant%20Program/MST%20SaralChain/DEMO_TESTING_GUIDE.md) |
| **System Architecture Spec** | Detailed data separation logic, queues, and security. | [System_Design_Architecture.md](file:///d:/MST%20Blockchain%20Grant%20Program/MST%20SaralChain/System_Design_Architecture.md) |
| **QR Code Testing** | Camera scanning guides and test cases. | [QR_CODE_TESTING_GUIDE.md](file:///d:/MST%20Blockchain%20Grant%20Program/MST%20SaralChain/QR_CODE_TESTING_GUIDE.md) |
| **API Architecture & Health** | Route maps, payload examples, and endpoint health tests. | [API_Testing_and_Architecture_Guide.md](file:///d:/MST%20Blockchain%20Grant%20Program/MST%20SaralChain/API_Testing_and_Architecture_Guide.md) |

---

<div align="center">
  <p>Engineered with ❤️ for the <strong>MST Blockchain Grant Program</strong></p>
  <p><em>Constructing a fast, secure, and verifiable global supply chain infrastructure.</em></p>
</div>
