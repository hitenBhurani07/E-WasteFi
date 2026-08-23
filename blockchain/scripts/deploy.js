import { network } from "hardhat";

const { ethers } = await network.create({ network: "localhost" });

const [deployer] = await ethers.getSigners();
console.log("Deployer address:", deployer.address);

const EWasteFi = await ethers.getContractFactory("EWasteFi");
const contract = await EWasteFi.deploy();
await contract.waitForDeployment();

const contractAddress = await contract.getAddress();
console.log("Contract address:", contractAddress);
console.log("Deployment successful: EWasteFi is live on the local Hardhat network.");
