import { ethers } from "ethers";
import {
  SEPOLIA_CHAIN_ID,
  SEPOLIA_CHAIN_ID_HEX,
  LOCAL_CHAIN_ID,
  GANACHE_CHAIN_ID,
  HARDHAT_CHAIN_ID,
} from "../config/addresses";

export const SUPPORTED_NETWORKS = {
  [SEPOLIA_CHAIN_ID]: {
    name: "Sepolia Testnet",
    hexId: SEPOLIA_CHAIN_ID_HEX,
    rpcUrl: "https://rpc.sepolia.org",
    symbol: "SEP ETH",
    blockExplorer: "https://sepolia.etherscan.io",
  },
  [GANACHE_CHAIN_ID]: {
    name: "Ganache GUI (5777)",
    hexId: "0x1691",
    rpcUrl: "http://127.0.0.1:7545",
    symbol: "ETH",
    blockExplorer: "",
  },
  [LOCAL_CHAIN_ID]: {
    name: "Ganache / Localhost (1337)",
    hexId: "0x539",
    rpcUrl: "http://127.0.0.1:8545",
    symbol: "ETH",
    blockExplorer: "",
  },
  [HARDHAT_CHAIN_ID]: {
    name: "Hardhat (31337)",
    hexId: "0x7a69",
    rpcUrl: "http://127.0.0.1:8545",
    symbol: "ETH",
    blockExplorer: "",
  },
};

/**
 * Request account connection via MetaMask (EIP-1102)
 */
export async function connectMetaMask() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not detected. Please install the MetaMask extension.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found in MetaMask.");
  }

  const signer = await provider.getSigner();
  const network = await provider.getNetwork();

  return {
    provider,
    signer,
    account: accounts[0].toLowerCase(),
    chainId: network.chainId.toString(),
  };
}

/**
 * Request account change / permissions selection from MetaMask (EIP-2255)
 * Forces MetaMask to open the account picker modal so the user can choose or switch accounts.
 */
export async function requestAccountChange(ethereum = window.ethereum) {
  if (typeof window === "undefined" || !ethereum) {
    throw new Error("MetaMask is not detected. Please install the MetaMask extension.");
  }

  try {
    // EIP-2255: Request new permissions, which prompts MetaMask's native account switcher modal
    await ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts selected.");
    }
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();

    return {
      provider,
      signer,
      account: accounts[0].toLowerCase(),
      chainId: network.chainId.toString(),
    };
  } catch (err) {
    if (err.code === 4001 || err.code === "ACTION_REJECTED") {
      throw new Error("Account switch cancelled in MetaMask.");
    }
    // Fallback: try eth_requestAccounts
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    if (accounts && accounts.length > 0) {
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      return {
        provider,
        signer,
        account: accounts[0].toLowerCase(),
        chainId: network.chainId.toString(),
      };
    }
    throw err;
  }
}

/**
 * Get currently connected accounts without prompting popup
 */
export async function getAccounts(ethereum = window.ethereum) {
  if (!ethereum) return [];
  try {
    const accounts = await ethereum.request({ method: "eth_accounts" });
    return (accounts || []).map((a) => a.toLowerCase());
  } catch (err) {
    console.error("Failed to get accounts:", err);
    return [];
  }
}

/**
 * Get current network details
 */
export async function getNetwork(ethereum = window.ethereum) {
  if (!ethereum) return null;
  try {
    const chainIdHex = await ethereum.request({ method: "eth_chainId" });
    const chainId = BigInt(chainIdHex).toString();
    return {
      chainId,
      chainIdHex,
      name: SUPPORTED_NETWORKS[chainId]?.name || `Chain ID ${chainId}`,
      isSupported: isValidNetwork(chainId),
    };
  } catch (err) {
    console.error("Failed to get network:", err);
    return null;
  }
}

/**
 * Check if the chain is valid (Sepolia or local test network)
 */
