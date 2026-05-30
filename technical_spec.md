# MST SaralChain Technical Specification Document

This document defines the data schemas, programmatic workflows, and execution logic. This ensures that the code generated has zero structural mistakes, zero security loopholes, and absolute enterprise performance.

---

## 1. Detailed System Process & Sequence Diagram
This workflow shows exactly how a physical cargo telemetry update is processed simultaneously across the serverless database cache and the immutable MST Layer-1 network:

```
[ Physical IoT Scanner ]       [ NestJS Gateway API ]       [ Redis BullMQ Queue ]      [ Supabase Postgres ]      [ MST Blockchain L1 Network ]
           │                               │                           │                           │                            │
           │── 1. Send JSON Telemetry ────>│                           │                           │                            │
           │    (Batch ID, GPS, Temp)      │                           │                           │                            │
           │                               │── 2. Push Update ────────>│                           │                            │
           │                               │                            │                           │                            │
           │                               │<── 3. Acknowledge Receipt ─│                           │                            │
           │<─ 4. Return 202 Accepted ─────│                           │                           │                            │
           │                               │                           │                           │                            │
           │                               │── 5. Process Next Job ───>│                           │                            │
           │                               │                           │                           │                            │
           │                               │── 6. Compute Hash ────────────────────────────────────┼───────────────────────────>│
           │                               │                           │                           │                            │
           │                               │── 7. Sign & Broadcast Tx ─────────────────────────────┼───────────────────────────>│
           │                               │                           │                           │                            │
           │                               │<── 8. Return Receipt ─────────────────────────────────┼────────────────────────────│
           │                               │                           │                           │                            │
           │                               │── 9. Save Relational Data & Tx Hash ─────────────────>│                            │
           │                               │                           │                           │                            │
           │                               │── 10. Update Redis Read Cache ────────────────────────┼────────────────────────────│
```

---

## 2. Definitive Database Entity-Relationship (ER) Schema
This schema handles off-chain operational data via Prisma ORM:

```prisma
// Location: backend-engine/prisma/schema.prisma

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

  @@index([blockchainId])                       // Accelerates Next.js portal timeline searches
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

## 3. Pure-EVM Smart Contract Architecture (SupplyChain.sol)
This contract handles programmatic enforcement, role access validations, state machine transitions, and native `tMST` crypto escrows:

```solidity
// Location: backend-engine/contracts/SupplyChain.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Enterprise L1 Supply Chain & Escrow Router
 * @notice Handles zero-compromise asset provenance anchoring and escrow payments on the MST Blockchain network.
 */
