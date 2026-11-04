import { network } from "hardhat";

const { ethers } = await network.create({ network: "localhost" });

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Experiment 4 contracts with account:", deployer.address);

  const token0 = await ethers.deployContract("EWasteToken");
  await token0.waitForDeployment();
  const token0Address = await token0.getAddress();
  console.log("EWasteToken (EWT) deployed to:", token0Address);

  const token1 = await ethers.deployContract("EWasteRewardToken");
  await token1.waitForDeployment();
  const token1Address = await token1.getAddress();
  console.log("EWasteRewardToken (EWR) deployed to:", token1Address);

  const amm = await ethers.deployContract("EWasteAMM", [token0Address, token1Address]);
  await amm.waitForDeployment();
  const ammAddress = await amm.getAddress();
  console.log("EWasteAMM deployed to:", ammAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
