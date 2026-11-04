import { network } from "hardhat";

const { ethers } = await network.create({ network: "localhost" });

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Experiment 3 contracts with account:", deployer.address);

  const asset = await ethers.deployContract("EWasteAssetToken");
  await asset.waitForDeployment();
  const assetAddress = await asset.getAddress();
  console.log("EWasteAssetToken deployed to:", assetAddress);

  const vault = await ethers.deployContract("EWasteFiVault", [assetAddress]);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("EWasteFiVault deployed to:", vaultAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
