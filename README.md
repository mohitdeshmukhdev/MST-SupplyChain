# MST SaralChain: Next-Gen Supply Chain Ecosystem ⛓️📦

<div align="center">
  <h3>Enterprise-Grade Traceability on the MST Testnet</h3>
</div>

## 📖 Overview

**MST SaralChain** is an enterprise-grade, Web3-powered supply chain management ecosystem built on the **MST Testnet Blockchain**. It provides an immutable, transparent, and highly performant platform for tracking goods, managing decentralized identities, anchoring IoT telemetry, tracking carbon emissions, and securely handling escrow payments.

Our hybrid architecture leverages smart contracts for absolute trust and an off-chain NestJS, PostgreSQL, and Redis engine for rapid querying and seamless user experiences.

---

## 🏗️ System Architecture

The ecosystem relies on a robust hybrid architecture. The Frontend Portal connects with the Backend Engine via REST API, while Web3 signatures ensure cryptographic security. The Backend Engine processes business logic, caches queue tasks in Redis, syncs with Postgres via Prisma, and acts as a Relayer to interact with the 7 Smart Contract Registries on the MST Blockchain.

```mermaid
flowchart TB
    %% Styling
    classDef client fill:#fcfcfc,stroke:#333,stroke-width:2px;
    classDef backend fill:#f0f7ff,stroke:#0366d6,stroke-width:2px;
    classDef db fill:#fff5e6,stroke:#d73a49,stroke-width:2px;
    classDef blockchain fill:#f0fff4,stroke:#28a745,stroke-width:2px;
    
    subgraph Frontend["Frontend Portal (Next.js & Tailwind)"]
        UI["Web Interface (React)"]
        Wagmi["Wagmi / RainbowKit"]
    end
    
    subgraph Backend["Backend Engine (NestJS)"]
        API["REST API Controllers"]
        Services["Business Logic & Relayer"]
        Prisma["Prisma ORM (v7)"]
        BullMQ["BullMQ Task Queues"]
    end
    
    subgraph Infrastructure["Off-Chain Data"]
        Supabase[("Supabase (PostgreSQL)")]
        Upstash[("Upstash (Serverless Redis)")]
    end
    
    subgraph MSTTestnet["MST Testnet Blockchain (EVM)"]
        IdentitySC["IdentityRegistry.sol"]
        BatchSC["BatchRegistry.sol"]
        CheckpointSC["Checkpoint.sol"]
        EscrowSC["EscrowRegistry.sol"]
        CarbonSC["CarbonRegistry.sol"]
        DocSC["DocumentRegistry.sol"]
        TelemetrySC["TelemetryRegistry.sol"]
    end
    
    %% Connections
    UI -- "HTTP Requests" --> API
    Wagmi -- "Wallet Signatures" --> UI
    
    API --> Services
    Services --> BullMQ
    BullMQ -. "Background Processing" .-> Services
    
    Services --> Prisma
    Prisma -- "CRUD Operations" --> Supabase
    BullMQ -- "Queue Storage" --> Upstash
    
    Services -- "ethers.js (RPC/Relayer)" --> MSTTestnet
    
    %% Apply classes
    class UI,Wagmi client;
    class API,Services,Prisma,BullMQ backend;
    class Supabase,Upstash db;
    class MSTTestnet,IdentitySC,BatchSC,CheckpointSC,EscrowSC,CarbonSC,DocSC,TelemetrySC blockchain;
```

---

## ⚙️ Workflows & Data Models

### Supply Chain Lifecycle

This sequence diagram illustrates the lifecycle of a batch passing through the supply chain: Minting, Handover, IoT Telemetry, Carbon tracking, and Escrow Release.

```mermaid
sequenceDiagram
    actor M as Manufacturer
    actor T as Transporter
    participant B as Backend Engine
    participant C as Smart Contracts
    actor R as Retailer

    M->>B: Mint Batch
    B->>C: mintBatch()
    C-->>B: Batch Minted Tx
    
    R->>B: Fund Escrow
    B->>C: fundEscrow(amount)
    C-->>B: Escrow Funded Tx
    
    T->>B: Take Custody (Checkpoint)
    B->>C: logCheckpoint()
    C-->>B: Checkpoint Recorded
    
    T->>B: Submit IoT Telemetry (Temp/Hum)
    B->>C: anchorTelemetry(hash)
    C-->>B: Hash Anchored
    
    T->>B: Submit Carbon Leg (Distance/Vehicle)
    B->>C: logEmissions(kgCO2)
    C-->>B: Carbon Logged
    
    R->>B: Confirm Delivery
    B->>C: releaseEscrow()
    C-->>R: Funds Transferred
```

### Database Schema (ERD)

The relational schema strictly maps our on-chain data architecture to highly queryable off-chain Postgres tables, linked universally by the `txHash`.

```mermaid
erDiagram
    Identity {
        string id PK
        string walletAddress UK
        string entityType
        string kycDocCid
    }
    Batch {
        string id PK
        int blockchainId UK
        string gtin
        string stage
        string manufacturerId FK
        string currentCustodianId FK
    }
    Checkpoint {
        string id PK
        string batchId FK
        string location
        string txHash
    }
    TelemetryAnchor {
        string id PK
        string batchId FK
        float temperatureC
        float humidityPct
        string dataHash
        string txHash
    }
    CarbonLog {
        string id PK
        string batchId FK
        float distanceKm
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
        string id PK
        string txHash UK
        string contractName
        string status
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
