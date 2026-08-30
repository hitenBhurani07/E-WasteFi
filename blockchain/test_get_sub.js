import { ethers } from "ethers";

const REGISTRY_ADDRESS = "0x7CC2B7Cd0cDfB3D29f562c6a63821A812CF1ccf2";
const REGISTRY_ABI = [
  "function getSubmission(uint256 submissionId) view returns (tuple(uint256 id, address user, string category, uint256 quantity, uint256 weight, uint256 reward, uint8 status, uint256 submittedAt, uint256 verifiedAt, bool rewardIssued))",
  "function submissionCounter() view returns (uint256)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
  const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
  
  try {
    const counter = await contract.submissionCounter();
    console.log("Total submissions counter:", counter.toString());
    
    for (let i = 1; i <= Number(counter); i++) {
      const sub = await contract.getSubmission(i);
      console.log(`\n--- Submission ID: ${i} ---`);
      console.log("Returned value keys:", Object.keys(sub));
      console.log("id:", sub[0]?.toString(), "or", sub.id?.toString());
      console.log("user:", sub[1], "or", sub.user);
      console.log("category:", sub[2], "or", sub.category);
      console.log("quantity:", sub[3]?.toString(), "or", sub.quantity?.toString());
      console.log("weight:", sub[4]?.toString(), "or", sub.weight?.toString());
      console.log("reward:", sub[5]?.toString(), "or", sub.reward?.toString());
      console.log("status:", sub[6]?.toString(), "or", sub.status?.toString());
      console.log("submittedAt:", sub[7]?.toString(), "or", sub.submittedAt?.toString());
      console.log("verifiedAt:", sub[8]?.toString(), "or", sub.verifiedAt?.toString());
      console.log("rewardIssued (index 9):", sub[9], "or", sub.rewardIssued);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
