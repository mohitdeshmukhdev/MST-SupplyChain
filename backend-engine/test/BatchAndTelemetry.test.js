const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Multi-Registry Infrastructure (Batch & Telemetry)", function () {
  let GovernanceRegistry, governance;
  let IdentityRegistry, identity;
  let BatchRegistry, batch;
  let TelemetryRegistry, telemetry;
  
  let deployer, supplier, transporter, hacker, systemRelayer;

  before(async function () {
    [deployer, supplier, transporter, hacker, systemRelayer] = await ethers.getSigners();

    // Deploy Governance
    GovernanceRegistry = await ethers.getContractFactory("GovernanceRegistry");
    governance = await GovernanceRegistry.deploy();
    await governance.waitForDeployment();

    // Deploy Identity
    IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identity = await IdentityRegistry.deploy(await governance.getAddress());
    await identity.waitForDeployment();

    // Setup Roles & Identity
    const supplierRole = await governance.SUPPLIER_ROLE();
    const systemRole = await governance.SYSTEM_ROLE();
    
    await governance.grantRole(supplierRole, supplier.address);
    await governance.grantRole(systemRole, systemRelayer.address);
    
    await identity.verifyIdentity(supplier.address, "Global Supplier", "TAX-1", "USA", "Supplier");
    await identity.verifyIdentity(transporter.address, "Fast Logistics", "TAX-2", "UK", "Transporter");

    // Deploy Batch
    BatchRegistry = await ethers.getContractFactory("BatchRegistry");
    batch = await BatchRegistry.deploy(await governance.getAddress(), await identity.getAddress());
    await batch.waitForDeployment();

    // Deploy Telemetry
    TelemetryRegistry = await ethers.getContractFactory("TelemetryRegistry");
    telemetry = await TelemetryRegistry.deploy(await governance.getAddress(), await batch.getAddress());
    await telemetry.waitForDeployment();
  });

  describe("BatchRegistry.sol", function () {
    it("Should allow verified supplier to mint a batch", async function () {
      await expect(batch.connect(supplier).mintBatch("GTIN-123", "Factory A", 1000, "Boxes"))
        .to.emit(batch, "BatchMinted")
        .withArgs(1, "GTIN-123", supplier.address);

      const batchData = await batch.getBatch(1);
      expect(batchData.gtin).to.equal("GTIN-123");
      expect(batchData.quantity).to.equal(1000);
      expect(batchData.currentCustodian).to.equal(supplier.address);
    });

    it("Should prevent unverified manufacturers from minting", async function () {
      const supplierRole = await governance.SUPPLIER_ROLE();
      await governance.grantRole(supplierRole, hacker.address); // Has role but no identity

      await expect(
        batch.connect(hacker).mintBatch("GTIN-FAKE", "Hacker Den", 1, "kg")
      ).to.be.revertedWith("Manufacturer identity not verified");
    });

    it("Should allow custodian to transfer custody", async function () {
      await expect(batch.connect(supplier).transferCustody(1, transporter.address))
        .to.emit(batch, "CustodyTransferred")
        .withArgs(1, supplier.address, transporter.address);

      const batchData = await batch.getBatch(1);
      expect(batchData.currentCustodian).to.equal(transporter.address);
    });

    it("Should prevent non-custodians from transferring", async function () {
      await expect(
        batch.connect(supplier).transferCustody(1, hacker.address)
      ).to.be.revertedWith("Caller is not current custodian");
    });
  });

  describe("TelemetryRegistry.sol", function () {
    const mockHash = ethers.keccak256(ethers.toUtf8Bytes("temperature:4C,gps:lat,lon"));
    const breachHash = ethers.keccak256(ethers.toUtf8Bytes("temperature:10C,gps:lat,lon"));

    it("Should allow current custodian to anchor telemetry", async function () {
      await expect(telemetry.connect(transporter).anchorTelemetry(1, mockHash, false, ""))
        .to.emit(telemetry, "TelemetryAnchored")
        .withArgs(1, mockHash, false);

      expect(await telemetry.getTelemetryCount(1)).to.equal(1);
    });

    it("Should allow SYSTEM_ROLE to anchor telemetry on behalf of IoT devices", async function () {
      await expect(telemetry.connect(systemRelayer).anchorTelemetry(1, mockHash, false, ""))
        .to.emit(telemetry, "TelemetryAnchored");
    });

    it("Should emit ComplianceBreached if temperature threshold exceeded", async function () {
      await expect(telemetry.connect(transporter).anchorTelemetry(1, breachHash, true, "Temp > 8C"))
        .to.emit(telemetry, "ComplianceBreached")
        .withArgs(1, "Temp > 8C");
    });

    it("Should prevent unauthorized users from anchoring telemetry", async function () {
      await expect(
        telemetry.connect(hacker).anchorTelemetry(1, mockHash, false, "")
      ).to.be.revertedWith("Not authorized to submit telemetry");
    });
  });
});
