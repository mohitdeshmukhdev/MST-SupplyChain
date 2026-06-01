# Render Backend Deployment Guide

Since the backend utilizes **BullMQ** and **Redis** for managing asynchronous blockchain transactions, it requires a persistent, long-running process. Deploying the NestJS backend to **Render** is the recommended approach as it supports long-running servers and native background workers.

Follow these step-by-step instructions to get your backend running on Render.

---

## 📋 Prerequisites

Before deploying the Web Service, you need a **Redis** instance. You have two options:
1. **Upstash Redis (Recommended & Free):** Create a free Redis instance on [Upstash](https://upstash.com) and copy the connection URL (starts with `rediss://`).
2. **Render Redis:** Create a Redis service directly on Render (requires a card on file, though it has a free/cheap tier).

---

## 🚀 Step 1: Create a New Web Service on Render

1. Go to the [Render Dashboard](https://dashboard.render.com/) and click **New** -> **Web Service**.
2. Connect your GitHub account and select your repository: `mohitdeshmukhdev/MST-SupplyChain`.
3. Configure the following settings:
   * **Name:** `mst-saralchain-backend` (or your preferred name)
   * **Region:** Select the region closest to you (e.g., Singapore or US East)
   * **Branch:** `main`
   * **Root Directory:** `backend-engine` *(⚠️ CRITICAL: This is a monorepo. You MUST set this to compile only the backend!)*
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npx prisma generate && npm run build`
   * **Start Command:** `npm run start:prod`
   * **Instance Type:** `Free` (or any paid tier)

---

## ⚙️ Step 2: Configure Environment Variables

Scroll down to the **Advanced** section or go to the **Env Groups / Environment Variables** tab and add the following keys:

| Key | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Sets the application environment |
| `DATABASE_URL` | `postgresql://...` | Your Supabase PostgreSQL Connection String (Transaction Pooler recommended) |
| `REDIS_URL` | `rediss://...` | Connection string for your Upstash/Render Redis instance |
| `RELAYER_PRIVATE_KEY` | `0x...` | The private key of the Ethereum wallet signing transactions on MST Testnet |
| `MST_RPC_URL` | `https://testnetrpc.mstblockchain.com` | RPC Endpoint for the MST L1 Testnet |

*Render will automatically assign a `PORT` variable and bind the application to `0.0.0.0:${PORT}`.*

---

## 🔍 Step 3: Trigger the Build

1. Click **Deploy Web Service** at the bottom of the page.
2. Render will pull your repository, isolate the `backend-engine` directory, install dependencies, run the Prisma engine generator, and build the NestJS bundle.
3. Once the logs show:
   ```text
   🚀 Backend Engine is running on: http://0.0.0.0:10000
   📚 Swagger documentation available at: http://0.0.0.0:10000/api/docs
   ```
   Your backend is fully live and publicly accessible!

---

## 🔗 Step 4: Connect your Vercel Frontend

Copy your Render Web Service URL (e.g., `https://mst-saralchain-backend.onrender.com`) and apply it to your Next.js frontend deployment:

1. Go to your **Vercel Dashboard**.
2. Select your Frontend project -> **Settings** -> **Environment Variables**.
3. Set/Update `NEXT_PUBLIC_API_URL` to your Render URL.
4. Redeploy the frontend so it registers the updated endpoint.