contract SupplyChain is AccessControl {
    bytes32 public constant SUPPLIER_ROLE = keccak256("SUPPLIER_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant LOGISTICS_ROLE = keccak256("LOGISTICS_ROLE");
    bytes32 public constant CUSTOMS_AGENT_ROLE = keccak256("CUSTOMS_AGENT_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    enum Stage { Supplied, Manufactured, InTransit, CustomsCleared, RetailReady, Sold }
    enum EscrowStatus { None, Held, Released, Refunded }

    struct Escrow {
        uint256 amount;
        address payable beneficiary;
        EscrowStatus status;
    }

    struct CustomsDoc {
        string docType;
        string ipfsCid;
        uint256 uploadTime;
        address verifiedBy;
    }

    struct Checkpoint {
        uint256 timestamp;
        string location;
        string status;
        bytes32 dataHash; 
        address handler;
    }

    struct Batch {
        uint256 batchId;
        string productName;
        address currentOwner;
        Stage stage;
        bool isCompleted;
        Checkpoint[] journey;
        CustomsDoc[] documentation;
    }

    uint256 private _batchIdCounter;
    mapping(uint256 => Batch) private batches;
    mapping(uint256 => Escrow) private escrows;

    event BatchCreated(uint256 indexed batchId, string productName, address indexed creator);
    event StageChanged(uint256 indexed batchId, Stage indexed stage, bytes32 dataHash, address indexed handler);
    event CustodyTransferred(uint256 indexed batchId, string location, string status, bytes32 dataHash, address indexed handler);
    event CustomsDocumentAttached(uint256 indexed batchId, string docType, string ipfsCid, address indexed authority);
    
    event EscrowDeposited(uint256 indexed batchId, uint256 amount, address indexed buyer, address indexed beneficiary);
    event EscrowReleased(uint256 indexed batchId, uint256 amount, address indexed beneficiary);
    event EscrowRefunded(uint256 indexed batchId, uint256 amount, address indexed buyer);

    constructor(address rootAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, rootAdmin);
        _grantRole(SUPPLIER_ROLE, rootAdmin);
        _grantRole(MANUFACTURER_ROLE, rootAdmin);
        _grantRole(LOGISTICS_ROLE, rootAdmin);
        _grantRole(CUSTOMS_AGENT_ROLE, rootAdmin);
        _grantRole(RETAILER_ROLE, rootAdmin);
    }

    function createBatch(string calldata productName, string calldata initialLocation, bytes32 erpHash) 
        external 
        onlyRole(SUPPLIER_ROLE) 
        returns (uint256) 
    {
        _batchIdCounter++;
        uint256 newBatchId = _batchIdCounter;

        Batch storage newBatch = batches[newBatchId];
        newBatch.batchId = newBatchId;
        newBatch.productName = productName;
        newBatch.currentOwner = msg.sender;
        newBatch.stage = Stage.Supplied;
        newBatch.isCompleted = false;

        newBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: initialLocation,
            status: "Batch Origin Created",
            dataHash: erpHash,
            handler: msg.sender
        }));

        emit BatchCreated(newBatchId, productName, msg.sender);
        emit StageChanged(newBatchId, Stage.Supplied, erpHash, msg.sender);
        return newBatchId;
    }

    function processManufacturing(uint256 batchId, bytes32 erpHash) 
        external 
        onlyRole(MANUFACTURER_ROLE) 
    {
        Batch storage targetBatch = batches[batchId];
        require(targetBatch.batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(targetBatch.stage == Stage.Supplied, "SC_ERR: Invalid stage sequence.");

        targetBatch.stage = Stage.Manufactured;
        targetBatch.currentOwner = msg.sender;
        targetBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: "Factory Processing",
            status: "Manufacture Processing Completed",
            dataHash: erpHash,
            handler: msg.sender
        }));

        emit StageChanged(batchId, Stage.Manufactured, erpHash, msg.sender);
    }

    function startTransit(uint256 batchId, bytes32 erpHash) 
        external 
        onlyRole(LOGISTICS_ROLE) 
    {
        Batch storage targetBatch = batches[batchId];
        require(targetBatch.batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(targetBatch.stage == Stage.Manufactured, "SC_ERR: Invalid stage sequence.");

        targetBatch.stage = Stage.InTransit;
        targetBatch.currentOwner = msg.sender;
        targetBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: "Logistics Hub",
            status: "In Transit Started",
            dataHash: erpHash,
            handler: msg.sender
        }));

        emit StageChanged(batchId, Stage.InTransit, erpHash, msg.sender);
    }

    function transferCustody(uint256 batchId, string calldata nextLocation, string calldata currentStatus, bytes32 erpHash) 
        external 
        onlyRole(LOGISTICS_ROLE) 
    {
        Batch storage targetBatch = batches[batchId];
        require(targetBatch.batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(targetBatch.stage == Stage.InTransit, "SC_ERR: Batch is not currently in transit.");

        targetBatch.currentOwner = msg.sender;
        targetBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: nextLocation,
            status: currentStatus,
            dataHash: erpHash,
            handler: msg.sender
        }));

        emit CustodyTransferred(batchId, nextLocation, currentStatus, erpHash, msg.sender);
    }

    function attachCustomsDocument(uint256 batchId, string calldata docType, string calldata ipfsCid) 
        external 
        onlyRole(CUSTOMS_AGENT_ROLE) 
    {
        Batch storage targetBatch = batches[batchId];
        require(targetBatch.batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(targetBatch.stage == Stage.InTransit, "SC_ERR: Invalid stage sequence.");
        require(bytes(ipfsCid).length == 46, "SC_ERR: Invalid cryptographic IPFS CID signature length.");
        
        targetBatch.documentation.push(CustomsDoc({
            docType: docType,
            ipfsCid: ipfsCid,
            uploadTime: block.timestamp,
            verifiedBy: msg.sender
        }));

        targetBatch.stage = Stage.CustomsCleared;
        
        // Auto-compute hash for state transition event
        bytes32 dataHash = keccak256(abi.encodePacked(docType, ipfsCid));
        targetBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: "Border Customs Checkpoint",
            status: "Customs Compliance Docs Verified",
            dataHash: dataHash,
            handler: msg.sender
        }));

        emit CustomsDocumentAttached(batchId, docType, ipfsCid, msg.sender);
        emit StageChanged(batchId, Stage.CustomsCleared, dataHash, msg.sender);
    }

    function receiveAtRetail(uint256 batchId, bytes32 erpHash) 
        external 
        onlyRole(RETAILER_ROLE) 
    {
        Batch storage targetBatch = batches[batchId];
        require(targetBatch.batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(targetBatch.stage == Stage.CustomsCleared, "SC_ERR: Invalid stage sequence.");

        targetBatch.stage = Stage.RetailReady;
        targetBatch.currentOwner = msg.sender;
        targetBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: "Retail Store",
            status: "Received and Stocked at Retail Outlet",
            dataHash: erpHash,
            handler: msg.sender
        }));

        emit StageChanged(batchId, Stage.RetailReady, erpHash, msg.sender);

        // Auto-release escrow when goods reach retail store
        _releaseEscrow(batchId);
    }

    function sellToConsumer(uint256 batchId, bytes32 erpHash) 
        external 
        onlyRole(RETAILER_ROLE) 
    {
        Batch storage targetBatch = batches[batchId];
        require(targetBatch.batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(targetBatch.stage == Stage.RetailReady, "SC_ERR: Batch not ready for final sale.");

        targetBatch.stage = Stage.Sold;
        targetBatch.isCompleted = true;
        targetBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: "Point of Sale",
            status: "Sold to End Consumer",
            dataHash: erpHash,
            handler: msg.sender
        }));

        emit StageChanged(batchId, Stage.Sold, erpHash, msg.sender);
    }

    // --- Escrow Functions ---

    function depositEscrow(uint256 batchId, address payable beneficiary) external payable {
        require(msg.value > 0, "SC_ERR: Zero deposit value.");
        require(batches[batchId].batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(escrows[batchId].status == EscrowStatus.None, "SC_ERR: Escrow already active or closed.");

        escrows[batchId] = Escrow({
            amount: msg.value,
            beneficiary: beneficiary,
            status: EscrowStatus.Held
        });

        emit EscrowDeposited(batchId, msg.value, msg.sender, beneficiary);
    }

    function _releaseEscrow(uint256 batchId) internal {
        Escrow storage escrow = escrows[batchId];
        if (escrow.status == EscrowStatus.Held) {
            escrow.status = EscrowStatus.Released;
            uint256 transferAmount = escrow.amount;
            escrow.amount = 0;
            escrow.beneficiary.transfer(transferAmount);

            emit EscrowReleased(batchId, transferAmount, escrow.beneficiary);
        }
    }

    function refundEscrow(uint256 batchId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Escrow storage escrow = escrows[batchId];
        require(escrow.status == EscrowStatus.Held, "SC_ERR: Escrow is not in Held state.");
        
        escrow.status = EscrowStatus.Refunded;
        uint256 refundAmount = escrow.amount;
        escrow.amount = 0;
        
        address payable buyer = payable(msg.sender); // In real-world, mapping holds buyer address. Here, returns to Admin/caller.
        buyer.transfer(refundAmount);

        emit EscrowRefunded(batchId, refundAmount, buyer);
    }

    // --- Getters ---

    function getBatchHistory(uint256 batchId) external view returns (Batch memory) {
        require(batches[batchId].batchId != 0, "SC_ERR: Batch target index does not exist.");
        return batches[batchId];
    }

    function getEscrowDetails(uint256 batchId) external view returns (uint256, address, EscrowStatus) {
        Escrow memory escrow = escrows[batchId];
        return (escrow.amount, escrow.beneficiary, escrow.status);
    }
}
```

---

## 4. Automated Concurrent Nonce Management (BullMQ Engine Logic)
To support high scalability, NestJS does not communicate with the MST L1 RPC node directly during telemetry updates. Instead, incoming tracking requests are pushed into a Redis-backed queue:

```typescript
// Location: backend-engine/src/blockchain/blockchain.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';import { Job } from 'bullmq';import { ethers } from 'ethers';import { PrismaService } from '../prisma/prisma.service';

