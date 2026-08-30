import { ethers } from "ethers";

export const REGISTRY_ADDRESS = "0x7CC2B7Cd0cDfB3D29f562c6a63821A812CF1ccf2";
export const VAULT_ADDRESS = "0x4C8027D4fE6339FA9B764cA100af0cD7e20A032c";
export const CHAIN_ID = "11155111"; // Decimal for Sepolia (0xaa36a7)

export const REGISTRY_ABI = [
  // Custom Errors
  "error NotOwner()",
  "error NotRecycler()",
  "error InvalidAddress()",
  "error InvalidQuantity()",
  "error InvalidWeight()",
  "error UnsupportedCategory()",
  "error SubmissionNotFound()",
  "error SubmissionNotPending()",
  "error SubmissionNotVerified()",
  "error RewardAlreadyIssued()",
  "error RecyclerAlreadyExists()",
  "error RecyclerNotFound()",
  "error RewardVaultNotSet()",

  // Events
  "event EWasteSubmitted(uint256 indexed submissionId, address indexed user, string category, uint256 quantity, uint256 weight, uint256 reward)",
  "event SubmissionVerified(uint256 indexed submissionId, address indexed recycler)",
  "event SubmissionRejected(uint256 indexed submissionId, address indexed recycler)",
  "event RewardIssued(uint256 indexed submissionId, address indexed user, uint256 reward)",

  // View Functions
  "function owner() view returns (address)",
  "function rewardVault() view returns (address)",
  "function submissionCounter() view returns (uint256)",
  "function recyclers(address) view returns (bool)",
  "function submissions(uint256) view returns (uint256 id, address user, string category, uint256 quantity, uint256 weight, uint256 reward, uint8 status, uint256 submittedAt, uint256 verifiedAt, bool rewardIssued)",
  "function getSubmission(uint256 submissionId) view returns (tuple(uint256 id, address user, string category, uint256 quantity, uint256 weight, uint256 reward, uint8 status, uint256 submittedAt, uint256 verifiedAt, bool rewardIssued))",
  "function getUserSubmissionIds(address user) view returns (uint256[])",
  "function getSubmissionCount() view returns (uint256)",

  // State Mutating Functions
  "function submitEwaste(string category, uint256 quantity, uint256 weight) returns (uint256)",
  "function verifySubmission(uint256 submissionId)",
  "function rejectSubmission(uint256 submissionId)",
  "function issueReward(uint256 submissionId)"
];

export const VAULT_ABI = [
  // Custom Errors
  "error NotOwner()",
  "error NotRegistry()",
  "error InvalidAddress()",

  // View Functions
  "function owner() view returns (address)",
  "function registry() view returns (address)",
  "function rewardBalances(address) view returns (uint256)",
  "function getRewardBalance(address user) view returns (uint256)"
];

// Helper to get registry contract instance
export const getRegistryContract = (providerOrSigner) => {
  return new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, providerOrSigner);
};

// Helper to get vault contract instance
export const getVaultContract = (providerOrSigner) => {
  return new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, providerOrSigner);
};

// Parse contract reverts and other errors into user-friendly messages
export const parseError = (error) => {
  console.error("Blockchain error details:", error);

  // MetaMask / Wallet rejection
  if (
    error.code === "ACTION_REJECTED" || 
    error.code === 4001 || 
    (error.message && error.message.toLowerCase().includes("rejected"))
  ) {
    return "MetaMask rejected the transaction.";
  }

  // Check if it's a contract custom error decoded by ethers
  if (error.errorName) {
    switch (error.errorName) {
      case "NotOwner":
        return "Not authorized: Only the contract owner can perform this action.";
      case "NotRecycler":
        return "Not authorized: Only authorized recyclers can perform this action.";
      case "InvalidAddress":
        return "Provided address is invalid.";
      case "InvalidQuantity":
        return "Quantity must be greater than 0.";
      case "InvalidWeight":
        return "Weight must be greater than 0.";
      case "UnsupportedCategory":
        return "Unsupported e-waste category.";
      case "SubmissionNotFound":
        return "Submission does not exist.";
      case "SubmissionNotPending":
        return "Submission is not pending verification.";
      case "SubmissionNotVerified":
        return "Submission is not verified.";
      case "RewardAlreadyIssued":
        return "Reward has already been issued for this submission.";
      case "RecyclerAlreadyExists":
        return "Address is already registered as a recycler.";
      case "RecyclerNotFound":
        return "Address is not a registered recycler.";
      case "RewardVaultNotSet":
        return "Reward vault is not configured on the registry.";
      case "NotRegistry":
        return "Only the registry contract can perform this operation.";
      default:
        return `Contract error: ${error.errorName}`;
    }
  }

  // Fallback check in error message or data
  const errMsg = error.message || "";
  if (errMsg.includes("NotRecycler")) return "Not authorized as recycler.";
  if (errMsg.includes("SubmissionNotFound")) return "Submission does not exist.";
  if (errMsg.includes("SubmissionNotPending")) return "Submission is not pending.";
  if (errMsg.includes("SubmissionNotVerified")) return "Submission is not verified.";
  if (errMsg.includes("RewardAlreadyIssued")) return "Reward has already been issued.";
  if (errMsg.includes("RewardVaultNotSet")) return "Reward vault not set.";

  return "Transaction reverted or failed. Check network or account role.";
};
