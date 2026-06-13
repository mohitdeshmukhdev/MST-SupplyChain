# MST Supply Chain: End-to-End Testing Guide

Follow this guide to successfully test the entire dApp flow and avoid "Batch Not Found" or "Wrong Network" errors.

## 1. Network Configuration (Fixing "Wrong Network")
Your MetaMask wallet is likely connected to Ethereum Mainnet or a different network. The dApp expects the **MST Testnet**.

### Option A: Add the MST Testnet to MetaMask
1. Open MetaMask -> Click the Network Dropdown -> **Add network** -> **Add a network manually**.
2. Fill in the details:
   - **Network Name:** MST Testnet
   - **New RPC URL:** `https://testnetrpc.mstblockchain.com`
   - **Chain ID:** `91562037`
   - **Currency Symbol:** `tMSTC`
   - **Block Explorer URL:** `https://testnet.mstscan.com/`
3. Click **Save** and switch to this network.

*Note: If the real testnet RPC is down, you can temporarily switch the `Web3Provider.tsx` file in the frontend to use `hardhat` or `localhost` chain from viem.*

## 2. Start the Application
Make sure both your backend and frontend are running simultaneously:
1. **Backend:** In one terminal inside `backend-engine`, run `npm run start:dev`. (It should run on port 5000).
2. **Frontend:** In another terminal inside `frontend-portal`, run `npm run dev`. (It should run on port 3000).

## 3. The End-to-End Flow (Creating Data)

### Step 1: Mint a Batch (Manufacturer)
You are currently seeing "Batch Not Found" because `BATCH-001` does not exist in your local database.
1. Open the frontend at `http://localhost:3000`.
2. Navigate to **Mint Batch** in the sidebar.
3. Fill out the form (e.g., GTIN `01234567890123`, Quantity `100`).
4. Click **Mint Batch on Blockchain**.
5. **CRITICAL:** Wait for the success message. The system will create a real batch in the database and give you a UUID.

### Step 2: View the Dashboard (The Fix)
1. Navigate to **Batches** in the sidebar, or copy the Batch ID from the Mint success screen.
2. Go to `http://localhost:3000/dashboard/YOUR-NEW-BATCH-ID` (Replace `YOUR-NEW-BATCH-ID` with the actual UUID).
3. *Do not go to `/dashboard/BATCH-001` unless you manually seeded the database with that ID.*
4. You will now see the beautiful new Dashboard timeline and the **Demo QR Codes**.

### Step 3: Logistics (Transporter Hub)
1. Go to the **Transporter Hub**.
2. **Checkpoint Handover:** Paste your new Batch ID, enter a location, and submit.
3. **IoT Telemetry:** Paste your new Batch ID, enter a high temperature (e.g., `10` °C) to trigger a compliance breach!
4. **Carbon Tracking:** Submit the distance.
5. Go back to your Batch Dashboard to see these events populate the timeline in real-time!

### Step 4: Escrow (Retailer Portal)
1. Go to the **Retailer Portal**.
2. Paste the Batch ID.
3. Click **Fund Escrow**. MetaMask will pop up asking you to deposit `tMST` into the smart contract.
4. Once the batch reaches the final destination, click **Release Funds** to disburse the payment to the supplier.
