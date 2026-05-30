// Location: backend-engine/test/SupplyChain.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain Smart Contract", function () {
  let SupplyChain;
  let supplyChain;
  let admin;
  let supplier;
  let manufacturer;
  let logistics;
  let customs;
  let retailer;
  let beneficiary;
  let other;

  beforeEach(async function () {
    // Get signers
    [admin, supplier, manufacturer, logistics, customs, retailer, beneficiary, other] = await ethers.getSigners();

    // Deploy contract
    SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy(admin.address);

    // Grant roles
    await supplyChain.grantRole(await supplyChain.SUPPLIER_ROLE(), supplier.address);
    await supplyChain.grantRole(await supplyChain.MANUFACTURER_ROLE(), manufacturer.address);
    await supplyChain.grantRole(await supplyChain.LOGISTICS_ROLE(), logistics.address);
    await supplyChain.grantRole(await supplyChain.CUSTOMS_AGENT_ROLE(), customs.address);
    await supplyChain.grantRole(await supplyChain.RETAILER_ROLE(), retailer.address);
  });

  describe("Deployment and Roles Setup", function () {
    it("Should grant the deployer admin roles by default", async function () {
      const adminRole = await supplyChain.DEFAULT_ADMIN_ROLE();
      expect(await supplyChain.hasRole(adminRole, admin.address)).to.equal(true);
    });

    it("Should correctly grant roles to specific stakeholders", async function () {
      expect(await supplyChain.hasRole(await supplyChain.SUPPLIER_ROLE(), supplier.address)).to.equal(true);
      expect(await supplyChain.hasRole(await supplyChain.MANUFACTURER_ROLE(), manufacturer.address)).to.equal(true);
      expect(await supplyChain.hasRole(await supplyChain.LOGISTICS_ROLE(), logistics.address)).to.equal(true);
      expect(await supplyChain.hasRole(await supplyChain.CUSTOMS_AGENT_ROLE(), customs.address)).to.equal(true);
      expect(await supplyChain.hasRole(await supplyChain.RETAILER_ROLE(), retailer.address)).to.equal(true);
    });
  });

  describe("Supply Chain Lifecycle Transitions", function () {
    const dummyHash1 = ethers.keccak256(ethers.toUtf8Bytes("Supplied telemetry data"));
    const dummyHash2 = ethers.keccak256(ethers.toUtf8Bytes("Manufactured telemetry data"));
    const dummyHash3 = ethers.keccak256(ethers.toUtf8Bytes("InTransit telemetry data"));
    const dummyHash4 = ethers.keccak256(ethers.toUtf8Bytes("RetailReady telemetry data"));
    const dummyHash5 = ethers.keccak256(ethers.toUtf8Bytes("Sold telemetry data"));
    const ipfsCid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"; // 46 characters

    it("Should allow Supplier to create a batch (Stage: Supplied)", async function () {
      await expect(supplyChain.connect(supplier).createBatch("Premium Coffee Beans", 1000, "kg", 1717200000, 1748736000, "LOT-123", "00012345678905", "Mexico", "Keep Dry", "Chiapas Organic Farm", dummyHash1))
        .to.emit(supplyChain, "BatchCreated")
        .withArgs(1, "Premium Coffee Beans", supplier.address);

      const batch = await supplyChain.getBatchHistory(1);
      expect(batch.stage).to.equal(0); // Stage.Supplied
      expect(batch.productName).to.equal("Premium Coffee Beans");
      expect(batch.quantity).to.equal(1000);
      expect(batch.gs1Gtin).to.equal("00012345678905");
      expect(batch.currentOwner).to.equal(supplier.address);
    });

    it("Should prevent non-suppliers from creating a batch", async function () {
      await expect(
        supplyChain.connect(other).createBatch("Coffee", 100, "kg", 0, 0, "L", "G", "O", "H", "Farm", dummyHash1)
      ).to.be.reverted;
    });

    it("Should transition: Supplied -> Manufactured", async function () {
      await supplyChain.connect(supplier).createBatch("Premium Coffee Beans", 1000, "kg", 1717200000, 1748736000, "LOT-123", "00012345678905", "Mexico", "Keep Dry", "Chiapas Organic Farm", dummyHash1);
      
      await expect(supplyChain.connect(manufacturer).processManufacturing(1, dummyHash2))
        .to.emit(supplyChain, "StageChanged")
        .withArgs(1, 1, dummyHash2, manufacturer.address); // Stage.Manufactured = 1

      const batch = await supplyChain.getBatchHistory(1);
      expect(batch.stage).to.equal(1); // Manufactured
    });

    it("Should prevent out-of-order transition (e.g. Supplied -> InTransit)", async function () {
      await supplyChain.connect(supplier).createBatch("Premium Coffee Beans", 1000, "kg", 1717200000, 1748736000, "LOT-123", "00012345678905", "Mexico", "Keep Dry", "Chiapas Organic Farm", dummyHash1);
      
      // Attempting transit start directly before manufacturing should revert
      await expect(
        supplyChain.connect(logistics).startTransit(1, dummyHash3)
      ).to.be.revertedWith("SC_ERR: Invalid stage sequence.");
    });

    it("Should transition: Manufactured -> InTransit -> CustomsCleared", async function () {
      await supplyChain.connect(supplier).createBatch("Coffee", 100, "kg", 0, 0, "L", "G", "O", "H", "Farm", dummyHash1);
      await supplyChain.connect(manufacturer).processManufacturing(1, dummyHash2);
      
      // Start Transit
      await expect(supplyChain.connect(logistics).startTransit(1, dummyHash3))
        .to.emit(supplyChain, "StageChanged")
        .withArgs(1, 2, dummyHash3, logistics.address); // Stage.InTransit = 2

      // Checkpoint updates inside InTransit
      await expect(supplyChain.connect(logistics).transferCustody(1, "Veracruz Port", "Arrived at Warehouse", dummyHash3))
        .to.emit(supplyChain, "CustodyTransferred")
        .withArgs(1, "Veracruz Port", "Arrived at Warehouse", dummyHash3, logistics.address);

      // Verify Customs compliance doc upload
      await expect(supplyChain.connect(customs).attachCustomsDocument(1, "Phytosanitary Certificate", ipfsCid))
        .to.emit(supplyChain, "CustomsDocumentAttached")
        .withArgs(1, "Phytosanitary Certificate", ipfsCid, customs.address);

      const batch = await supplyChain.getBatchHistory(1);
      expect(batch.stage).to.equal(3); // Stage.CustomsCleared = 3
    });

    it("Should transition: CustomsCleared -> RetailReady -> Sold", async function () {
      await supplyChain.connect(supplier).createBatch("Coffee", 100, "kg", 0, 0, "L", "G", "O", "H", "Farm", dummyHash1);
      await supplyChain.connect(manufacturer).processManufacturing(1, dummyHash2);
      await supplyChain.connect(logistics).startTransit(1, dummyHash3);
      await supplyChain.connect(customs).attachCustomsDocument(1, "Certificate of Origin", ipfsCid);

      // Receive at Retail Store
      await expect(supplyChain.connect(retailer).receiveAtRetail(1, dummyHash4))
        .to.emit(supplyChain, "StageChanged")
        .withArgs(1, 4, dummyHash4, retailer.address); // Stage.RetailReady = 4

      // Sell to Consumer
      await expect(supplyChain.connect(retailer).sellToConsumer(1, dummyHash5))
        .to.emit(supplyChain, "StageChanged")
        .withArgs(1, 5, dummyHash5, retailer.address); // Stage.Sold = 5

      const batch = await supplyChain.getBatchHistory(1);
      expect(batch.isCompleted).to.equal(true);
      expect(batch.stage).to.equal(5); // Sold
    });
  });

  describe("tMST Escrow System", function () {
    const dummyHash1 = ethers.keccak256(ethers.toUtf8Bytes("Supplied telemetry data"));
    const dummyHash2 = ethers.keccak256(ethers.toUtf8Bytes("Manufactured telemetry data"));
    const dummyHash3 = ethers.keccak256(ethers.toUtf8Bytes("InTransit telemetry data"));
    const ipfsCid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

    beforeEach(async function () {
      // Create batch
      await supplyChain.connect(supplier).createBatch("Coffee", 100, "kg", 0, 0, "L", "G", "O", "H", "Farm", dummyHash1);
    });

    it("Should allow depositing escrow funds for a batch", async function () {
      const depositAmount = ethers.parseEther("1.5");
      
      await expect(supplyChain.connect(other).depositEscrow(1, beneficiary.address, { value: depositAmount }))
        .to.emit(supplyChain, "EscrowDeposited")
        .withArgs(1, depositAmount, other.address, beneficiary.address);

      const [amount, buyerAddress, beneficiaryAddress, status] = await supplyChain.getEscrowDetails(1);
      expect(amount).to.equal(depositAmount);
      expect(buyerAddress).to.equal(other.address);
      expect(beneficiaryAddress).to.equal(beneficiary.address);
      expect(status).to.equal(1); // EscrowStatus.Held
    });

    it("Should automatically release escrow to beneficiary when received at retail", async function () {
      const depositAmount = ethers.parseEther("2.0");
      await supplyChain.connect(other).depositEscrow(1, beneficiary.address, { value: depositAmount });

      // Run through stages
      await supplyChain.connect(manufacturer).processManufacturing(1, dummyHash2);
      await supplyChain.connect(logistics).startTransit(1, dummyHash3);
      await supplyChain.connect(customs).attachCustomsDocument(1, "Customs Cleared", ipfsCid);

      // Verify beneficiary receives payment upon Retailer receipt
      const beforeBalance = await ethers.provider.getBalance(beneficiary.address);

      await expect(supplyChain.connect(retailer).receiveAtRetail(1, dummyHash2))
        .to.emit(supplyChain, "EscrowReleased")
        .withArgs(1, depositAmount, beneficiary.address);

      const afterBalance = await ethers.provider.getBalance(beneficiary.address);
      expect(afterBalance - beforeBalance).to.equal(depositAmount);

      const [amount, , , status] = await supplyChain.getEscrowDetails(1);
      expect(amount).to.equal(0n);
      expect(status).to.equal(2); // EscrowStatus.Released
    });

    it("Should allow admin to refund escrow to buyer", async function () {
      const depositAmount = ethers.parseEther("5.0");
      // Admin deposits escrow
      await supplyChain.connect(admin).depositEscrow(1, beneficiary.address, { value: depositAmount });

      const beforeBalance = await ethers.provider.getBalance(admin.address);

      // Refund escrow (tx gas costs need to be considered, but we expect Refunded event)
      const tx = await supplyChain.connect(admin).refundEscrow(1);
      await tx.wait();

      const [amount, , , status] = await supplyChain.getEscrowDetails(1);
      expect(amount).to.equal(0n);
      expect(status).to.equal(3); // EscrowStatus.Refunded
    });

    it("Should prevent non-admins from refunding escrow", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await supplyChain.connect(other).depositEscrow(1, beneficiary.address, { value: depositAmount });

      await expect(
        supplyChain.connect(other).refundEscrow(1)
      ).to.be.reverted;
    });
  });
});
