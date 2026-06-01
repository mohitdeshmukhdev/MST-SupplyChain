# 🎬 MST SaralChain — Live Demo Requirements & Planning Guide

> This document is the **single source of truth** for planning, executing, and transitioning the end-to-end live demo of MST SaralChain.  
> It covers wallet setup, demo flow, bypass rules, UI gaps, and how to cleanly transition back to the real product after the demo.

---

## 📋 Table of Contents

1. [Demo Philosophy](#1-demo-philosophy)
2. [Required Wallets (MetaMask Accounts)](#2-required-wallets-metamask-accounts)
3. [End-to-End Demo Flow (Step-by-Step)](#3-end-to-end-demo-flow-step-by-step)
4. [Admin Approval Bypass Strategy](#4-admin-approval-bypass-strategy)
5. [What's Implemented vs. What's Missing](#5-whats-implemented-vs-whats-missing)
6. [UI Changes Required for Demo Mode](#6-ui-changes-required-for-demo-mode)
7. [Multi-Window Setup Guide](#7-multi-window-setup-guide)
8. [Transition Plan: Demo → Production](#8-transition-plan-demo--production)
9. [Known Friction Points & Solutions](#9-known-friction-points--solutions)

---

## 1. Demo Philosophy

The goal of the live demo is to show a **complete, uninterrupted supply chain journey** from product creation to payment release — all on a real blockchain.

### Core Rules
- **No dead-ends.** Every action must visually succeed within 5–10 seconds.
- **No "lorem ipsum" or mocked data.** All data must be real (real wallet, real blockchain tx, real DB records).
- **Admin approvals are simulated** — they auto-fire via the Relayer Wallet after a 5-second animated "waiting" period.
- **Each wallet = one persona.** The audience must see the interface change based on who is connected.
- **Parallel screens.** Ideally 2 browser windows (or 2 monitors) show different portals simultaneously so the audience sees real-time cause-and-effect.

---

## 2. Required Wallets (MetaMask Accounts)

You need **4 separate MetaMask accounts** (or browser profiles). All accounts should be imported or created fresh.

> ⚠️ **Critical:** Each account needs MST Testnet MST tokens for gas. Use the MST Testnet faucet at `https://faucet.mstblockchain.com` to top up before the demo.

| # | Role | Account Label | Primary Screen | Entity Type |
|---|------|---------------|----------------|-------------|
| 1 | **Network Admin / Relayer** | `RELAYER` | Backend only (automated) | `DEFAULT_ADMIN` |
| 2 | **Manufacturer / Supplier** | `SUPPLIER` | Supplier Portal (`/manufacturer/mint`) | `SUPPLIER` |
| 3 | **Transporter / Logistics** | `TRANSPORTER` | Transporter Hub (`/transporter`) | `TRANSPORTER` |
| 4 | **Retailer** | `RETAILER` | Retailer Portal (`/retailer`) | `RETAILER` |
| 5 | **Consumer / Auditor** | `CONSUMER` | QR Scanner (`/scanner`) | None needed |

> 💡 **Tip:** Use Firefox with **Multi-Account Containers** extension, or use separate Chrome profiles. Each profile has its own MetaMask with a different account active. Open all 4 browser windows side by side.

### MetaMask Network Config (MST Testnet)
```
Network Name: MST Testnet
RPC URL: https://testnetrpc.mstblockchain.com
Chain ID: [your chain id]
Currency Symbol: MST
Block Explorer: https://testnetscan.mstblockchain.com
```

---

## 3. End-to-End Demo Flow (Step-by-Step)

### 🎬 Pre-Demo Setup (Before Audience Arrives)
1. Start backend: `cd backend-engine && npm run start:dev`
2. Start frontend: `cd frontend-portal && npm run dev`
3. Open 4 browser windows — one per persona wallet
4. All 4 wallets should already be registered (KYC submitted and auto-approved)
5. Have Batch ID `1` already minted and visible on the dashboard

---

### 📍 Phase 0: Landing Page (30 seconds)
**Browser: Any wallet → `http://localhost:3000`**

- Show the professional landing page
- Highlight: "4 distinct portals, 7 smart contracts, 1 blockchain"
- Click "Launch Platform" to enter

---

### 📍 Phase 1: Identity Registration / KYC (1 minute)
**Browser: SUPPLIER wallet → `/identity`**

**What audience sees:**
- Connect MetaMask (SUPPLIER wallet)
- Fill in: Legal Name = "Foodpharma Ltd", Role = "Manufacturer/Supplier"
- Click "Mock Upload" for IPFS CID
- Click Submit → **Admin Approval Animation plays (5 seconds)**
- "✅ Identity Verified" badge appears instantly
- Sidebar immediately unlocks "Mint Batch" link

**Interface changes after KYC:**
- Before KYC: Sidebar shows only `Scanner` + `Identity (KYC)`
- After KYC: Sidebar unlocks `Mint Batch` (for SUPPLIER) or `Transporter Hub` (for TRANSPORTER) or `Retailer Portal` (for RETAILER)

> ⚡ **Demo Bypass:** The backend auto-calls `verifyIdentity()` on the GovernanceRegistry immediately after form submission. A 5-second spinner with the text "Pending Admin Approval on GovernanceRegistry..." plays, then the UI auto-refreshes to show "Verified".

---

### 📍 Phase 2: Batch Minting (1–2 minutes)
**Browser: SUPPLIER wallet → `/manufacturer/mint`**

**What audience sees:**
- Fill Product Details: GTIN, Product Name, Origin, Quantity, Weight
- Click "Anchor to Blockchain"
- Spinner: "Broadcasting to MST Testnet..."
- After 5–10 seconds: "✅ Batch #1 Minted — Tx: `0xabc...`"
- QR code appears with the Batch ID
- Navigates automatically to `/dashboard/[batchId]`

**Dashboard shows:**
- Supply Chain Journey flow chart (Minted → In Transit → Delivered)
- "Minted" stage is highlighted/active
- Blockchain Tx link is clickable

---

### 📍 Phase 3: Escrow Funding (1 minute)
**Browser: RETAILER wallet → `/retailer`**

**What audience sees:**
- Switch to RETAILER MetaMask account
- Look up the Batch ID (from QR code or paste)
- See batch summary: "Premium Organic Coffee Beans, 500 kg, Stage: MINTED"
- Click "Fund Escrow" → Enter amount → Confirm in MetaMask
- After confirmation: "💰 Escrow Funded — Smart Contract Locked"
- Dashboard updates: Escrow Status = FUNDED

---

### 📍 Phase 4: Custody Handover (Transporter → Checkpoint) (1–2 minutes)
**Browser: TRANSPORTER wallet → `/transporter`**

**What audience sees:**
- Switch to TRANSPORTER MetaMask account
- Tab: "Custody Handover (Checkpoint)"
- Enter: Batch ID, New Custodian Address (TRANSPORTER wallet), Location = "Mumbai Port"
- Click "Log Checkpoint" → Spinner → "✅ Custody Transferred on-chain"
- **Simultaneously on the SUPPLIER dashboard:** Stage updates to "IN_TRANSIT" (real-time polling every 3 seconds)

**Show simultaneously:** SUPPLIER window + TRANSPORTER window side by side

---

### 📍 Phase 5: IoT Telemetry Anchor (1 minute)
**Browser: TRANSPORTER wallet → `/transporter` → Telemetry Tab**

**What audience sees:**
- Enter: Batch ID, Temp = 4.2°C, Humidity = 65%
- Click "Anchor Telemetry" → Spinner → "✅ Sensor Hash Anchored to Blockchain"
- Dashboard Telemetry log updates with the new ping
- If temperature is out of range, a "🚨 Breach Alert" badge appears

---

### 📍 Phase 6: Carbon Emissions Log (30 seconds)
**Browser: TRANSPORTER wallet → `/transporter` → Carbon Tab**

**What audience sees:**
- Vehicle Type: "Heavy Goods Vehicle", Distance: 320 km, Weight: 0.5 tonnes
- Click "Calculate & Log" → ESG Score updates on the dashboard
- Carbon footprint: +18.5 kg CO₂ shown in the sidebar widget

---

### 📍 Phase 7: QR Scan (Consumer Verification) (30 seconds)
**Browser: CONSUMER → `/scanner`**

**What audience sees:**
- Open the QR code generated at mint
- Scan it → App redirects to `/dashboard/[batchId]`
- Consumer sees the full journey: Minted → In Transit → Carbon footprint
- "✅ Blockchain Verified Product" badge

---

### 📍 Phase 8: Delivery Confirmation & Escrow Release (1 minute)
**Browser: RETAILER wallet → `/retailer`**

**What audience sees:**
- Look up Batch ID
- Click "Confirm Delivery & Release Funds"
- MetaMask confirms the tx
- Stage transitions to "DELIVERED" or "RETAIL_READY"
- "✅ Funds Released to Supplier" appears
- Dashboard shows final state: all stages green

---

### 📍 Phase 9: Document Attachment (Optional, 30 seconds)
**Browser: TRANSPORTER or CUSTOMS wallet → any portal**

- Attach a compliance document IPFS CID to the batch
- "📄 Bill of Lading anchored — Document Hash: `0xabc...`"

---

## 4. Admin Approval Bypass Strategy

### The Problem
The real product requires a **Super Admin** to approve each KYC registration. For a live demo, waiting for a real admin to log in and approve would kill the flow.

### The Solution: Simulated Admin Approval

**How it works (already partially implemented):**

1. User submits the KYC form
2. Frontend shows a spinner with text:
   ```
   "⏳ Pending Admin Approval on GovernanceRegistry..."
   ```
3. After **5 seconds**, the backend automatically calls `verifyIdentity()` using the Relayer wallet (which has `DEFAULT_ADMIN_ROLE`)
4. The frontend auto-polls every 2 seconds and detects the verified state
5. Shows "✅ Identity Verified — You are now a verified Manufacturer"
6. Sidebar unlocks

**Backend mechanism (already built in `identity.service.ts`):**
- `registerIdentity()` already calls `upsert` + sets `isVerified: true`
- The Relayer auto-grants roles via `ensureRelayerAuthorized()` in `BlockchainService`

**What still needs to be built (frontend animation):**
- A `AdminApprovalTimer` component that shows a fake 5-second countdown
- Auto-redirect after the timer completes and the backend confirms verification

### For Production: How to Re-Enable Real Admin Approvals
1. Remove the `isVerified: true` from the `upsert` create block in `identity.service.ts`
2. Set `isVerified: false` — entities start unverified
3. Build the `/admin` panel where the Admin wallet calls `/api/identity/verify`
4. The Sidebar RBAC already reads `isVerified` from the backend — this change is transparent to the frontend

---

## 5. What's Implemented vs. What's Missing

### ✅ Implemented (Working)

| Feature | Route/Component | Status |
|---------|----------------|--------|
| Landing Page | `/` | ✅ Done |
| KYC / Identity Registration | `/identity` | ✅ Done |
| Wallet RBAC (Sidebar role gating) | `Sidebar.tsx` | ✅ Done |
| Manufacturer Batch Minting | `/manufacturer/mint` | ✅ Done |
| Batch Dashboard (Journey Visualizer) | `/dashboard/[batchId]` | ✅ Done |
| Transporter Checkpoint Log | `/transporter` | ✅ Done |
| IoT Telemetry Anchoring | `/transporter` → Telemetry Tab | ✅ Done |
| Carbon Emissions Log | `/transporter` → Carbon Tab | ✅ Done |
| Retailer Escrow Funding | `/retailer` | ✅ Done |
| Retailer Escrow Release | `/retailer` | ✅ Done |
| QR Scanner (Consumer) | `/scanner` | ✅ Done |
| Real-time Dashboard polling | Dashboard page | ✅ Done (3s interval) |
| Blockchain Tx links | Dashboard timeline | ✅ Done |
| On-chain Relayer auto-authorization | `BlockchainService` | ✅ Done |
| 7 Smart Contracts deployed | MST Testnet | ✅ Done |
| Supabase Postgres + Prisma ORM | Backend | ✅ Done |

---

### ❌ Missing / Gaps (Compared to Architecture Diagram)

| Feature | Planned In | Gap Description | Priority |
|---------|-----------|-----------------|----------|
| **Customs Agent Dashboard** | Architecture Diagram (Column 2) | No `/customs` portal exists | HIGH |
| **Admin / Super Admin Panel** | System Design | No UI to approve/reject KYC | HIGH |
| **Document Upload (IPFS)** | DocumentRegistry.sol | UI exists in backend but no frontend form | HIGH |
| **Admin Approval Animation** | Demo UX | No 5-second approval simulation | HIGH |
| **Batch List / All Batches View** | Sidebar "Batches" link | Links to `/dashboard` but there's no batch list page — only individual batch view | MEDIUM |
| **Purchase Orders (Retailer)** | Architecture | Only escrow, no PO workflow | MEDIUM |
| **Consumer QR journey page** | Sequence Diagram | Scanner works but consumer view is basic | MEDIUM |
| **Audit/History Log page** | Sequence Diagram (Auditor) | No dedicated auditor view | LOW |
| **WebSocket / Live events** | Architecture (WebSocket mentioned) | Using polling only, not true push | LOW |
| **IPFS Document Viewer** | DocumentRegistry.sol | Can anchor but can't view IPFS docs | LOW |
| **BullMQ Job Status UI** | Architecture | BullMQ runs but no job monitoring dashboard | LOW |
| **JWT Auth / API Keys** | Architecture Diagram | No auth on API endpoints (open REST) | LOW |

---

## 6. UI Changes Required for Demo Mode

### 6.1 Admin Approval Simulator Component
A new component `AdminApprovalTimer.tsx` that:
- Shows a pulsing "⏳ Awaiting Admin Approval" banner
- Counts down 5 seconds with a progress bar
- Auto-polls backend and transitions to "✅ Verified" state

### 6.2 Batch List Page (Missing)
The Sidebar "Batches" link goes to `/dashboard` which is empty. Need a **Batch Overview List** page that shows all minted batches with:
- Product name, GTIN, Stage badge, Blockchain ID
- Click to view → goes to `/dashboard/[batchId]`

### 6.3 Customs Agent Portal (Missing)
A new `/customs` route for the Customs Agent role showing:
- Document Review section (view attached IPFS documents)
- Border Clearance action (calls `updateStage()` on BatchRegistry)
- IPFS Certificate viewer

### 6.4 Demo Mode Banner
A site-wide yellow banner: `"🎬 Demo Mode Active — Admin approvals are automated for presentation purposes"`

### 6.5 Identity Page — Better UX
After successful registration, auto-redirect the user to their role-specific portal with a welcome message:
- SUPPLIER → `/manufacturer/mint`
- TRANSPORTER → `/transporter`
- RETAILER → `/retailer`

---

## 7. Multi-Window Setup Guide

### Recommended Physical Setup for Demo

```
Monitor 1 (Left):                   Monitor 2 (Right):
┌─────────────────────┐            ┌─────────────────────┐
│  SUPPLIER WALLET    │            │  TRANSPORTER WALLET │
│  /manufacturer/mint │            │  /transporter       │
│  Shows batch mint   │            │  Shows checkpoint   │
│  + dashboard        │            │  + telemetry        │
└─────────────────────┘            └─────────────────────┘

Tablet / Presenter Screen:
┌─────────────────────┐
│  RETAILER WALLET    │
│  /retailer          │
│  Shows escrow       │
└─────────────────────┘

Audience Phone (QR):
┌─────────────────────┐
│  CONSUMER           │
│  /scanner           │
│  Scans QR code      │
└─────────────────────┘
```

### Browser Profile Setup
1. **Chrome Profile 1** — SUPPLIER wallet (MetaMask Account 1)
2. **Chrome Profile 2** — TRANSPORTER wallet (MetaMask Account 2)
3. **Chrome Profile 3** — RETAILER wallet (MetaMask Account 3)
4. **Firefox** — CONSUMER (no wallet needed)

To create Chrome profiles: `Chrome menu → People → Add Person`

---

## 8. Transition Plan: Demo → Production

The demo uses the same codebase as production. Here's exactly what to change/remove when going live:

### In `backend-engine/src/identity/identity.service.ts`
```diff
- // Demo: Auto-approve on registration
- isVerified: true,
- verifiedBy: this.blockchain.relayerWallet.address,
+ // Production: Requires admin approval
+ isVerified: false,
+ verifiedBy: null,
```

### In `backend-engine/src/blockchain/blockchain.service.ts`
```diff
- // Demo: Auto-grant all roles to relayer on startup
- this.ensureRelayerAuthorized();
+ // Production: Comment out or restrict to initial deployment only
```

### In `frontend-portal` — Admin Panel
Build `/admin` portal (currently missing) with:
- View all pending (unverified) identity registrations
- "Approve" button calls `POST /api/identity/verify`
- "Reject" button calls the revoke endpoint
- Protected behind wallet check: only the Governance Admin wallet can access

### Demo Mode Banner
Remove or hide the "🎬 Demo Mode Active" banner by setting:
```env
NEXT_PUBLIC_DEMO_MODE=false
```

---

## 9. Known Friction Points & Solutions

| Friction Point | Root Cause | Solution |
|---------------|-----------|----------|
| Batch mint fails with "Not authorized" | Relayer wallet needs SUPPLIER_ROLE | ✅ Fixed — `ensureRelayerAuthorized()` now auto-grants roles on startup |
| Identity registration fails (duplicate) | `prisma.create` throws on duplicate walletAddress | ✅ Fixed — changed to `upsert` |
| COOP header breaks MetaMask wallet connect | `same-origin` policy too strict | ✅ Fixed — set to `same-origin-allow-popups` |
| Dashboard shows "Batch not found" for valid IDs | Backend was throwing 500 instead of 404 | ✅ Fixed — returns proper 404 |
| Sidebar doesn't unlock after KYC | Sidebar only refreshes on wallet change, not after form submit | 🔧 Needs: Add explicit re-fetch trigger after identity submit |
| No batch list page | Only individual batch view exists | 🔧 Needs: Create `/dashboard` page (without batchId) |
| Customs Agent has no portal | Only listed in identity dropdown | 🔧 Needs: Create `/customs` route |
| Admin approvals block demo | Real-world approvals require manual admin action | 🔧 Solution: 5-sec simulated approval (see Section 4) |

---

*Last Updated: June 2026 | For questions, contact the SaralChain Dev Team*
