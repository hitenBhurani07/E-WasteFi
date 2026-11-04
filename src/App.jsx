import { useEffect, useState, useCallback } from "react";
import "./App.css";
import { ethers } from "ethers";

// Config & ABIs
import { getAddressesForChain } from "./config/addresses";

// Blockchain Services
import {
  getUserSubmissions,
  getAllSubmissions,
  submitEwaste,
  verifySubmission,
  rejectSubmission,
  issueReward,
  isRecycler,
} from "./services/registryService";
import { getRewardBalance } from "./services/vaultService";
import {
  connectMetaMask,
  requestAccountChange,
  getAccounts,
  getNetwork,
  isSepoliaNetwork,
  isLocalNetwork,
  isValidNetwork,
  parseBlockchainError,
  formatAddress,
} from "./blockchain/wallet";

// Shared Components
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";

// Pages
import DashboardPage from "./pages/DashboardPage";
import RecyclePage from "./pages/RecyclePage";
import RecyclerPanelPage from "./pages/RecyclerPanelPage";
import RewardsPage from "./pages/RewardsPage";
import ActivityPage from "./pages/ActivityPage";
import VaultPage from "./pages/VaultPage";
import LiquidityPoolPage from "./pages/LiquidityPoolPage";
import StakingPage from "./pages/StakingPage";
import DexPage from "./pages/DexPage";
import PriceFeedPage from "./pages/PriceFeedPage";

