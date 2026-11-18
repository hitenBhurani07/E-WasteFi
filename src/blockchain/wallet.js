import { ethers } from "ethers";
import {
  SEPOLIA_CHAIN_ID,
  SEPOLIA_CHAIN_ID_HEX,
  LOCAL_CHAIN_ID,
  GANACHE_CHAIN_ID,
  HARDHAT_CHAIN_ID,
} from "../config/addresses";

export const WALLET_TYPES = {
  METAMASK: "MetaMask",
  WALLETCONNECT: "WalletConnect",
};

// Global state tracking active provider (MetaMask or WalletConnect)
let activeEIP1193Provider = null;
let activeWalletType = null;
let wcProviderInstance = null;

/**
 * Returns the currently active Web3 provider (MetaMask or WalletConnect)
 */
export function getActiveProvider() {
  if (activeEIP1193Provider) return activeEIP1193Provider;
  if (typeof window !== "undefined" && window.ethereum) return window.ethereum;
  return null;
}

/**
 * Returns the active wallet type name (MetaMask or WalletConnect)
 */
export function getActiveWalletType() {
  if (activeWalletType) return activeWalletType;
  if (typeof window !== "undefined" && window.ethereum) return WALLET_TYPES.METAMASK;
  return null;
}

/**
 * Sets the active provider
 */
export function setActiveProvider(provider, type = WALLET_TYPES.METAMASK) {
  activeEIP1193Provider = provider;
  activeWalletType = type;
  if (typeof window !== "undefined" && !window.ethereum) {
    try {
      window.ethereum = provider;
    } catch {
      // ignore read-only window.ethereum
    }
  }
}

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
 * Detect the genuine MetaMask provider even if multiple wallet extensions are installed
 */
export function getMetaMaskProvider() {
  if (typeof window === "undefined") return null;
  const eth = window.ethereum;
  if (!eth) return null;

  // Handle multi-wallet injection (e.g. MetaMask + Coinbase + Phantom in same browser)
  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    const mm =
      eth.providers.find((p) => p.isMetaMask && !p.isPhantom && !p.isBraveWallet) ||
      eth.providers.find((p) => p.isMetaMask);
    if (mm) return mm;
  }

  return eth;
}

/**
 * Request account connection via MetaMask (EIP-1102)
 */
export async function connectMetaMask() {
  const eth = getMetaMaskProvider();
  if (!eth) {
    throw new Error("MetaMask is not detected. Please install or enable the MetaMask extension.");
  }

  setActiveProvider(eth, WALLET_TYPES.METAMASK);

  const provider = new ethers.BrowserProvider(eth);
  const accounts = await eth.request({
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
    allAccounts: accounts.map((a) => a.toLowerCase()),
    chainId: network.chainId.toString(),
    walletType: WALLET_TYPES.METAMASK,
  };
}

/**
 * Request connection via WalletConnect (v2) with QR Code Modal
 * Enables connection from mobile wallets (MetaMask Mobile, Trust Wallet, Rainbow, etc.)
 */
export async function connectWalletConnect() {
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");

  const projectId =
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
    "3fcc6bba6f1de962d911bb5b5c3dba68"; // Default Project ID for testing

  const sepoliaId = Number(SEPOLIA_CHAIN_ID);
  const localId = Number(LOCAL_CHAIN_ID);
  const ganacheId = Number(GANACHE_CHAIN_ID);
  const hardhatId = Number(HARDHAT_CHAIN_ID);

  if (!wcProviderInstance) {
    wcProviderInstance = await EthereumProvider.init({
      projectId,
      chains: [sepoliaId],
      optionalChains: [localId, ganacheId, hardhatId],
      showQrModal: true,
      metadata: {
        name: "E-WasteFi",
        description: "Decentralized E-Waste Recycling & Rewards Protocol",
        url: typeof window !== "undefined" ? window.location.origin : "https://e-wastefi.io",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
      },
      rpcMap: {
        [sepoliaId]: "https://rpc.sepolia.org",
        [localId]: "http://127.0.0.1:8545",
        [ganacheId]: "http://127.0.0.1:7545",
        [hardhatId]: "http://127.0.0.1:8545",
      },
    });
  }

  // Trigger WalletConnect session & QR modal
  await wcProviderInstance.connect();

  const accounts = wcProviderInstance.accounts || [];
  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts received from WalletConnect session.");
  }

  setActiveProvider(wcProviderInstance, WALLET_TYPES.WALLETCONNECT);

  const provider = new ethers.BrowserProvider(wcProviderInstance);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();

  return {
    provider,
    signer,
    account: accounts[0].toLowerCase(),
    chainId: network.chainId.toString(),
    walletType: WALLET_TYPES.WALLETCONNECT,
  };
}

