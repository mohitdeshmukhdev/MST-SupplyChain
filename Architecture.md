# MST SaralChain Enterprise Architecture Design Spec

This document details the architectural layout, data partitioning layers, and performance scaling mechanics designed to handle institutional supply chain telemetry.

---

## 1. Data and Network Separation Layering
To ensure sub-15ms data access speeds, prevent blockchain node failures, and protect corporate trade secrets, we implement a **triple-layer data separation architecture**:

*   **The Consensus & Trust Layer (MST L1 Blockchain):** Acts as a cryptographic notary registry. It stores **zero plain-text data**. It holds only sequential counters (`batchId`), IPFS content identifiers (`CIDs`), and 32-byte data integrity hashes (`keccak256`).
*   **The Relational Storage Layer (PostgreSQL via Prisma ORM):** Houses full relational metadata, operational logs, user roles, transit coordinates, and sensor metrics (temperatures, humidity).
*   **The Performance Cache Layer (Redis):** Caches active batch histories and timelines to enable ultra-fast read responses (<15ms) on the public portal without stressing the database.

---

## 2. Platform Multi-Service Topography

The platform is designed to scale as a multi-tenant software framework where corporate clients manage their supply chain networks while end consumers query the public ledger:

```
[ CLIENT & PHYSICAL LAYER ]      [ INGESTION & MIDDLEWARE LAYER ]       [ STATE & CACHE LAYER ]
                                                                        
  Supplier ERP Dashboard ────┐                                           
                             │                                           
  PWA Mobile Camera Scanner ─┼─> [ NestJS Enterprise API Gateway ] ───> [ Redis Cache In-Memory ]
                             │     ├── BullMQ FIFO Nonce Queue          (Sub-15ms Reads & Timelines)
  IoT Temperature Sensors ───┤     ├── Ethers.js L1 Relayer Wallet                 │
                             │     └── Prisma Client Model Engine                  ▼
  ChainPay Invoicing Hooks ──┘            │                             [ RELATIONAL DATABASE ]
                                          ▼
                               [ TRUST ANCHOR LAYER ]             [ Supabase PostgreSQL ]
                                                                  (Full Relational Ledger)
                               [ MST Layer-1 Blockchain ]
                               (Cryptographic Notary)
```

---

## 3. Concurrency Protection & Nonce Management (The BullMQ Engine)
In a high-frequency supply chain, dozens of automated IoT devices and border scanners might post telemetry updates at the exact same millisecond. If a standard backend tries to broadcast these directly to an EVM blockchain RPC node using a single private key, it will trigger a **Blockchain Nonce Conflict**, causing transaction collisions and dropped logs.

### Enterprise Scale Mitigation:
All incoming REST updates are sent to a **First-In, First-Out (FIFO) queue** backed by **Redis** and **BullMQ**. The NestJS server returns a `202 Accepted` status immediately to the scanner to prevent ingestion lag, and a background worker signs and broadcasts transactions to the MST Testnet sequentially. This ensures that every transaction is validated with the correct incremented nonce.

---

## 4. Zero-Trust Security & Data Integrity

*   **Asymmetric Key Insulation:** IoT devices and workers sign local API packets with ephemeral, rotating HMAC tokens. They never have access to the main relayer wallet private keys.
*   **On-Chain Integrity Check:** When the Next.js frontend retrieves batch history, it grabs the raw telemetry from PostgreSQL and recalculates its cryptographic hash in the browser:
    $$\text{StateHash} = \text{keccak256}(\text{bytes}(\text{JSON.stringify}(\text{telemetryPayload})))$$
    It then compares this to the `dataHash` returned by the MST smart contract. If any database administrator or attacker alters a record in the database, the hashes will mismatch, and the UI will instantly warn the auditor.
*   **Data Minimization:** No pricing or proprietary corporate detail is published to the public blockchain, protecting business confidentiality.

---

## 5. Live Presentation & Scalability Showcase Design
To demonstrate the production readiness of this architecture to evaluators or recruiters in real-time, the system includes:

1.  **Live Phone Scanner:** The Next.js client is fully mobile-responsive and integrates `html5-qrcode` to access the phone's native camera. You can print out QR codes representing Batch IDs, scan them with your phone, and watch the timeline update on a desktop monitor in real-time.
2.  **Stress-Test Simulator:** A dedicated load-testing script inside the CLI simulator. When triggered, it spams the backend with **50 concurrent telemetry events**. The dashboard will display the queue length spiking in Redis and draining smoothly as transactions are anchored on-chain with zero nonce errors, proving scalability.
