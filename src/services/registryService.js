import { ethers } from "ethers";
import { REGISTRY_ABI } from "../config/abis";
import { REGISTRY_ADDRESS as DEFAULT_REGISTRY_ADDRESS } from "../config/addresses";

export const CATEGORY_ICONS = {
  "Mobile Phone": "📱",
  "Laptop": "💻",
  "Battery": "🔋",
  "Charger": "🔌",
  "Circuit Board": "▦",
  "Other": "♻",
};

export const REWARD_RATES = [
  { name: "Mobile Phone", icon: "📱", reward: 25 },
  { name: "Laptop", icon: "💻", reward: 50 },
  { name: "Battery", icon: "🔋", reward: 15 },
  { name: "Charger", icon: "🔌", reward: 10 },
  { name: "Circuit Board", icon: "▦", reward: 20 },
  { name: "Other", icon: "♻", reward: 5 },
];

export function getRegistryContract(providerOrSigner, address = DEFAULT_REGISTRY_ADDRESS) {
  return new ethers.Contract(address, REGISTRY_ABI, providerOrSigner);
}

export function formatSubmissionData(sub) {
  const statusMap = ["Pending", "Verified", "Rejected"];

  const subId = sub.id !== undefined ? sub.id : sub[0];
  const subUser = sub.user !== undefined ? sub.user : sub[1];
  const subCategory = sub.category !== undefined ? sub.category : sub[2];
  const subQuantity = sub.quantity !== undefined ? sub.quantity : sub[3];
  const subWeight = sub.weight !== undefined ? sub.weight : sub[4];
  const subReward = sub.reward !== undefined ? sub.reward : sub[5];
  const subStatus = sub.status !== undefined ? sub.status : sub[6];
  const subSubmittedAt = sub.submittedAt !== undefined ? sub.submittedAt : sub[7];
  const subVerifiedAt = sub.verifiedAt !== undefined ? sub.verifiedAt : sub[8];
  const subRewardIssued = sub.rewardIssued !== undefined ? sub.rewardIssued : sub[9];

  return {
    id: `EW${String(subId).padStart(3, "0")}`,
    rawId: Number(subId),
    user: subUser,
    category: subCategory,
    icon: CATEGORY_ICONS[subCategory] || "♻",
    quantity: Number(subQuantity),
    weight: Number(subWeight) / 1000, // Grams to kg
    rawWeightGrams: Number(subWeight),
    estimatedReward: Number(subReward),
    finalReward: subRewardIssued ? Number(subReward) : 0,
    status: statusMap[Number(subStatus)] || "Pending",
    statusCode: Number(subStatus),
    submittedAt: new Date(Number(subSubmittedAt) * 1000).toISOString(),
    verifiedAt: Number(subVerifiedAt) > 0 ? new Date(Number(subVerifiedAt) * 1000).toISOString() : null,
    rewardIssued: !!subRewardIssued,
  };
}

export function getLocalRecyclers() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("ewaste_recyclers") || "[]").map((a) =>
      a.toLowerCase()
    );
  } catch {
    return [];
  }
}

export function addLocalRecycler(address) {
  if (!address || typeof window === "undefined") return;
  try {
    const normalized = address.toLowerCase();
    const current = getLocalRecyclers();
    if (!current.includes(normalized)) {
      current.push(normalized);
      localStorage.setItem("ewaste_recyclers", JSON.stringify(current));
    }
  } catch (e) {
    console.warn("Could not save local recycler:", e);
  }
}

export function removeLocalRecycler(address) {
  if (!address || typeof window === "undefined") return;
  try {
    const normalized = address.toLowerCase();
    const current = getLocalRecyclers().filter((a) => a !== normalized);
    localStorage.setItem("ewaste_recyclers", JSON.stringify(current));
  } catch (e) {
    console.warn("Could not remove local recycler:", e);
  }
}

export async function isRecycler(provider, registryAddress, userAddress) {
  if (!userAddress) return false;
  const normalized = userAddress.toLowerCase();

  // 1. Check local authorized recyclers (for lab/demo testing with any imported account)
  const localList = getLocalRecyclers();
  if (localList.includes(normalized)) {
    return true;
  }

  // 2. Check on-chain mapping
  if (!provider || !registryAddress) return false;
  try {
    const contract = getRegistryContract(provider, registryAddress);
    return await contract.recyclers(userAddress);
  } catch (err) {
    console.error("Failed to check recycler status on-chain:", err);
    return false;
  }
}

export async function isOwner(provider, registryAddress, userAddress) {
  if (!provider || !userAddress) return false;
  try {
    const contract = getRegistryContract(provider, registryAddress);
    const owner = await contract.owner();
    return owner.toLowerCase() === userAddress.toLowerCase();
  } catch (err) {
    console.error("Failed to check owner status:", err);
    return false;
  }
}

export async function getSubmissionCount(provider, registryAddress = DEFAULT_REGISTRY_ADDRESS) {
  const contract = getRegistryContract(provider, registryAddress);
  const count = await contract.submissionCounter();
  return Number(count);
}

export async function getUserSubmissions(provider, registryAddress, userAddress) {
  if (!provider || !userAddress) return [];
  const contract = getRegistryContract(provider, registryAddress);
  const submissionIds = await contract.getUserSubmissionIds(userAddress);
  
  const results = [];
  for (const id of submissionIds) {
    try {
      const sub = await contract.getSubmission(id);
      results.push(formatSubmissionData(sub));
    } catch (err) {
      console.error(`Error fetching submission #${id}:`, err);
    }
  }

  // Sort descending by rawId (most recent first)
  results.sort((a, b) => b.rawId - a.rawId);
  return results;
}

export async function getAllSubmissions(provider, registryAddress = DEFAULT_REGISTRY_ADDRESS) {
  if (!provider) return [];
  const contract = getRegistryContract(provider, registryAddress);
  const count = await contract.submissionCounter();
  const total = Number(count);

  const results = [];
  for (let i = 1; i <= total; i++) {
    try {
      const sub = await contract.getSubmission(i);
      results.push(formatSubmissionData(sub));
    } catch (err) {
      console.error(`Error fetching global submission #${i}:`, err);
    }
  }

  results.sort((a, b) => b.rawId - a.rawId);
  return results;
}

export async function submitEwaste(signer, registryAddress, category, quantity, weightKg) {
  const contract = getRegistryContract(signer, registryAddress);
  const weightInGrams = Math.round(Number(weightKg) * 1000);
  const tx = await contract.submitEwaste(
    category,
    BigInt(quantity),
    BigInt(weightInGrams)
  );
  return tx;
}

export async function verifySubmission(signer, registryAddress, submissionId) {
  const contract = getRegistryContract(signer, registryAddress);
  const tx = await contract.verifySubmission(BigInt(submissionId));
  return tx;
}

export async function rejectSubmission(signer, registryAddress, submissionId) {
  const contract = getRegistryContract(signer, registryAddress);
  const tx = await contract.rejectSubmission(BigInt(submissionId));
  return tx;
}

export async function issueReward(signer, registryAddress, submissionId) {
  const contract = getRegistryContract(signer, registryAddress);
  const tx = await contract.issueReward(BigInt(submissionId));
  return tx;
}
