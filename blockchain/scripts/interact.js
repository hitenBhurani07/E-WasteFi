import { network } from "hardhat";

const { ethers } = await network.create({ network: "localhost" });

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const [owner, recycler, , user] = await ethers.getSigners();
const contract = await ethers.getContractAt("EWasteFi", contractAddress);

console.log("Owner:", owner.address);
console.log("Recycler:", recycler.address);
console.log("User:", user.address);

const addRecyclerTx = await contract.connect(owner).addRecycler(recycler.address);
await addRecyclerTx.wait();

const submitTx = await contract.connect(user).submitEwaste("Laptop", 2, 4000);
await submitTx.wait();

const submissionId = await contract.getSubmissionCount();
const submissionBefore = await contract.getSubmission(submissionId);

console.log("Submission ID:", submissionId.toString());
console.log("User:", submissionBefore.user);
console.log("Category:", submissionBefore.category);
console.log("Quantity:", submissionBefore.quantity.toString());
console.log("Weight:", submissionBefore.weight.toString());
console.log("Reward:", submissionBefore.reward.toString());
console.log("Status before verification:", Number(submissionBefore.status));

const verifyTx = await contract.connect(recycler).verifySubmission(submissionId);
await verifyTx.wait();

const verifiedSubmission = await contract.getSubmission(submissionId);
console.log("Status after verification:", Number(verifiedSubmission.status));

const rewardTx = await contract.connect(recycler).issueReward(submissionId);
await rewardTx.wait();

const finalBalance = await contract.getRewardBalance(user.address);
console.log("Final reward balance:", finalBalance.toString());
