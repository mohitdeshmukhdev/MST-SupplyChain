# Software Requirements Specification (SRS)

**Project Title:** MST L1 Enterprise Supply Chain & Cryptographic Provenance Platform  
**Document Version:** 1.1.0-Enterprise-Production  

---

## 1. Introduction & Objectives

### 1.1 Purpose
This document specifies the functional, non-functional, security, and integration requirements for an enterprise-level supply chain transparency platform. The platform handles real-time IoT tracking, customs validation, and cryptocurrency fee settlements natively on the MST Layer-1 EVM Blockchain.

### 1.2 System Scope
The system operates as a zero-trust middleware framework. It bridges physical supply chain items to digital records without forcing operator-level field workers to manage Web3 wallets. Sensitive transactional and environmental details remain in a secure, serverless PostgreSQL database, while immutable cryptographic proofs of integrity are anchored directly to the MST Testnet ledger.

---

## 2. Overall Description & System States

### 2.1 Product Perspective
The platform connects three distinct architectural zones:
1.  **The Ingestion Layer:** Exposes protected API endpoints to IoT sensors, mobile camera scanners, and customs agents.
2.  **The Queue & Relayer Layer:** Processes incoming transactions through a queue using Redis and BullMQ, signing and broadcasting them sequentially to the L1 chain.
3.  **The Transparency Layer:** A public, wallet-less interface where any auditor or consumer can trace a product's provenance timeline.

### 2.2 Functional State-Transition Matrix
Every tracking batch moves through a strict lifecycle locked down by the core smart contract logic:

```
[ UNINITIALIZED ]
       │
  (createBatch) ────> [ SUPPLIED ] (Raw materials generated)
                            │
                  (processManufacturing) ──> [ MANUFACTURED ] (Finished goods packed)
                                                    │
                                              (startTransit)
                                                    ▼
                                              [ IN_TRANSIT ] <── (updateTelemetry)
                                                    │
                                         (attachCustomsDocument)
                                                    ▼
                                            [ CUSTOMS_CLEARED ]
                                                    │
                                             (receiveAtRetail)
                                                    ▼
                                             [ RETAIL_READY ] (Arrived at store)
                                                    │
                                             (sellToConsumer)
                                                    ▼
                                                 [ SOLD ] (Escrow released/closed)
```

---

## 3. Detailed Functional Requirements

### 3.1 Smart Contract Layer (SupplyChain.sol)
*   **FR-SC-1 (Role-Based Access Control):** The system must use OpenZeppelin’s AccessControl. It must enforce the following roles:
    *   `SUPPLIER_ROLE`: Can initialize batches (`createBatch`).
    *   `MANUFACTURER_ROLE`: Can process raw materials into goods (`processManufacturing`).
    *   `LOGISTICS_ROLE`: Can initiate transit (`startTransit`) and update telemetry (`transferCustody`).
    *   `CUSTOMS_AGENT_ROLE`: Can verify and attach border compliance records (`attachCustomsDocument`).
    *   `RETAILER_ROLE`: Can receive items at retail stores (`receiveAtRetail`) and mark them sold (`sellToConsumer`).
    *   `DEFAULT_ADMIN_ROLE`: Can register stakeholder addresses and manage contract parameters.
*   **FR-SC-2 (State Transition Enforcement):** The contract must enforce the sequential flow of goods. Any function call that bypasses the sequence (e.g., trying to mark an unmanufactured batch as `InTransit`) must fail.
*   **FR-SC-3 (State Locking):** The system must block updates to a batch once its state is marked as `Sold`.
*   **FR-SC-4 (tMST Escrow System):** The contract must support basic escrow. An administrator or buyer can deposit `tMST` tokens into the contract linked to a specific `batchId`. The contract will hold these funds and automatically release them to the configured beneficiary wallet when the stage updates to `RetailReady` or `Sold`.

### 3.2 NestJS Enterprise Backend Core
*   **FR-BE-1 (FIFO Transaction Queuing):** The backend must pass all incoming blockchain updates into a FIFO queue using BullMQ. The processor must sign transactions sequentially using a single relayer wallet to eliminate nonce collisions.
*   **FR-BE-2 (Cryptographic Anchoring):** The backend must compute a deterministic `keccak256` hash of off-chain database objects before sending them to the blockchain:
    $$\text{DataHash} = \text{keccak256}(\text{bytes}(\text{JSON.stringify}(\text{telemetryPayload})))$$
*   **FR-BE-3 (Payment Integration):** The platform must call ChainPay.biz to create invoice requests and update local payment records to `PAID` via webhook calls.

### 3.3 Next.js Proof-of-Concept Frontend
*   **FR-FE-1 (Public Verification Portal):** The frontend must allow public lookups of Batch IDs without requiring MetaMask or gas.
*   **FR-FE-2 (Data Consistency Check):** The frontend must hash the database payload locally and compare it to the blockchain `dataHash`. If they do not match, it must flag the timeline step as altered.
*   **FR-FE-3 (PWA Mobile Scanner):** The portal must be responsive and contain a camera scanning interface using `html5-qrcode` to enable on-site scanning of batch QR codes.

---

## 4. System Security & Threat Modeling (STRIDE)

| Threat Category | Potential Risk Vector | Enterprise Mitigation Mechanism |
|---|---|---|
| **Spoofing Identity** | Attackers mimicking a scanner to push updates. | Ephemeral HMAC signing tokens for devices. |
| **Tampering** | A database administrator altering history records. | Frontend cross-references database logs against on-chain hashes. |
| **Repudiation** | A worker denying they signed off on a shipment. | On-chain logs tie each transition to the handler's public address. |
| **Information Disclosure** | Competitors reading business data on-chain. | Zero plain-text storage. Only anonymized hashes are on-chain. |
| **Denial of Service** | IoT sensors overloading the network. | BullMQ queue acts as a buffer, throttling L1 transactions. |
| **Elevation of Privilege** | A logistics worker trying to verify customs documents. | Strict OpenZeppelin Role-Based Access checks on-chain. |
