const { ethers, network } = require("hardhat");

async function main() {
  console.log(`Starting deployment on network: ${network.name}`);
  
  const governanceAddress = "0x094e160fD1e72402FC43Be77b203b01Ad7eC0d24";
  const batchAddress = "0x6F417A5d419Eb30764b14835c1C1929D582206ac";

  // Deploy CarbonRegistry
  console.log("\nDeploying CarbonRegistry...");
  const CarbonRegistry = await ethers.getContractFactory("CarbonRegistry");
  const carbon = await CarbonRegistry.deploy(governanceAddress, batchAddress);
  await carbon.waitForDeployment();
  const carbonAddress = await carbon.getAddress();
  
  console.log(`-> CarbonRegistry deployed at: ${carbonAddress}`);

  // Output addressing for updating .env later
  const deploymentData = `
========================================
MST TESTNET FINAL DEPLOYMENT (CARBON)
========================================
CARBON_REGISTRY="${carbonAddress}"
========================================
`;

  console.log(deploymentData);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
