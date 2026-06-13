# Executive Presentation Script: MST Supply Chain
## Complete Technical Walkthrough — CMO & DevRel Edition

Use this script as a conversational guide while walking the CMO and DevRel through the architecture, diagrams, minting process, security model, and everything in between. Every section is grounded in the actual code.

---

## 1. Introducing the System Architecture

**What you are showing:** The first diagram (System Architecture Flowchart).

**Your Script:**
> "Let's start by looking at how the system is wired together. We didn't just build a smart contract; we built a highly scalable, enterprise-grade **hybrid architecture** with four distinct layers.
>
> On the far left, we have the **Client Layer**. Our Next.js frontend uses MetaMask for cryptographic identity and enforces **Role-Based Access Control (RBAC)** at the UI level—meaning a Transporter's wallet simply cannot see or access the Manufacturer's dashboard.
>
> Instead of forcing the frontend to constantly read slow blockchain nodes, every action routes through our **NestJS Backend Engine** in the middle. The backend has two jobs: it talks to **Supabase PostgreSQL** for instant data reads via Prisma ORM, and it acts as a **Relayer**, signing and broadcasting transactions to the blockchain on behalf of users.
>
> The magic in between is **BullMQ backed by Upstash Redis**. When a transaction is submitted, the backend drops it into a task queue. This means if the MST Testnet RPC is momentarily congested, our application never freezes—the queue retries with exponential backoff until the transaction goes through.
>
> On the far right, all roads lead to the **MST Testnet**, where our 8 modular smart contracts live as the absolute, immutable source of truth."

---

## 2. The Full Unified User Flow — What Every User Does (Frontend & Backend Perspective)

**What you are showing:** The Unified User & System Flow diagram.

**Your Script:**
> "Let me now walk you through the complete lifecycle of a product in our system, from the perspective of every role, and tell you exactly what happens on the frontend and the backend at each step.
>
> Think of this as a relay race. The Manufacturer starts the race, hands the baton to the Transporter, who hands it to the Retailer. The Auditor watches the entire race from the sidelines. Each handoff is permanently recorded."

### Phase 1: KYC & Identity Registration (Before Anything Else)
**Frontend:** An admin registers a corporate wallet on the Identity screen.
**Behind the Hood (Backend):** The backend calls `IdentityRegistry.sol → verifyIdentity()`. This records the company's **business name, tax ID, jurisdiction, and primary role** directly on-chain. This is a gating mechanism — a wallet that has not been registered here simply cannot call `mintBatch()`. The `BatchRegistry.sol` checks `identityRegistry.isVerified(msg.sender)` before minting anything.
> *"Think of it as on-chain KYC. No anonymous actors can participate in this supply chain."*

### Phase 2: Batch Minting (Manufacturer/Supplier)
**Frontend:** The Manufacturer logs in, navigates to the **Mint Batch** screen, enters:
- Product Name (e.g., `Premium Organic Coffee Beans`)
- GS1 GTIN (`00012345678905`) — the global product barcode standard
- Origin Facility (`Bogota Highland Farms, Colombia`)
- Quantity & Unit (`500 kg`)
- Production Date & Expiry Date
- Internal Batch Number
- Handling Instructions (`Keep Refrigerated`)

The form also allows document uploads (Bill of Lading, certificates).

**Behind the Hood (Backend):**
1. The Next.js form submits a `POST /api/batch` request.
2. The NestJS controller validates every field.
3. The **Relayer Wallet** (a backend server wallet with `SUPPLIER_ROLE`) signs and calls `BatchRegistry.sol → mintBatch()`.
4. On-chain, a `uint256 batchId` is auto-incremented (`nextBatchId++`), and a `BatchData` struct is written into the `batches` mapping with `stage: BatchStage.Minted`.
5. A `BatchMinted` event is emitted with the `batchId`, `gtin`, and `manufacturer` address.
6. The backend listens for this event, extracts the `batchId` from the transaction receipt, and **mirrors all the data into Supabase** via Prisma with the `txHash` as the cryptographic link.
7. A QR code containing the `batchId` is generated and displayed to the Manufacturer.

> *"The key word here is 'minting'. Just like an NFT, minting a batch creates a permanent, unique digital identity for a physical product on the blockchain. The `batchId` is the product's DNA."*

### Phase 3: Escrow Funding (Retailer)
**Frontend:** The Retailer sees the batch details and clicks **Fund Escrow**, entering the amount in `tMST` native tokens.

**Behind the Hood:**
1. This is a direct MetaMask transaction — the user pays from their own wallet.
2. The call goes to `EscrowRegistry.sol → fundEscrow(batchId, seller_address)` with `msg.value > 0`.
3. The contract verifies the batch exists in `BatchRegistry`, then locks the funds in the `EscrowAgreement` struct with `isFunded: true`.
4. An `EscrowFunded` event is emitted.
5. The backend listens and updates the Supabase `Escrow` table to `FUNDED`.

