# Vercel Deployment Guide

To deploy the MST SaralChain MVP to Vercel and share it with the DevRel team, follow these exact steps. Because we have a mono-repo structure, you will create **two separate Vercel projects**: one for the Frontend, and one for the Backend.

---

## Part 1: Deploy the Backend (NestJS Engine)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New -> Project**.
2. Import the `MST SaralChain` GitHub repository.
3. In the "Configure Project" screen, make the following changes:
   - **Project Name:** `mst-saralchain-backend`
   - **Root Directory:** Click `Edit` and select `backend-engine`.
   - **Framework Preset:** Leave it as `Other`. Vercel will automatically use the `vercel.json` file we just created.
   - **Environment Variables:** You MUST add the following environment variables (copy them from your local `.env` inside `backend-engine`):
     - `DATABASE_URL` (Your Supabase connection string)
     - `DIRECT_URL` (Your Supabase direct connection string)
     - `RPC_URL` (The MST Testnet RPC URL)
     - `PRIVATE_KEY` (The relayer wallet private key)
4. Click **Deploy**.
5. Once deployed, copy the production URL of your backend (e.g., `https://mst-saralchain-backend.vercel.app`).

> [!WARNING]  
> **Serverless Limitations on Vercel:** Vercel free tier (Hobby) limits function execution to 10 seconds. Blockchain transactions (like `mintBatch`) may occasionally take longer than 10 seconds to confirm on-chain. If you encounter timeout errors during the demo, it is because Vercel terminated the connection early. For a production environment, we highly recommend deploying the NestJS backend to **Render** or **Railway** instead of Vercel, as they support long-running workers (BullMQ) and WebSockets natively.

---

## Part 2: Deploy the Frontend (Next.js Portal)

1. Go back to the Vercel Dashboard and click **Add New -> Project**.
2. Import the *same* `MST SaralChain` GitHub repository again.
3. In the "Configure Project" screen:
   - **Project Name:** `mst-saralchain-frontend`
   - **Root Directory:** Click `Edit` and select `frontend-portal`.
   - **Framework Preset:** Vercel will automatically detect `Next.js`.
   - **Environment Variables:** Add the following key:
     - **Name:** `NEXT_PUBLIC_API_URL`
     - **Value:** Paste the URL from Part 1 (e.g., `https://mst-saralchain-backend.vercel.app`). *Make sure there is no trailing slash.*
4. Click **Deploy**.
5. Vercel will build the Next.js app, automatically replacing the local `http://localhost:5000` URLs with your new backend URL!

---

## Notes on the "Batch-001" Fix
I have updated the backend's lookup logic. Whenever you type `BATCH-001` or `1` in the scanner or Customs dashboard, the backend will now smartly parse the number out of it and look up the correct `blockchainId` (which is stored as an integer, while the DB uses UUIDs internally). This completely fixes the *"No data exists"* error!

Let me know once you have triggered the deployments, or if you need any adjustments to the `vercel.json`!
