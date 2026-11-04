import { network } from "hardhat";

const { ethers } = await network.create({ network: "localhost" });

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Experiment 7 contracts with account:", deployer.address);

  // Deploy MockPriceFeed with 8 decimals and initial price $2,500
  const decimals = 8;
  const initialPrice = 250000000000n; // $2,500.00
  const mockFeed = await ethers.deployContract("MockPriceFeed", [decimals, initialPrice]);
  await mockFeed.waitForDeployment();
  const mockFeedAddress = await mockFeed.getAddress();
  console.log("MockPriceFeed deployed to:", mockFeedAddress);

  // Deploy basic consumer
  const consumer = await ethers.deployContract("EWastePriceConsumer", [mockFeedAddress]);
  await consumer.waitForDeployment();
  const consumerAddress = await consumer.getAddress();
  console.log("EWastePriceConsumer deployed to:", consumerAddress);

  // Deploy Safe consumer with 1 hour max age (3600 seconds)
  const maxAge = 3600;
  const safeConsumer = await ethers.deployContract("SafeEWastePriceConsumer", [
    mockFeedAddress,
    maxAge,
  ]);
  await safeConsumer.waitForDeployment();
  const safeConsumerAddress = await safeConsumer.getAddress();
  console.log("SafeEWastePriceConsumer deployed to:", safeConsumerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
