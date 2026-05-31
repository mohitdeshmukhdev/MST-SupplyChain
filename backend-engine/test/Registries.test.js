const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Multi-Registry Infrastructure (Governance & Identity)", function () {
  let GovernanceRegistry, governance;
  let IdentityRegistry, identity;
  let deployer, supplier, logistics, customs, retailer, hacker;

  before(async function () {
    [deployer, supplier, logistics, customs, retailer, hacker] = await ethers.getSigners();

    // 1. Deploy Governance
    GovernanceRegistry = await ethers.getContractFactory("GovernanceRegistry");
    governance = await GovernanceRegistry.deploy();
    await governance.waitForDeployment();

    // 2. Deploy Identity
    IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identity = await IdentityRegistry.deploy(await governance.getAddress());
    await identity.waitForDeployment();
  });

  describe("GovernanceRegistry.sol", function () {
    it("Should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
      const adminRole = await governance.DEFAULT_ADMIN_ROLE();
      expect(await governance.hasRole(adminRole, deployer.address)).to.be.true;
    });

    it("Should allow Admin to grant specific roles", async function () {
      const supplierRole = await governance.SUPPLIER_ROLE();
      await expect(governance.grantRole(supplierRole, supplier.address))
        .to.emit(governance, "RoleGrantedEvent")
        .withArgs(supplierRole, supplier.address, deployer.address);
      
      expect(await governance.hasRole(supplierRole, supplier.address)).to.be.true;
    });

    it("Should prevent non-admins from granting roles", async function () {
      const logisticsRole = await governance.LOGISTICS_ROLE();
      await expect(
        governance.connect(hacker).grantRole(logisticsRole, hacker.address)
      ).to.be.reverted;
    });
  });

  describe("IdentityRegistry.sol", function () {
    it("Should allow Admin to verify an identity", async function () {
      await expect(
        identity.verifyIdentity(
          supplier.address,
          "Global Farms Ltd",
          "TAX-12345",
          "USA",
          "Supplier"
        )
      )
        .to.emit(identity, "IdentityVerified")
        .withArgs(supplier.address, "Global Farms Ltd", "Supplier");

      expect(await identity.isVerified(supplier.address)).to.be.true;
    });

    it("Should retrieve accurate identity details", async function () {
      const details = await identity.getIdentity(supplier.address);
      expect(details.businessName).to.equal("Global Farms Ltd");
      expect(details.taxId).to.equal("TAX-12345");
      expect(details.isVerified).to.be.true;
    });

    it("Should prevent non-admins from verifying identities", async function () {
      await expect(
        identity.connect(hacker).verifyIdentity(hacker.address, "Fake Corp", "000", "RU", "Hacker")
      ).to.be.revertedWith("Not authorized: Admin only");
    });

    it("Should prevent accessing unverified identities", async function () {
      await expect(identity.getIdentity(hacker.address)).to.be.revertedWith("Identity not verified");
    });

    it("Should allow Admin to revoke an identity", async function () {
      await identity.verifyIdentity(customs.address, "Border Patrol", "TAX-999", "UK", "Customs");
      expect(await identity.isVerified(customs.address)).to.be.true;

      await expect(identity.revokeIdentity(customs.address))
        .to.emit(identity, "IdentityRevoked")
        .withArgs(customs.address);

      expect(await identity.isVerified(customs.address)).to.be.false;
    });
  });
});
