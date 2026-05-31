# MST Supply Chain: Next-Gen Supply Chain Ecosystem ⛓️📦

<div align="center">
  <h3>Enterprise-Grade Traceability on the MST Testnet</h3>
</div>

## 📖 Overview

**MST Supply Chain** is an enterprise-grade, Web3-powered supply chain management ecosystem built on the **MST Testnet Blockchain**. It provides an immutable, transparent, and highly performant platform for tracking goods, managing decentralized identities, anchoring IoT telemetry, tracking carbon emissions, and securely handling escrow payments.

Our hybrid architecture leverages smart contracts for absolute trust and an off-chain NestJS, PostgreSQL, and Redis engine for rapid querying and seamless user experiences.

---

## 🏗️ System Architecture

The ecosystem relies on a robust hybrid architecture. The Frontend Portal connects with the Backend Engine via REST API, while Web3 signatures ensure cryptographic security. The Backend Engine processes business logic, caches queue tasks in Redis, syncs with Postgres via Prisma, and acts as a Relayer to interact with the 7 Smart Contract Registries on the MST Blockchain.

```mermaid
flowchart TB
    %% Styling
    classDef client fill:#ffffff,stroke:#cbd5e1,stroke-width:2px,color:#1e293b,font-family:Inter;
    classDef backend fill:#f8fafc,stroke:#3b82f6,stroke-width:2px,color:#1e293b,font-family:Inter;
    classDef db fill:#fff7ed,stroke:#f97316,stroke-width:2px,color:#1e293b,font-family:Inter;
    classDef blockchain fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#1e293b,font-family:Inter;
    classDef note fill:#fefce8,stroke:#eab308,stroke-width:1px,color:#854d0e,font-size:12px,font-style:italic;

    subgraph Frontend["Frontend Portal (Next.js App Router)"]
        UI["<b>Web Interface</b><br/><i>Renders dashboards, ReactFlow pipelines, and QR Scanner</i>"]
        Wagmi["<b>Web3 Provider</b><br/><i>Manages MetaMask wallet connections and RBAC</i>"]
    end
    
    subgraph Backend["Backend Engine (NestJS)"]
        API["<b>REST Controllers</b><br/><i>Handles HTTP requests from Frontend</i>"]
        Services["<b>Business Logic & Relayer</b><br/><i>Validates data and signs blockchain txs</i>"]
        Prisma["<b>Prisma ORM</b><br/><i>Manages DB connection pool</i>"]
        BullMQ["<b>Task Queues</b><br/><i>Processes asynchronous blockchain transactions</i>"]
    end
    
    subgraph Infrastructure["Off-Chain Infrastructure"]
        Supabase[("<b>Supabase DB</b><br/><i>PostgreSQL data mirror for instant querying</i>")]
        Upstash[("<b>Upstash Redis</b><br/><i>Stores BullMQ task states</i>")]
    end
    
    subgraph MSTTestnet["MST Testnet Blockchain (Layer 1)"]
        IdentitySC["<b>IdentityRegistry</b><br/><i>Stores KYC and entity roles</i>"]
        BatchSC["<b>BatchRegistry</b><br/><i>Tracks product lifecycle stages</i>"]
        CheckpointSC["<b>Checkpoint</b><br/><i>Logs custody handovers</i>"]
        EscrowSC["<b>EscrowRegistry</b><br/><i>Locks and releases payments</i>"]
        CarbonSC["<b>CarbonRegistry</b><br/><i>Logs DEFRA emission records</i>"]
        DocSC["<b>DocumentRegistry</b><br/><i>Anchors IPFS document hashes</i>"]
        TelemetrySC["<b>TelemetryRegistry</b><br/><i>Anchors IoT sensor data hashes</i>"]
    end
    
    %% Connections with descriptions
    UI -- "1. API Requests (JSON)" --> API
    Wagmi -- "2. Web3 Signatures" --> UI
    
    API -- "3. Validates & Routes" --> Services
    Services -- "4. Enqueues Tx" --> BullMQ
    BullMQ -. "5. Background Worker" .-> Services
    
    Services -- "6. Reads/Writes Off-chain Data" --> Prisma
    Prisma -- "7. Executes SQL" --> Supabase
    BullMQ -- "8. Queue State" --> Upstash
    
    Services -- "9. ethers.js (Relayer Wallet broadcast)" --> MSTTestnet
    
    %% Apply classes
    class UI,Wagmi client;
    class API,Services,Prisma,BullMQ backend;
    class Supabase,Upstash db;
    class MSTTestnet,IdentitySC,BatchSC,CheckpointSC,EscrowSC,CarbonSC,DocSC,TelemetrySC blockchain;
```

---

## ⚙️ Workflows & Data Models

### Supply Chain Lifecycle

This sequence diagram illustrates the step-by-step lifecycle of a batch passing through the supply chain: Minting, Handover, IoT Telemetry, Carbon tracking, and Escrow Release.

