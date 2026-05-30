// Location: backend-engine/scripts/deploy.js
const hre = require("hardhat");

async function main() {
  // Get the deployer wallet signer
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("=========================================");
  console.log("Starting Smart Contract Deployment");
  console.log("Deployer Address:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(balance), "tMST");
  console.log("=========================================");

  // Get the contract factory and deploy
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  
  console.log("Deploying SupplyChain contract...");
  // Pass deployer address as the root admin
  const supplyChain = await SupplyChain.deploy(deployer.address);

  // Wait for the deployment transaction to be mined
  await supplyChain.waitForDeployment();

  const contractAddress = await supplyChain.getAddress();
  console.log("SupplyChain contract successfully deployed!");
  console.log("Deployed Address:", contractAddress);
  console.log("=========================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
