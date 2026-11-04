import { network } from "hardhat";

const { ethers } = await network.create({ network: "localhost" });

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Experiment 5 contracts with account:", deployer.address);

  const stakeToken = await ethers.deployContract("EWRToken");
  await stakeToken.waitForDeployment();
  const stakeTokenAddress = await stakeToken.getAddress();
  console.log("EWRToken (staking) deployed to:", stakeTokenAddress);

  const rewardToken = await ethers.deployContract("RWRToken");
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("RWRToken (reward) deployed to:", rewardTokenAddress);

  const rewardRate = ethers.parseEther("1"); // 1 RWR per second
  const farm = await ethers.deployContract("SimpleYieldFarm", [
    stakeTokenAddress,
    rewardTokenAddress,
    rewardRate,
  ]);
  await farm.waitForDeployment();
  const farmAddress = await farm.getAddress();
  console.log("SimpleYieldFarm deployed to:", farmAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