> *"The Retailer's payment is locked in a smart contract. Neither the Manufacturer nor any third party can touch it until the goods are physically delivered and the batch reaches `RetailReady` stage. This is zero-trust commerce."*

### Phase 4: Transit & QR Scan Custody Handover (Transporter)
**Frontend:** The Transporter opens the **QR Scanner** screen (built with `html5-qrcode`), scans the batch QR, which decodes the `batchId`, and presents a **Confirm Handover** button with a GPS location field.

**Behind the Hood:**
1. `POST /api/checkpoint` is sent with `{ batchId, location }`.
2. The backend computes an `erpHash` — a `keccak256` hash of the location and timestamp — as a tamper-proof fingerprint.
3. The Relayer calls `SupplyChain.sol → transferCustody(batchId, location, status, erpHash)`. This appends a new `Checkpoint` struct to the batch's `journey[]` array on-chain and updates `currentOwner` to the Transporter's address.
4. Data is also written to the `Checkpoint` table in Supabase with the `txHash`.

> *"Every time the goods change hands physically, a new checkpoint is permanently appended to the batch's journey on the blockchain. It is impossible to delete or modify a past checkpoint."*

### Phase 5: IoT Telemetry Anchoring (Transporter / IoT Devices)
**Frontend:** The Transporter's portal receives automated temperature and humidity readings from IoT sensors.

**Behind the Hood — The Smart Hashing Pattern:**
1. `POST /api/telemetry` sends raw sensor data (`temperature: 4.5°C`, `humidity: 78%`).
2. The **backend stores the raw values in Supabase** for fast queries and dashboards.
3. The backend then computes `keccak256(abi.encodePacked(batchId, temperature, humidity, timestamp))` — this produces a unique 32-byte hash.
4. Only **this hash** is sent to `TelemetryRegistry.sol → anchorTelemetry()`.
5. If the temperature exceeds a threshold (e.g., `> 8°C` for cold chain), `isBreached: true` is passed, and the contract emits a `ComplianceBreached` event on-chain. This can automatically trigger the batch's stage to change to `Disputed` in `BatchRegistry`.

> *"We store 1 MB of raw sensor data in Postgres and anchor 32 bytes on the blockchain. We get the security guarantees of the blockchain without paying for expensive on-chain storage. If anyone tampers with the Postgres data, the hash will never match the anchored value on-chain."*

### Phase 6: Carbon Emission Logging (Transporter)
**Frontend:** The Transporter fills in Distance (km), Vehicle Type (CARGO_SHIP, TRUCK, etc.).

**Behind the Hood:**
1. `POST /api/carbon` is called.
2. The NestJS **CarbonService** applies **DEFRA (UK Government Greenhouse Gas Protocols)** emission factors: `emissionsKg = distanceKm × weightTonnes × DEFRAFactor[vehicleType]`.
3. The Relayer calls `CarbonRegistry.sol → logEmissions(batchId, distanceKm, emissionsKg, vehicleType)`.
4. The contract appends a `CarbonLog` struct and accumulates `totalCarbonEmissions[batchId]`.

> *"Every transit leg's carbon footprint is on-chain, permanently. This is real ESG compliance data that a company can present to regulators — not self-reported, but cryptographically anchored."*

### Phase 7: Customs Clearance (Customs Agent)
**Frontend:** A Customs Agent role attaches compliance documents (phytosanitary certificates, Bills of Lading).

**Behind the Hood:**
1. Documents are uploaded to **IPFS**, returning a CID (Content Identifier).
2. The CID is submitted to `DocumentRegistry.sol → attachDocument()`. The contract validates `bytes(ipfsCid).length > 0` before storing.
3. In `SupplyChain.sol`, `attachCustomsDocument()` auto-computes `keccak256(abi.encodePacked(docType, ipfsCid))` as a hash for the state-transition event, and moves the batch stage to `CustomsCleared`.

### Phase 8: Retail Receipt & Automatic Escrow Release (Retailer)
**Frontend:** The Retailer confirms receipt of goods on their dashboard.

**Behind the Hood — The Automatic Payment Trigger:**
1. `POST /api/escrow/release` is sent.
2. The Relayer calls `SupplyChain.sol → receiveAtRetail()` which updates the stage to `RetailReady`.
3. Inside `receiveAtRetail()`, the contract **automatically calls `_releaseEscrow(batchId)` internally** — no separate transaction is needed.
4. `EscrowRegistry.sol → releaseFunds()` checks `batch.stage == BatchStage.RetailReady` as a safety condition, then uses the **Checks-Effects-Interactions (CEI) pattern**: it sets `isReleased = true` BEFORE the `call{value}()` transfer, preventing reentrancy attacks.
5. The tMST tokens flow directly to the Manufacturer's wallet.