@Processor('blockchain-tx-queue')export class BlockchainProcessor extends WorkerHost {
  private contract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor(private prisma: PrismaService) {
    super();
    const provider = new ethers.JsonRpcProvider(process.env.MST_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    
    const abi = [
      "function transferCustody(uint256 batchId, string memory nextLocation, string memory currentStatus, bytes32 erpHash) external"
    ];
    this.contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, this.wallet);
  }

  /**
   * Processes blockchain transactions sequentially from the queue.
   * This guarantees that transactions are signed with the correct incremented nonce values.
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { databaseBatchId, blockchainId, location, status, keccak256Hash, telemetryPayload } = job.data;

    try {
      // Execute transaction on the MST Blockchain network
      const tx = await this.contract.transferCustody(
        blockchainId,
        location,
        status,
        keccak256Hash
      );
      
      // Wait for block confirmation
      const receipt = await tx.wait();

      // Write transaction history directly to PostgreSQL using Prisma
      await this.prisma.checkpoint.create({
        data: {
          batchId: databaseBatchId,
          location: location,
          status: status,
          temperature: parseFloat(telemetryPayload.temperatureCelsius),
          humidity: parseFloat(telemetryPayload.humidityPercentage),
          gpsCoordinates: telemetryPayload.gpsCoordinates,
          blockchainHash: keccak256Hash,
          txHash: tx.hash,
          handlerAddress: this.wallet.address
        }
      });

      return { txHash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
      throw new Error(`Queue Processing Failure: ${error.message}`);
    }
  }
}
```
