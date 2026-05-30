# Prisma Cloud Relational Persistence Specification

This document details the configuration, database migrations, and schema mappings using Prisma ORM to interact with the Supabase Cloud PostgreSQL database.

---

## 1. Environment Connection Setup (.env)
Your `backend-engine/` workspace will utilize the **Transaction Pooler Connection String** (AWS AWS-0 pooler on Port 6543) to prevent backend execution from exhausting database connection limits during telemetry load testing:

```env
PORT=5000
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT_ID]:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

## 2. Updated Prisma Relational Schema
Replace the contents of `backend-engine/prisma/schema.prisma` with this schema, mapping all operational states, check-ins, customs paperwork, and escrow settings:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum PaymentStatus {
  PENDING
  PAID
  CONFIRMED
  FAILED
}

enum BatchStage {
  SUPPLIED
  MANUFACTURED
  IN_TRANSIT
  CUSTOMS_CLEARED
  RETAIL_READY
  SOLD
}

enum EscrowStatus {
  NONE
  HELD
  RELEASED
  REFUNDED
}

model Batch {
  id             String        @id @default(uuid())
  blockchainId   Int           @unique           // Native tracking ID indexed directly from the MST Contract
  productName    String
  currentOwner   String
  stage          BatchStage    @default(SUPPLIED)
  isCompleted    Boolean       @default(false)
  escrowAmount   Float         @default(0.0)
  escrowStatus   EscrowStatus  @default(NONE)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  checkpoints    Checkpoint[]
  customsDocs    CustomsDoc[]
  payments       Payment[]

  @@index([blockchainId])
}

model Checkpoint {
  id               String   @id @default(uuid())
  batchId          String
  batch            Batch    @relation(fields: [batchId], references: [id], onDelete: Cascade)
  location         String
  status           String
  temperature      Float?                         // Granular off-chain telemetry metrics
  humidity         Float?                         
  gpsCoordinates   String?  
  blockchainHash   String                         // The payload hash written to the blockchain contract
  txHash           String                         // Transaction reference verification string
  handlerAddress   String
  createdAt        DateTime @default(now())

  @@index([batchId])
}

model CustomsDoc {
  id              String   @id @default(uuid())
  batchId         String
  batch           Batch    @relation(fields: [batchId], references: [id], onDelete: Cascade)
  docType         String   // e.g., "Bill of Lading", "Certificate of Origin"
  ipfsCid         String   // Immutable decentralized content address
  txHash          String   // Transaction reference verification string
  authoritySigner String
  createdAt       DateTime @default(now())

  @@index([batchId])
}

model Payment {
  id                String        @id @default(uuid())
  batchId           String
  batch             Batch         @relation(fields: [batchId], references: [id], onDelete: Cascade)
  chainPayInvoiceId String        @unique          // Unique lookup key from ChainPay.biz API
  amountFiat        Float
  currency          String        @default("USD")
  cryptoAddress     String?       
  status            PaymentStatus @default(PENDING)
  txHash            String?       
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([chainPayInvoiceId])
}
```

---

## 3. Deployment & Migration Sequence
To push your schema updates to the Supabase Cloud, run the following command sequence inside the `backend-engine/` terminal path:

```bash
# 1. Initialize Prisma (if not done)
npx prisma init

# 2. Push database schema to Supabase and generate TypeScript types
npx prisma migrate dev --name init_multi_role_supply_chain
```

Go back to your online Supabase dashboard and verify the tables `Batch`, `Checkpoint`, `CustomsDoc`, and `Payment` are live and mapped correctly.