> *"The retailer confirms delivery. The smart contract automatically releases the payment. No bank, no intermediary, no 30-day payment cycle. It settles in seconds."*

### Phase 9: Audit Verification (Auditor)
**Frontend:** An Auditor role has a read-only dashboard. They see the full batch journey: every checkpoint, every IoT reading, every document, and every carbon log.

**Behind the Hood:**
1. The frontend queries `GET /api/audit/:batchId`, which reads from Supabase for speed.
2. For zero-trust verification, the auditor can copy any `txHash` from the UI and paste it directly into the MST Testnet Block Explorer to independently verify the transaction.
3. They can also call `BatchRegistry.sol → getBatch()` or `SupplyChain.sol → getBatchHistory()` directly via the explorer to confirm the on-chain state without trusting our backend at all.

---

## 3. Understanding Minting — How It Works in Detail

**Your Script:**
> "One of the most common questions is: 'What exactly does minting mean here?'
>
> Minting, in our context, is not about creating a token like an NFT. It is about creating a **unique, permanent digital identity for a physical product batch** on the blockchain.
>
> When `mintBatch()` is called, the smart contract runs `uint256 batchId = nextBatchId++`. This is a simple on-chain counter. The first batch ever minted gets `batchId = 1`. The second gets `2`, and so on. This ID is globally unique and can never be reused or deleted.
>
> This `batchId` is then the key into a `mapping(uint256 => BatchData)` on the blockchain. Every subsequent action — checkpoints, telemetry, carbon logs, escrow — is tied to this `batchId`.
>
> The physical product gets a QR code printed with this `batchId`. Scanning that QR code at any point in the supply chain instantly retrieves the product's entire immutable history from the blockchain."

---

## 4. Tokenomics & Economic Model

**Your Script:**
> "Our project does not introduce a new token. We deliberately use **tMST**, the native gas and value token of the MST Testnet. This is an intentional design choice. Here is why:
>
> **No Token Risk.** We are not asking companies to buy and hold a proprietary token that could lose value. The Escrow system uses the native chain currency, which is familiar and predictable.
>
> **Gas Model.** Small actions — like logging a checkpoint or anchoring telemetry — consume minimal gas in tMST. The backend Relayer Wallet covers this gas cost, so end users (Transporters, IoT devices) never see a gas bill.
>
> **Escrow Value.** The Retailer deposits real tMST value into the `EscrowRegistry`. This is **programmable money**: it is locked by code, not by a bank's policy, and released automatically by code when a condition is met.
>
> **Future Potential.** The `CarbonRegistry` tokenizes the carbon footprint of each batch. This creates a permanent, verifiable on-chain record of emissions that can form the basis of a future **carbon credit trading mechanism** — verified emissions data is the hardest part of any carbon market, and we already have it."

---

## 5. Security — What We Built In and Why

**Your Script:**
> "Security is not an afterthought in this system. Let me walk you through every layer."

### Smart Contract Security

**1. OpenZeppelin AccessControl (GovernanceRegistry)**
- We use OpenZeppelin's battle-tested `AccessControl.sol` as the **root of trust** for the entire ecosystem.
- Every role is a `keccak256` hash: `SUPPLIER_ROLE`, `LOGISTICS_ROLE`, `CUSTOMS_ROLE`, `RETAILER_ROLE`, and `SYSTEM_ROLE` (for the backend relayer).
- All 6 registries query `GovernanceRegistry.hasRole()` before executing any state-changing function. A wallet with only `LOGISTICS_ROLE` cannot call `mintBatch()`.

**2. Identity Gating**
- `BatchRegistry.sol → mintBatch()` calls `identityRegistry.isVerified(msg.sender)` BEFORE minting.
- A wallet that has not been KYC-verified by an admin on-chain will be rejected with a revert.
- Identities can also be **revoked** via `revokeIdentity()` if fraud is detected, immediately barring that wallet from all future actions.

**3. Stage Sequencing Guards (Reentrancy & Logic)**
- Every stage transition is protected by `require()` statements that enforce strict ordering.
- Example: `processManufacturing()` requires `stage == Stage.Supplied`. Calling it on a batch that is already `InTransit` will revert with `SC_ERR: Invalid stage sequence.`
- You cannot skip stages. You cannot go backwards.

**4. Checks-Effects-Interactions (CEI) Pattern in EscrowRegistry**
- In `releaseFunds()`, we set `escrow.isReleased = true` **before** the `call{value}()` transfer. This is the standard defence against reentrancy attacks.
- A malicious contract attempting to re-enter `releaseFunds()` during the transfer would see `isReleased = true` and revert immediately.