/**
 * Disconnect current wallet session
 */
export async function disconnectWallet() {
  if (wcProviderInstance && activeWalletType === WALLET_TYPES.WALLETCONNECT) {
    try {
      await wcProviderInstance.disconnect();
    } catch (e) {
      console.warn("WalletConnect disconnect error:", e);
    }
  }
  activeEIP1193Provider = null;
  activeWalletType = null;
}

/**
 * Request account change / permissions selection from MetaMask (EIP-2255)
 * Gracefully handles permissions, queries available accounts, and prevents hanging or crashing.
 */
export async function requestAccountChange(ethereum = getActiveProvider()) {
  const eth = ethereum || getMetaMaskProvider();
  if (!eth) {
    throw new Error("No active Web3 wallet provider detected.");
  }

  let chosenAccount = null;

  // 1. Try EIP-2255: Request new permissions, which prompts MetaMask's native account switcher modal
  try {
    const permissions = await eth.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
    const caveat = permissions?.[0]?.caveats?.find(
      (c) => c.type === "filterResponse"
    );
    if (caveat?.value && caveat.value.length > 0) {
      chosenAccount = caveat.value[0];
    }
  } catch (err) {
    // If user cancelled the permission dialog or it was already open/pending, log and continue to fallback
    console.warn("wallet_requestPermissions prompt was closed or pending:", err);
  }

  // 2. Query available authorized accounts
  let accounts = [];
  try {
    accounts = await eth.request({ method: "eth_accounts" });
  } catch {
    // ignore
  }

  // 3. If no accounts, prompt eth_requestAccounts
  if (!accounts || accounts.length === 0) {
    accounts = await eth.request({ method: "eth_requestAccounts" });
  }

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts available in MetaMask.");
  }

  // Use chosenAccount from permission prompt if available; otherwise use active accounts[0]
  const finalAccount = (chosenAccount || accounts[0]).toLowerCase();

  setActiveProvider(eth, WALLET_TYPES.METAMASK);

  const provider = new ethers.BrowserProvider(eth);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();

  return {
    provider,
    signer,
    account: finalAccount,
    allAccounts: accounts.map((a) => a.toLowerCase()),
    chainId: network.chainId.toString(),
    walletType: WALLET_TYPES.METAMASK,
  };
}

/**
 * Get currently connected accounts without prompting popup
 */
export async function getAccounts(ethereum = getActiveProvider()) {
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
export async function getNetwork(ethereum = getActiveProvider()) {
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
export async function switchToSepolia(ethereum = getActiveProvider()) {
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
 * Request network switch to Localhost / Ganache (1337)
 */
export async function switchToLocalhost(ethereum = getActiveProvider()) {
  const eth = ethereum || getMetaMaskProvider();
  if (!eth) throw new Error("No Web3 provider available.");

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x539" }],
    });
    return true;
  } catch (err) {
    if (err.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x539",
            chainName: "Localhost / Ganache",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["http://127.0.0.1:8545", "http://127.0.0.1:7545"],
          },
        ],
      });
      return true;
    }
    throw err;
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
    (error.message && error.message.toLowerCase().includes("user rejected")) ||
    (error.message && error.message.toLowerCase().includes("user denied")) ||
    (error.message && error.message.toLowerCase().includes("rejected"))
  ) {
    return "Transaction was cancelled in wallet.";
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
  const data = error.data || error.info?.error?.data || "";
  if (msg.includes("0xca59a9e8") || data.includes("0xca59a9e8") || msg.includes("NotRecycler")) {
    return "Not authorized: Only registered recyclers can verify or issue rewards.";
  }
  if (msg.includes("insufficient funds")) return "Insufficient ETH for gas fees.";
  if (msg.includes("NotRecycler")) return "Not authorized: Recycler role required.";
  if (msg.includes("SubmissionNotFound")) return "Submission does not exist.";
  if (msg.includes("SubmissionNotPending")) return "Submission is not pending verification.";
  if (msg.includes("SubmissionNotVerified")) return "Submission has not been verified yet.";
  if (msg.includes("RewardAlreadyIssued")) return "Reward already issued.";
  if (msg.includes("RewardVaultNotSet")) return "Reward vault address not set.";

  return "Transaction reverted or failed. Please check network and permissions.";
}
