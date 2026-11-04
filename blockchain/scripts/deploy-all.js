import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();

  console.log(`\n======================================================`);
  console.log(`Deploying all E-WasteFi experiments`);
  console.log(`Network: ${net.name} | Chain ID: ${net.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`======================================================\n`);

  const deploymentData = {
    network: net.name || "hardhat",
    chainId: net.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  // 1. Experiment 1: Registry & Vault
  console.log("--- Deploying Experiment 1: EWasteRegistry & EWasteRewardVault ---");
  const registry = await ethers.deployContract("contracts/active/Experiment1/EWasteRegistry.sol:EWasteRegistry");
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();

  const vault = await ethers.deployContract("contracts/active/Experiment1/EWasteRewardVault.sol:EWasteRewardVault");
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();

  await (await registry.setRewardVault(vaultAddr)).wait();
  await (await vault.setRegistry(registryAddr)).wait();
  await (await registry.addRecycler(deployer.address)).wait();

  deploymentData.contracts.EWasteRegistry = registryAddr;
  deploymentData.contracts.EWasteRewardVault = vaultAddr;
  console.log(`✔ EWasteRegistry: ${registryAddr}`);
  console.log(`✔ EWasteRewardVault: ${vaultAddr}`);

  // 2. Experiment 3: ERC-4626 Vault
  console.log("\n--- Deploying Experiment 3: ERC-4626 Tokenized Vault ---");
  const asset = await ethers.deployContract("EWasteAssetToken");
  await asset.waitForDeployment();
  const assetAddr = await asset.getAddress();

  const erc4626Vault = await ethers.deployContract("EWasteFiVault", [assetAddr]);
  await erc4626Vault.waitForDeployment();
  const erc4626VaultAddr = await erc4626Vault.getAddress();

  deploymentData.contracts.EWasteAssetToken = assetAddr;
  deploymentData.contracts.EWasteFiVault = erc4626VaultAddr;
  console.log(`✔ EWasteAssetToken (EWAT): ${assetAddr}`);
  console.log(`✔ EWasteFiVault (EWVS): ${erc4626VaultAddr}`);

  // 3. Experiment 4: AMM
  console.log("\n--- Deploying Experiment 4: AMM Liquidity Pool ---");
  const ewt = await ethers.deployContract("EWasteToken");
  await ewt.waitForDeployment();
  const ewtAddr = await ewt.getAddress();

  const ewr = await ethers.deployContract("EWasteRewardToken");
  await ewr.waitForDeployment();
  const ewrAddr = await ewr.getAddress();

  const amm = await ethers.deployContract("EWasteAMM", [ewtAddr, ewrAddr]);
  await amm.waitForDeployment();
  const ammAddr = await amm.getAddress();

  deploymentData.contracts.EWasteToken = ewtAddr;
  deploymentData.contracts.EWasteRewardToken = ewrAddr;
  deploymentData.contracts.EWasteAMM = ammAddr;
  console.log(`✔ EWasteToken (EWT): ${ewtAddr}`);
  console.log(`✔ EWasteRewardToken (EWR): ${ewrAddr}`);
  console.log(`✔ EWasteAMM: ${ammAddr}`);

  // 4. Experiment 5: Yield Farm
  console.log("\n--- Deploying Experiment 5: Yield Farming Protocol ---");
  const farmStake = await ethers.deployContract("EWRToken");
  await farmStake.waitForDeployment();
  const farmStakeAddr = await farmStake.getAddress();

  const farmReward = await ethers.deployContract("RWRToken");
  await farmReward.waitForDeployment();
  const farmRewardAddr = await farmReward.getAddress();

  const rewardRate = ethers.parseEther("1");
  const farm = await ethers.deployContract("SimpleYieldFarm", [
    farmStakeAddr,
    farmRewardAddr,
    rewardRate,
  ]);
  await farm.waitForDeployment();
  const farmAddr = await farm.getAddress();

  deploymentData.contracts.FarmStakeToken = farmStakeAddr;
  deploymentData.contracts.FarmRewardToken = farmRewardAddr;
  deploymentData.contracts.SimpleYieldFarm = farmAddr;
  console.log(`✔ SimpleYieldFarm: ${farmAddr}`);

  // 5. Experiment 6: DEX
  console.log("\n--- Deploying Experiment 6: Full DEX Architecture ---");
  const dex0 = await ethers.deployContract("EWASTEToken");
  await dex0.waitForDeployment();
  const dex0Addr = await dex0.getAddress();

  const dex1 = await ethers.deployContract("EREWARDToken");
  await dex1.waitForDeployment();
  const dex1Addr = await dex1.getAddress();

  const factory = await ethers.deployContract("EWasteFactory");
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();

  const router = await ethers.deployContract("EWasteRouter", [factoryAddr]);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();

  await (await factory.createPair(dex0Addr, dex1Addr)).wait();
  const pairAddr = await factory.getPair(dex0Addr, dex1Addr);

  deploymentData.contracts.DEX_Token0 = dex0Addr;
  deploymentData.contracts.DEX_Token1 = dex1Addr;
  deploymentData.contracts.EWasteFactory = factoryAddr;
  deploymentData.contracts.EWasteRouter = routerAddr;
  deploymentData.contracts.EWastePair = pairAddr;
  console.log(`✔ EWasteFactory: ${factoryAddr}`);
  console.log(`✔ EWasteRouter: ${routerAddr}`);
  console.log(`✔ EWastePair: ${pairAddr}`);

  // 6. Experiment 7: Chainlink Oracles
  console.log("\n--- Deploying Experiment 7: Chainlink Price Consumers ---");
  const mockFeed = await ethers.deployContract("MockPriceFeed", [8, 265000000000n]); // $2,650.00
  await mockFeed.waitForDeployment();
  const mockFeedAddr = await mockFeed.getAddress();

  const consumer = await ethers.deployContract("EWastePriceConsumer", [mockFeedAddr]);
  await consumer.waitForDeployment();
  const consumerAddr = await consumer.getAddress();

  const safeConsumer = await ethers.deployContract("SafeEWastePriceConsumer", [mockFeedAddr, 3600]);
  await safeConsumer.waitForDeployment();
  const safeConsumerAddr = await safeConsumer.getAddress();

  deploymentData.contracts.MockPriceFeed = mockFeedAddr;
  deploymentData.contracts.EWastePriceConsumer = consumerAddr;
  deploymentData.contracts.SafeEWastePriceConsumer = safeConsumerAddr;
  console.log(`✔ MockPriceFeed: ${mockFeedAddr}`);
  console.log(`✔ EWastePriceConsumer: ${consumerAddr}`);
  console.log(`✔ SafeEWastePriceConsumer: ${safeConsumerAddr}`);

  // Save to deployments/local.json
  const deploymentsDir = path.resolve(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  const outputPath = path.join(deploymentsDir, "local.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n✔ Full deployment record successfully written to: ${outputPath}`);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
