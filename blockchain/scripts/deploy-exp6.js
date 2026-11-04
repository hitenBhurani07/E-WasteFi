import { network } from "hardhat";

const { ethers } = await network.create({ network: "localhost" });

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Experiment 6 contracts with account:", deployer.address);

  const tokenA = await ethers.deployContract("EWASTEToken");
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("EWASTEToken deployed to:", tokenAAddress);

  const tokenB = await ethers.deployContract("EREWARDToken");
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("EREWARDToken deployed to:", tokenBAddress);

  const factory = await ethers.deployContract("EWasteFactory");
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("EWasteFactory deployed to:", factoryAddress);

  const router = await ethers.deployContract("EWasteRouter", [factoryAddress]);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("EWasteRouter deployed to:", routerAddress);

  // Pre-create the initial pair
  await (await factory.createPair(tokenAAddress, tokenBAddress)).wait();
  const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
  console.log("Initial EWastePair deployed to:", pairAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