function App() {
  const initialPage = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("page") || "Dashboard"
    : "Dashboard";
  const [activePage, setActivePage] = useState(initialPage);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState(null);
  const [isSepolia, setIsSepolia] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [networkName, setNetworkName] = useState("");
  const [role, setRole] = useState("User");

  // On-chain data states (derived strictly from blockchain calls)
  const [submissions, setSubmissions] = useState([]);
  const [globalSubmissions, setGlobalSubmissions] = useState([]);
  const [vaultBalance, setVaultBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // Load on-chain data for connected account
  const loadBlockchainData = useCallback(async (account, _targetChainId) => {
    if (!window.ethereum || !account) return;
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const currentChainId = network.chainId.toString();
      const onSepolia = isSepoliaNetwork(currentChainId);
      const onLocal = isLocalNetwork(currentChainId);
      const validNetwork = isValidNetwork(currentChainId);

      setChainId(currentChainId);
      setIsSepolia(onSepolia);
      setIsSupported(validNetwork);
      setNetworkName(
        onSepolia
          ? "Sepolia Testnet"
          : onLocal
          ? "Ganache / Localhost"
          : `Chain ${currentChainId}`
      );

      if (!validNetwork) {
        setSubmissions([]);
        setVaultBalance(0);
        setGlobalSubmissions([]);
        return;
      }

      // Dynamic contract address resolution based on network
      const addresses = getAddressesForChain(currentChainId);
      const activeRegistry = addresses.REGISTRY_ADDRESS;
      const activeVault = addresses.VAULT_ADDRESS;

      // 1. Role determination
      const userIsRecycler = await isRecycler(provider, activeRegistry, account);
      const activeRole = userIsRecycler ? "Recycler" : "User";
      setRole(activeRole);

      // 2. Vault Reward balance
      const balance = await getRewardBalance(provider, activeVault, account);
      setVaultBalance(balance);

      // 3. User submissions
      const userSubs = await getUserSubmissions(provider, activeRegistry, account);
      setSubmissions(userSubs);

      // 4. Global submissions (for recycler queue or audit)
      try {
        const globalSubs = await getAllSubmissions(provider, activeRegistry);
        setGlobalSubmissions(globalSubs);
      } catch (e) {
        console.warn("Could not fetch global submissions:", e);
      }
    } catch (err) {
      console.error("Error loading blockchain data:", err);
      showToast(parseBlockchainError(err), "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect wallet button trigger
  const handleConnectWallet = async () => {
    try {
      setIsLoading(true);
      const result = await connectMetaMask();
      setWalletAddress(result.account);
      setWalletConnected(true);
      setChainId(result.chainId);
      await loadBlockchainData(result.account, result.chainId);
      showToast("Wallet connected successfully!");
    } catch (err) {
      console.error("Wallet connection error:", err);
      showToast(parseBlockchainError(err), "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Switch MetaMask account trigger (EIP-2255 requestPermissions)
  const handleSwitchAccount = async () => {
    try {
      setIsLoading(true);
      const result = await requestAccountChange();
      setWalletAddress(result.account);
      setWalletConnected(true);
      setChainId(result.chainId);
      await loadBlockchainData(result.account, result.chainId);
      showToast(`Switched account to ${formatAddress(result.account)}!`);
    } catch (err) {
      console.warn("Account switch cancelled or failed:", err);
      if (err.message && !err.message.includes("cancelled")) {
        showToast(parseBlockchainError(err), "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet trigger
  const handleDisconnectWallet = () => {
    setWalletAddress("");
    setWalletConnected(false);
    setSubmissions([]);
    setRole("User");
    setVaultBalance(0);
    setGlobalSubmissions([]);
    showToast("Wallet disconnected.");
  };

  // E-waste submission action (Exp 1)
  const handleSubmitEwaste = async ({ category, quantity, weight }) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const net = await provider.getNetwork();
    const addresses = getAddressesForChain(net.chainId);
    const tx = await submitEwaste(signer, addresses.REGISTRY_ADDRESS, category, quantity, weight);
    return tx;
  };

  // Recycler actions (Exp 1)
  const handleVerify = async (rawId) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const net = await provider.getNetwork();
    const addresses = getAddressesForChain(net.chainId);
    const tx = await verifySubmission(signer, addresses.REGISTRY_ADDRESS, rawId);
    return tx;
  };

  const handleReject = async (rawId) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const net = await provider.getNetwork();
    const addresses = getAddressesForChain(net.chainId);
    const tx = await rejectSubmission(signer, addresses.REGISTRY_ADDRESS, rawId);
    return tx;
  };

  const handleIssueReward = async (rawId) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const net = await provider.getNetwork();
    const addresses = getAddressesForChain(net.chainId);
    const tx = await issueReward(signer, addresses.REGISTRY_ADDRESS, rawId);
    return tx;
  };

  // Check initial connection and register listeners
  useEffect(() => {
    let active = true;

    const checkInitialConnection = async () => {
      if (!window.ethereum) return;
      try {
        const accounts = await getAccounts(window.ethereum);
        if (accounts.length > 0 && active) {
          const account = accounts[0];
          const net = await getNetwork(window.ethereum);
          setWalletAddress(account);
          setWalletConnected(true);
          if (net) {
            setChainId(net.chainId);
            setIsSepolia(isSepoliaNetwork(net.chainId));
            setIsSupported(isValidNetwork(net.chainId));
            setNetworkName(net.name);
          }
          await loadBlockchainData(account, net?.chainId);
        }
      } catch (err) {
        console.error("Initial connection check failed:", err);
      }
    };

    checkInitialConnection();

    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (!active) return;
        if (accounts && accounts.length > 0) {
          const account = accounts[0].toLowerCase();
          setWalletAddress(account);
          setWalletConnected(true);
          await loadBlockchainData(account);
        } else {
          setWalletAddress("");
          setWalletConnected(false);
          setSubmissions([]);
          setRole("User");
          setVaultBalance(0);
          setGlobalSubmissions([]);
        }
      };

      const handleChainChanged = () => {
        if (!active) return;
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        active = false;
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [loadBlockchainData]);

  // Page routing renderer
  const renderActivePage = () => {
    switch (activePage) {
      case "Dashboard":
        return (
          <DashboardPage
            walletConnected={walletConnected}
            isSepolia={isSepolia}
            isSupported={isSupported}
            networkName={networkName}
            submissions={submissions}
            vaultBalance={vaultBalance}
            onNavigate={setActivePage}
            onConnect={handleConnectWallet}
            formatDate={formatDate}
          />
        );

      case "Recycle":
        return (
          <RecyclePage
            walletConnected={walletConnected}
            isSepolia={isSepolia}
            isSupported={isSupported}
            networkName={networkName}
            onSubmitEwaste={async (data) => {
              const tx = await handleSubmitEwaste(data);
              tx.wait().then(() => loadBlockchainData(walletAddress));
              return tx;
            }}
            onConnect={handleConnectWallet}
            isLoading={isLoading}
          />
        );

      case "RecyclerPortal":
        return (
          <RecyclerPanelPage
            walletConnected={walletConnected}
            isSepolia={isSepolia}
            isSupported={isSupported}
            role={role}
            globalSubmissions={globalSubmissions}
            onVerify={async (id) => {
              const tx = await handleVerify(id);
              await tx.wait();
              await loadBlockchainData(walletAddress);
              showToast("Submission verified on-chain!");
            }}
            onReject={async (id) => {
              const tx = await handleReject(id);
              await tx.wait();
              await loadBlockchainData(walletAddress);
              showToast("Submission rejected.", "info");
            }}
            onIssueReward={async (id) => {
              const tx = await handleIssueReward(id);
              await tx.wait();
              await loadBlockchainData(walletAddress);
              showToast("Reward issued and credited to vault!");
            }}
            isLoading={isLoading}
            formatDate={formatDate}
          />
        );

      case "Rewards":
        return (
          <RewardsPage
            walletConnected={walletConnected}
            vaultBalance={vaultBalance}
            submissions={submissions}
            formatDate={formatDate}
          />
        );

      case "Activity":
        return (
          <ActivityPage
            walletConnected={walletConnected}
            submissions={submissions}
            formatDate={formatDate}
            onNavigate={setActivePage}
          />
        );

      case "Vault":
        return <VaultPage walletConnected={walletConnected} />;

      case "LiquidityPool":
        return <LiquidityPoolPage walletConnected={walletConnected} />;

      case "Staking":
        return <StakingPage walletConnected={walletConnected} />;

      case "Dex":
        return <DexPage walletConnected={walletConnected} />;

      case "PriceFeed":
        return <PriceFeedPage walletConnected={walletConnected} />;

      default:
        return (
          <DashboardPage
            walletConnected={walletConnected}
            isSepolia={isSepolia}
            isSupported={isSupported}
            networkName={networkName}
            submissions={submissions}
            vaultBalance={vaultBalance}
            onNavigate={setActivePage}
            onConnect={handleConnectWallet}
            formatDate={formatDate}
          />
        );
    }
  };

  return (
    <div className="app-shell">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        walletConnected={walletConnected}
        isSepolia={isSepolia}
        isSupported={isSupported}
        networkName={networkName}
        role={role}
      />

      {/* MAIN CONTENT AREA */}
      <main className="main-area">
        <TopBar
          activePage={activePage}
          walletConnected={walletConnected}
          walletAddress={walletAddress}
          isSepolia={isSepolia}
          isSupported={isSupported}
          networkName={networkName}
          role={role}
          onConnect={handleConnectWallet}
          onSwitchAccount={handleSwitchAccount}
          onDisconnect={handleDisconnectWallet}
          onRefresh={() => loadBlockchainData(walletAddress)}
          isLoading={isLoading}
        />

        <div className="content">
          {renderActivePage()}

          {/* BLOCKCHAIN STATUS BAR */}
          <section className="blockchain-bar" style={{ marginTop: "40px" }}>
            <div className="chain-status">
              <span
                className="chain-pulse"
                style={{
                  backgroundColor: walletConnected && isSupported ? "#10B981" : "#EF4444",
                }}
              ></span>

              <div>
                <strong>Blockchain Connection</strong>
                <span>
                  {!walletConnected
                    ? "MetaMask not connected · Read-only mode"
                    : !isSupported
                    ? "Unsupported network. Please switch to Sepolia or Ganache/Localhost."
                    : `Active Connection: ${networkName} (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)})`}
                </span>
              </div>
            </div>

            <div className="chain-info">
              <span>NETWORK</span>
              <strong>
                {walletConnected
                  ? networkName || (isSepolia ? "Sepolia" : "Local")
                  : "None"}
              </strong>
            </div>

            <div className="chain-info">
              <span>STATUS</span>
              <strong className={walletConnected && isSupported ? "online" : "offline"}>
                ● {walletConnected && isSupported ? "Online" : "Disconnected"}
              </strong>
            </div>
          </section>
        </div>

        {/* TOAST NOTIFICATION */}
        {notification && (
          <div className={`toast ${notification.type}`}>
            <div className="toast-icon">
              {notification.type === "error" ? "✕" : "✓"}
            </div>
            <div>
              <strong>
                {notification.type === "error" ? "Transaction Error" : "Success"}
              </strong>
              <span>{notification.message}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