export function isValidNetwork(chainId) {
  if (!chainId) return false;
  const idStr = chainId.toString();
  return (
    idStr === SEPOLIA_CHAIN_ID ||
    idStr === LOCAL_CHAIN_ID ||
    idStr === GANACHE_CHAIN_ID ||
    idStr === HARDHAT_CHAIN_ID
  );
}

/**
 * Check if on local development network (Ganache or Hardhat)
 */
export function isLocalNetwork(chainId) {
  if (!chainId) return false;
  const idStr = chainId.toString();
  return (
    idStr === LOCAL_CHAIN_ID ||
    idStr === GANACHE_CHAIN_ID ||
    idStr === HARDHAT_CHAIN_ID
  );
}

/**
 * Check specifically if on Sepolia
 */
export function isSepoliaNetwork(chainId) {
  if (!chainId) return false;
  return chainId.toString() === SEPOLIA_CHAIN_ID;
}

/**
 * Request network switch to Sepolia
 */
export async function switchToSepolia(ethereum = window.ethereum) {
  if (!ethereum) throw new Error("No Web3 provider available.");

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchError) {
    // 4902 means the chain hasn't been added to MetaMask
    if (switchError.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SEPOLIA_CHAIN_ID_HEX,
            chainName: "Sepolia Test Network",
            nativeCurrency: {
              name: "Sepolia ETH",
              symbol: "SEP",
              decimals: 18,
            },
            rpcUrls: ["https://rpc.sepolia.org", "https://ethereum-sepolia.publicnode.com"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
      return true;
    }
    throw switchError;
  }
}

/**
 * Format address to 0x1234...5678 format
 */
export function formatAddress(address) {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * User-friendly blockchain error parser
 */
export function parseBlockchainError(error) {
  if (!error) return "Unknown error occurred.";
  console.error("Blockchain error details:", error);

  // MetaMask rejection
  if (
    error.code === "ACTION_REJECTED" ||
    error.code === 4001 ||
    (error.message && error.message.toLowerCase().includes("user rejected"))
  ) {
    return "Transaction was rejected in MetaMask.";
  }

  // Contract custom errors
  if (error.errorName) {
    const errorMap = {
      NotOwner: "Not authorized: Only the contract owner can perform this action.",
      NotRecycler: "Not authorized: Only registered recyclers can perform this action.",
      InvalidAddress: "The specified address is invalid.",
      InvalidQuantity: "Quantity must be greater than zero.",
      InvalidWeight: "Weight must be greater than zero.",
      UnsupportedCategory: "The selected e-waste category is not supported.",
      SubmissionNotFound: "Submission not found on-chain.",
      SubmissionNotPending: "This submission has already been processed.",
      SubmissionNotVerified: "Submission must be verified before issuing a reward.",
      RewardAlreadyIssued: "A reward has already been issued for this submission.",
      RecyclerAlreadyExists: "Address is already registered as a recycler.",
      RecyclerNotFound: "Address is not a registered recycler.",
      RewardVaultNotSet: "Reward vault contract is not configured on the registry.",
      NotRegistry: "Only the registry contract may perform this operation.",
    };
    if (errorMap[error.errorName]) return errorMap[error.errorName];
    return `Contract error: ${error.errorName}`;
  }

  const msg = error.message || error.toString() || "";
  if (msg.includes("insufficient funds")) return "Insufficient ETH for gas fees.";
  if (msg.includes("NotRecycler")) return "Not authorized: Recycler role required.";
  if (msg.includes("SubmissionNotFound")) return "Submission does not exist.";
  if (msg.includes("SubmissionNotPending")) return "Submission is not pending verification.";
  if (msg.includes("SubmissionNotVerified")) return "Submission has not been verified yet.";
  if (msg.includes("RewardAlreadyIssued")) return "Reward already issued.";
  if (msg.includes("RewardVaultNotSet")) return "Reward vault address not set.";

  return "Transaction reverted or failed. Please check network and permissions.";
}
