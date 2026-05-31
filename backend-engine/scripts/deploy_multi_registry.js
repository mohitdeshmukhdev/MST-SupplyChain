const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`Starting deployment on network: ${network.name}`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  console.log(`Account balance: ${(await ethers.provider.getBalance(deployer.address)).toString()}`);

  // 1. Deploy GovernanceRegistry
  console.log("\nDeploying GovernanceRegistry...");
  const GovernanceRegistry = await ethers.getContractFactory("GovernanceRegistry");
  const governance = await GovernanceRegistry.deploy();
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log(`-> GovernanceRegistry deployed at: ${governanceAddress}`);

  // 2. Deploy IdentityRegistry
  console.log("\nDeploying IdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identity = await IdentityRegistry.deploy(governanceAddress);
  await identity.waitForDeployment();
  const identityAddress = await identity.getAddress();
  console.log(`-> IdentityRegistry deployed at: ${identityAddress}`);

  // 3. Deploy BatchRegistry
  console.log("\nDeploying BatchRegistry...");
  const BatchRegistry = await ethers.getContractFactory("BatchRegistry");
  const batch = await BatchRegistry.deploy(governanceAddress, identityAddress);
  await batch.waitForDeployment();
  const batchAddress = await batch.getAddress();
  console.log(`-> BatchRegistry deployed at: ${batchAddress}`);

  // 4. Deploy TelemetryRegistry
  console.log("\nDeploying TelemetryRegistry...");
  const TelemetryRegistry = await ethers.getContractFactory("TelemetryRegistry");
  const telemetry = await TelemetryRegistry.deploy(governanceAddress, batchAddress);
  await telemetry.waitForDeployment();
  const telemetryAddress = await telemetry.getAddress();
  console.log(`-> TelemetryRegistry deployed at: ${telemetryAddress}`);

  // 5. Deploy DocumentRegistry
  console.log("\nDeploying DocumentRegistry...");
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const documentReg = await DocumentRegistry.deploy(governanceAddress, batchAddress);
  await documentReg.waitForDeployment();
  const documentAddress = await documentReg.getAddress();
  console.log(`-> DocumentRegistry deployed at: ${documentAddress}`);

  // 6. Deploy EscrowRegistry
  console.log("\nDeploying EscrowRegistry...");
  const EscrowRegistry = await ethers.getContractFactory("EscrowRegistry");
  const escrow = await EscrowRegistry.deploy(governanceAddress, batchAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`-> EscrowRegistry deployed at: ${escrowAddress}`);

  // 7. Deploy CarbonRegistry
  console.log("\nDeploying CarbonRegistry...");
  const CarbonRegistry = await ethers.getContractFactory("CarbonRegistry");
  const carbon = await CarbonRegistry.deploy(governanceAddress, batchAddress);
  await carbon.waitForDeployment();
  const carbonAddress = await carbon.getAddress();
  console.log(`-> CarbonRegistry deployed at: ${carbonAddress}`);

  console.log("\n✅ All 7 Multi-Registry Contracts Deployed Successfully!");
  
  // Output addressing for updating .env later
  const deploymentData = `
========================================
MST TESTNET DEPLOYMENT ADDRESSES
========================================
GOVERNANCE_REGISTRY="${governanceAddress}"
IDENTITY_REGISTRY="${identityAddress}"
BATCH_REGISTRY="${batchAddress}"
TELEMETRY_REGISTRY="${telemetryAddress}"
DOCUMENT_REGISTRY="${documentAddress}"
ESCROW_REGISTRY="${escrowAddress}"
CARBON_REGISTRY="${carbonAddress}"
========================================
`;

  console.log(deploymentData);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
