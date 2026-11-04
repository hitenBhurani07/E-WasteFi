import { network } from "hardhat";

const { ethers } = await network.create({ network: "localhost" });

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Experiment 1 contracts with account:", deployer.address);

  const registry = await ethers.deployContract(
    "contracts/active/Experiment1/EWasteRegistry.sol:EWasteRegistry"
  );
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("EWasteRegistry deployed to:", registryAddress);

  const vault = await ethers.deployContract(
    "contracts/active/Experiment1/EWasteRewardVault.sol:EWasteRewardVault"
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("EWasteRewardVault deployed to:", vaultAddress);

  // Link registry and vault
  await (await registry.setRewardVault(vaultAddress)).wait();
  await (await vault.setRegistry(registryAddress)).wait();
  console.log("Linked EWasteRegistry and EWasteRewardVault successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