```mermaid
sequenceDiagram
    autonumber
    actor M as Manufacturer
    actor T as Transporter
    participant B as Backend Engine
    participant C as Smart Contracts
    actor R as Retailer

    Note over M,R: Phase 1: Production & Escrow Funding
    M->>B: Creates Batch via Dashboard
    Note right of M: Inputs GTIN, Weight, Product Name
    B->>C: mintBatch(gtin, manufacturerId)
    C-->>B: Emits BatchMinted Event
    
    R->>B: Funds Escrow for Batch
    Note right of R: Retailer locks payment in smart contract
    B->>C: fundEscrow(batchId) [payable]
    C-->>B: Emits EscrowFunded Event
    
    Note over M,R: Phase 2: Transit & Telemetry
    T->>B: Scans QR & Takes Custody
    Note right of T: Handover checkpoint created
    B->>C: logCheckpoint(batchId, location)
    C-->>B: Emits CheckpointLogged
    
    T->>B: IoT Sensors Submit Data
    Note right of T: Temp/Humidity anchored via keccak256
    B->>C: anchorTelemetry(dataHash)
    C-->>B: Emits TelemetryAnchored
    
    T->>B: Calculates Carbon Emissions
    Note right of T: Uses DEFRA factors based on vehicle & distance
    B->>C: logEmissions(batchId, kgCO2)
    C-->>B: Emits CarbonLogged
    
    Note over M,R: Phase 3: Delivery & Settlement
    R->>B: Confirms Receipt of Goods
    Note right of R: Triggers final release of funds to Manufacturer
    B->>C: releaseEscrow(batchId)
    C-->>R: Funds transferred from Contract to Manufacturer
```

### Database Schema (ERD)

The relational schema strictly maps our on-chain data architecture to highly queryable off-chain Postgres tables, linked universally by the `txHash`.

```mermaid
erDiagram
    Identity {
        string id PK "UUID"
        string walletAddress UK "MetaMask Address"
        string entityType "MANUFACTURER, TRANSPORTER, RETAILER"
        string kycDocCid "IPFS Hash"
    }
    Batch {
        string id PK "UUID"
        int blockchainId UK "Smart Contract ID"
        string gtin "GS1 Global Trade Item Number"
        string stage "Current lifecycle stage"
        string manufacturerId FK "Relation to Identity"
        string currentCustodianId FK "Relation to Identity"
    }
    Checkpoint {
        string id PK "UUID"
        string batchId FK "Relation to Batch"
        string location "GPS or Address"
        string txHash "Blockchain Reference"
    }
    TelemetryAnchor {
        string id PK "UUID"
        string batchId FK "Relation to Batch"
        float temperatureC "Off-chain sensor data"
        float humidityPct "Off-chain sensor data"
        string dataHash "Keccak256 Anchor"
        string txHash "Blockchain Reference"
    }
    CarbonLog {
        string id PK "UUID"
        string batchId FK "Relation to Batch"
        float distanceKm "Calculated transit distance"
        float emissionsKg "DEFRA Output"
        string txHash "Blockchain Reference"
    }
    Escrow {
        string id PK "UUID"
        string batchId FK "Relation to Batch"
        float amountEth "Locked value"
        string status "FUNDED, RELEASED"
    }
    BlockchainTx {
        string id PK "UUID"
        string txHash UK "Transaction Identifier"
        string contractName "Target Registry"
        string status "PENDING, CONFIRMED"
    }

    Identity ||--o{ Batch : "manufactures"
    Identity ||--o{ Batch : "custodies"
    Batch ||--o{ Checkpoint : "has"
    Batch ||--o{ TelemetryAnchor : "logs"
    Batch ||--o{ CarbonLog : "emits"
    Batch ||--|| Escrow : "secured by"
```

---

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed and set up:
* **Node.js** (v18.17.0 or higher)
* **Git**
* **MetaMask Extension** installed in your browser.
* **MST Testnet Configuration:**
  * **Network Name:** MST Testnet
  * **RPC URL:** `https://testnetrpc.mstblockchain.com`
  * **Chain ID:** `(Add Chain ID here)`
  * **Currency Symbol:** `tMST`

### 1. Clone the Repository
```bash
git clone https://github.com/mohitdeshmukhdev/MST-SupplyChain.git
cd MST-SupplyChain
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and start the engine:
```bash
cd backend-engine
npm install

# Ensure your .env file is configured with Supabase DATABASE_URL, Upstash REDIS_URL, MST_RPC_URL, and RELAYER_PRIVATE_KEY.
# Generate Prisma Client
npx prisma generate

# Start the NestJS server (runs on http://localhost:5000)
npm run start:dev
```

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend portal, and start the development server:
```bash
cd frontend-portal
npm install

# Start the Next.js app (runs on http://localhost:3000)
npm run dev
```

### 4. Prisma Studio (Optional Database GUI)
To visualize and manage the Supabase database locally:
```bash
cd backend-engine
npx prisma studio
# Opens at http://localhost:5555
```

---

## 🛠️ Tech Stack
* **Blockchain:** MST Testnet, Solidity, ethers.js v6
* **Backend:** NestJS, Prisma (PostgreSQL on Supabase), BullMQ (Redis on Upstash)
* **Frontend:** Next.js (App Router), ReactFlow, TailwindCSS v4, shadcn/ui, Wagmi v2, RainbowKit
* **Tooling:** Hardhat, html5-qrcode

---
## 📄 License
This project is licensed under the MIT License.
