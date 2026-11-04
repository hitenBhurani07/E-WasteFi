import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const artifactsBase = path.resolve(__dirname, "../artifacts/contracts/active");
const targetDir = path.resolve(__dirname, "../../src/config/abis");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const contractMappings = [
  { exp: "Experiment1", file: "EWasteRegistry.sol", contract: "EWasteRegistry" },
  { exp: "Experiment1", file: "EWasteRewardVault.sol", contract: "EWasteRewardVault" },
  { exp: "Experiment3", file: "EWasteAssetToken.sol", contract: "EWasteAssetToken" },
  { exp: "Experiment3", file: "EWasteFiVault.sol", contract: "EWasteFiVault" },
  { exp: "Experiment4", file: "EWasteToken.sol", contract: "EWasteToken" },
  { exp: "Experiment4", file: "EWasteRewardToken.sol", contract: "EWasteRewardToken" },
  { exp: "Experiment4", file: "EWasteAMM.sol", contract: "EWasteAMM" },
  { exp: "Experiment5", file: "EWRToken.sol", contract: "EWRToken" },
  { exp: "Experiment5", file: "RWRToken.sol", contract: "RWRToken" },
  { exp: "Experiment5", file: "SimpleYieldFarm.sol", contract: "SimpleYieldFarm" },
  { exp: "Experiment6", file: "EWASTEToken.sol", contract: "EWASTEToken" },
  { exp: "Experiment6", file: "EREWARDToken.sol", contract: "EREWARDToken" },
  { exp: "Experiment6", file: "EWastePair.sol", contract: "EWastePair" },
  { exp: "Experiment6", file: "EWasteFactory.sol", contract: "EWasteFactory" },
  { exp: "Experiment6", file: "EWasteRouter.sol", contract: "EWasteRouter" },
  { exp: "Experiment7", file: "MockPriceFeed.sol", contract: "MockPriceFeed" },
  { exp: "Experiment7", file: "EWastePriceConsumer.sol", contract: "EWastePriceConsumer" },
  { exp: "Experiment7", file: "SafeEWastePriceConsumer.sol", contract: "SafeEWastePriceConsumer" },
];

console.log(`Exporting ABIs to ${targetDir}...`);

let exportedCount = 0;
const allAbis = {};

for (const { exp, file, contract } of contractMappings) {
  const artifactPath = path.join(artifactsBase, exp, file, `${contract}.json`);
  if (fs.existsSync(artifactPath)) {
    const data = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abi = data.abi;
    const destPath = path.join(targetDir, `${contract}.json`);
    fs.writeFileSync(destPath, JSON.stringify(abi, null, 2), "utf8");
    allAbis[contract] = abi;
    console.log(`✔ Exported ${contract}.json`);
    exportedCount++;
  } else {
    console.warn(`⚠ Artifact not found: ${artifactPath}`);
  }
}

// Write combined all-abis.json
fs.writeFileSync(path.join(targetDir, "all-abis.json"), JSON.stringify(allAbis, null, 2), "utf8");
console.log(`\nExport complete: ${exportedCount} ABIs exported successfully.`);