**5. Zero-Value Protection**
- `depositEscrow()` has `require(msg.value > 0)`. Empty deposits revert.
- `CarbonRegistry → logEmissions()` has `require(emissionsKg > 0)`. Zero-emission entries revert.
- `BatchRegistry → getBatch()` has `require(batchId > 0 && batchId < nextBatchId)`. Out-of-bounds queries revert.

**6. IPFS CID Length Validation**
- In `SupplyChain.sol → attachCustomsDocument()`: `require(bytes(ipfsCid).length == 46)`. An IPFS v1 CID is exactly 46 characters. Submitting a malformed or empty CID is rejected at the contract level.

**7. Dispute Resolution**
- `EscrowRegistry` has a `markDisputed()` function callable only by the `DEFAULT_ADMIN_ROLE`. If counterfeit goods or fraud is detected, an admin can freeze the escrow, preventing release, and then call `refundBuyer()` to return funds.

### Backend Security

**8. Input Validation (NestJS Pipes)**
- Every API endpoint uses NestJS's `ValidationPipe` with `class-validator` decorators. Malformed DTOs are rejected at the HTTP level before reaching any business logic.

**9. Relayer Wallet Isolation**
- The backend Relayer private key is stored as an environment variable (`RELAYER_PRIVATE_KEY`) and is never exposed in API responses or logs. Only the backend service has access to it.

**10. Rate Limiting**
- BullMQ ensures that if many requests arrive at once, they are queued and dispatched to the blockchain at a controlled rate, preventing RPC node overload and failed transactions.

### Database Security

**11. Cryptographic Tethering**
- Every Supabase record stores a `txHash`. This links every database row to a blockchain transaction. Database tampering is detectable because the hash on-chain will never match a modified record.

**12. Row-Level Security (RLS)**
- Supabase supports PostgreSQL Row-Level Security policies, ensuring that API calls only retrieve data belonging to the authenticated organization.

---

## 6. Anticipated Q&A

**Q: Why use a backend Relayer instead of having users pay gas directly?**
> *"To eliminate all Web3 friction for enterprise users. A Transporter driving a truck should not need to understand gas fees. They just scan a QR code and press Submit. Our backend relayer wallet holds the tMST gas budget and covers all transaction costs silently. This is a standard pattern called 'Meta-Transactions' in the Web3 industry."*

**Q: If you store data in Supabase, how is it truly decentralized?**
> *"Supabase is a performance cache, not the source of truth. The source of truth is the MST Testnet. If we deleted our entire database tomorrow, we could reconstruct every record by replaying the events emitted by our smart contracts — `BatchMinted`, `CustodyTransferred`, `EscrowFunded`, `CarbonLogged`, etc. Every on-chain event contains all the data needed for reconstruction."*

**Q: What happens if the temperature of a cold-chain batch exceeds the safe threshold?**
> *"This is where our `TelemetryRegistry` is exceptional. When IoT sensors detect a breach, the backend calls `anchorTelemetry()` with `isBreached: true`. The contract emits a `ComplianceBreached` event on-chain with the reason. This is an immutable, timestamped record of the violation. It can automatically trigger the batch stage to move to `Disputed` in `BatchRegistry`, preventing the escrow from releasing and flagging the goods for inspection."*

**Q: Is the escrow secure against double-spending?**
> *"Yes. `EscrowRegistry.releaseFunds()` uses the Checks-Effects-Interactions pattern. The `isReleased` flag is set to `true` before any Ether transfer, making reentrancy attacks impossible. Additionally, `require(!escrow.isReleased)` at the top ensures the function can only execute once per batch."*

**Q: Can the smart contracts be upgraded?**
> *"Currently, the contracts are immutable by design, which is the strongest possible trust guarantee for our counterparties. However, the modular registry pattern we have built — where each concern (Identity, Batch, Escrow, Carbon, Telemetry, Documents) lives in its own contract — means we can deploy a new version of, say, `CarbonRegistry` and simply point the system to the new address without redeploying everything. This is the foundation of a proxy-upgradeable pattern."*

**Q: How do we prevent a Manufacturer from minting fake batches?**
> *"Two layers of protection. First, only wallets with `SUPPLIER_ROLE` in `GovernanceRegistry` can call `mintBatch()`. Second, that wallet must also pass the `identityRegistry.isVerified(msg.sender)` check. Getting both requires approval from the platform admin. If fraud is detected post-verification, admin can call `revokeIdentity()`, which immediately blacklists the wallet from all future on-chain actions."*

**Q: How does this work for large enterprises that already have ERP systems like SAP?**
> *"The `erpHash` parameter in every stage-transition function is designed exactly for this. An enterprise can pass a `keccak256` hash of their internal ERP record ID into every blockchain call. This creates a permanent cryptographic link between their internal ERP database and our blockchain records, without exposing any proprietary ERP data on-chain."*
