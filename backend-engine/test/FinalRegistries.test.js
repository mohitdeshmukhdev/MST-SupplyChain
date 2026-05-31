const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Multi-Registry Infrastructure (Document, Escrow, Carbon)", function () {
  let GovernanceRegistry, governance;
  let IdentityRegistry, identity;
  let BatchRegistry, batch;
  let DocumentRegistry, documentReg;
  let EscrowRegistry, escrow;
  let CarbonRegistry, carbon;
  
  let deployer, supplier, transporter, customs, retailer, hacker;

  before(async function () {
    [deployer, supplier, transporter, customs, retailer, hacker] = await ethers.getSigners();

    GovernanceRegistry = await ethers.getContractFactory("GovernanceRegistry");
    governance = await GovernanceRegistry.deploy();
    await governance.waitForDeployment();

    IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identity = await IdentityRegistry.deploy(await governance.getAddress());
    await identity.waitForDeployment();

    // Roles & Identity
    await governance.grantRole(await governance.SUPPLIER_ROLE(), supplier.address);
    await governance.grantRole(await governance.CUSTOMS_ROLE(), customs.address);
    await governance.grantRole(await governance.LOGISTICS_ROLE(), transporter.address);
    
    await identity.verifyIdentity(supplier.address, "Supplier Corp", "TAX-1", "USA", "Supplier");
    await identity.verifyIdentity(transporter.address, "Transport Inc", "TAX-2", "UK", "Transporter");

    BatchRegistry = await ethers.getContractFactory("BatchRegistry");
    batch = await BatchRegistry.deploy(await governance.getAddress(), await identity.getAddress());
    await batch.waitForDeployment();

    DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
    documentReg = await DocumentRegistry.deploy(await governance.getAddress(), await batch.getAddress());
    await documentReg.waitForDeployment();

    EscrowRegistry = await ethers.getContractFactory("EscrowRegistry");
    escrow = await EscrowRegistry.deploy(await governance.getAddress(), await batch.getAddress());
    await escrow.waitForDeployment();

    CarbonRegistry = await ethers.getContractFactory("CarbonRegistry");
    carbon = await CarbonRegistry.deploy(await governance.getAddress(), await batch.getAddress());
    await carbon.waitForDeployment();

    // Mint a Batch
    await batch.connect(supplier).mintBatch("GTIN-999", "Factory Z", 50, "Boxes"); // batchId = 1
  });

  describe("DocumentRegistry.sol", function () {
    it("Should allow custodian to attach IPFS document", async function () {
      await expect(documentReg.connect(supplier).attachDocument(1, "QmHash123", "BillOfLading"))
        .to.emit(documentReg, "DocumentAttached")
        .withArgs(1, "QmHash123", "BillOfLading", supplier.address);
    });

    it("Should allow customs to attach IPFS document", async function () {
      await expect(documentReg.connect(customs).attachDocument(1, "QmCustoms456", "Phytosanitary"))
        .to.emit(documentReg, "DocumentAttached")
        .withArgs(1, "QmCustoms456", "Phytosanitary", customs.address);
    });

    it("Should prevent unauthorized users from attaching documents", async function () {
      await expect(
        documentReg.connect(hacker).attachDocument(1, "QmHacker", "FakeDoc")
      ).to.be.revertedWith("Not authorized to attach document");
    });
  });

  describe("CarbonRegistry.sol", function () {
    it("Should allow custodian to log carbon emissions", async function () {
      await expect(carbon.connect(supplier).logEmissions(1, 500, 250, "Diesel Truck"))
        .to.emit(carbon, "CarbonLogged")
        .withArgs(1, 250, supplier.address);
        
      expect(await carbon.totalCarbonEmissions(1)).to.equal(250);
    });

    it("Should accumulate total carbon emissions", async function () {
      // Transfer custody to transporter
      await batch.connect(supplier).transferCustody(1, transporter.address);
      
      // Transporter logs more emissions
      await carbon.connect(transporter).logEmissions(1, 1000, 400, "Cargo Ship");
      
      expect(await carbon.totalCarbonEmissions(1)).to.equal(650); // 250 + 400
    });
  });

  describe("EscrowRegistry.sol", function () {
    it("Should allow retailer to fund escrow", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await expect(escrow.connect(retailer).fundEscrow(1, supplier.address, { value: depositAmount }))
        .to.emit(escrow, "EscrowFunded")
        .withArgs(1, retailer.address, depositAmount);
    });

    it("Should prevent releasing funds if batch is not RetailReady", async function () {
      await expect(escrow.releaseFunds(1)).to.be.revertedWith("Batch is not RetailReady");
    });

    it("Should allow fund release when batch is RetailReady", async function () {
      // Update batch stage to RetailReady (enum 4)
      await batch.connect(transporter).updateStage(1, 4);

      const supplierBalanceBefore = await ethers.provider.getBalance(supplier.address);
      
      await expect(escrow.releaseFunds(1))
        .to.emit(escrow, "FundsReleased")
        .withArgs(1, supplier.address, ethers.parseEther("1.0"));

      const supplierBalanceAfter = await ethers.provider.getBalance(supplier.address);
      expect(supplierBalanceAfter - supplierBalanceBefore).to.equal(ethers.parseEther("1.0"));
    });
  });
});
