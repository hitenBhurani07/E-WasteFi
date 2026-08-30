import { useEffect, useState } from "react";
import "./App.css";
import {
  getRegistryContract,
  getVaultContract,
  parseError,
  CHAIN_ID,
} from "./services/blockchain";
import { ethers } from "ethers";

const initialSubmissions = [
  {
    id: "EW001",
    category: "Laptop",
    icon: "💻",
    quantity: 1,
    weight: 2.4,
    description: "Demo verified laptop submission",
    estimatedReward: 50,
    finalReward: 50,
    status: "Verified",
    submittedAt: "2026-08-23T09:42:00",
    verifiedAt: "2026-08-23T10:00:00",
    transactionHash: null,
    recycler: "Demo Recycler",
  },
  {
    id: "EW002",
    category: "Mobile Phone",
    icon: "📱",
    quantity: 2,
    weight: 0.6,
    description: "Demo pending mobile phone submission",
    estimatedReward: 50,
    finalReward: 0,
    status: "Pending",
    submittedAt: "2026-08-22T17:21:00",
    verifiedAt: null,
    transactionHash: null,
    recycler: null,
  },
  {
    id: "EW003",
    category: "Charger",
    icon: "🔌",
    quantity: 3,
    weight: 0.4,
    description: "Demo verified charger submission",
    estimatedReward: 30,
    finalReward: 30,
    status: "Verified",
    submittedAt: "2026-08-16T14:08:00",
    verifiedAt: "2026-08-16T15:00:00",
    transactionHash: null,
    recycler: "Demo Recycler",
  },
];

const storageKey = "ewastefi_submissions";

const loadSubmissions = () => {
  try {
    const savedSubmissions = localStorage.getItem(storageKey);
    if (!savedSubmissions) {
      return initialSubmissions;
    }

    const parsedSubmissions = JSON.parse(savedSubmissions);
    return Array.isArray(parsedSubmissions)
      ? parsedSubmissions
      : initialSubmissions;
  } catch {
    return initialSubmissions;
  }
};

const rewardRates = [
  { name: "Mobile Phone", icon: "📱", reward: 25 },
  { name: "Laptop", icon: "💻", reward: 50 },
  { name: "Battery", icon: "🔋", reward: 15 },
  { name: "Charger", icon: "🔌", reward: 10 },
  { name: "Circuit Board", icon: "▦", reward: 20 },
  { name: "Other", icon: "♻", reward: 5 },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [role, setRole] = useState("User");
  const [submissions, setSubmissions] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [formData, setFormData] = useState({
    category: "Mobile Phone",
    quantity: 1,
    weight: "",
    description: "",
  });

  const [walletAddress, setWalletAddress] = useState("");
  const [isSepolia, setIsSepolia] = useState(false);
  const [vaultBalance, setVaultBalance] = useState(0);
  const [globalSubmissions, setGlobalSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedRate = rewardRates.find(
    (item) => item.name === formData.category
  )?.reward || 0;
  const estimatedReward = Number(formData.quantity) * selectedRate;

  const loadBlockchainData = async (account) => {
    if (!window.ethereum || !account) return;
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      const targetChainId = BigInt(CHAIN_ID);
      const currentChainId = network.chainId;
      const isSep = currentChainId === targetChainId;
      setIsSepolia(isSep);
      
      if (!isSep) {
        setSubmissions([]);
        setVaultBalance(0);
        setGlobalSubmissions([]);
        setIsLoading(false);
        return;
      }

      const registry = getRegistryContract(provider);
      const vault = getVaultContract(provider);

      // 1. Get role
      const isRecycler = await registry.recyclers(account);
      setRole(isRecycler ? "Recycler" : "User");

      // 2. Get reward balance
      const balance = await vault.getRewardBalance(account);
      setVaultBalance(Number(balance));

      // 3. Get user submissions
      const submissionIds = await registry.getUserSubmissionIds(account);
      const loadedSubmissions = [];

      for (const id of submissionIds) {
        const sub = await registry.getSubmission(id);
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

        const mappedSub = {
          id: `EW${String(subId).padStart(3, "0")}`,
          rawId: Number(subId),
          user: subUser,
          category: subCategory,
          icon: rewardRates.find((item) => item.name === subCategory)?.icon || "♻",
          quantity: Number(subQuantity),
          weight: Number(subWeight) / 1000, // display in KG
          estimatedReward: Number(subReward),
          finalReward: subRewardIssued ? Number(subReward) : 0,
          status: statusMap[Number(subStatus)] || "Pending",
          submittedAt: new Date(Number(subSubmittedAt) * 1000).toISOString(),
          verifiedAt: Number(subVerifiedAt) > 0 ? new Date(Number(subVerifiedAt) * 1000).toISOString() : null,
          transactionHash: null,
          recycler: null,
          rewardIssued: !!subRewardIssued
        };

        loadedSubmissions.push(mappedSub);
      }

      // Sort by ID descending
      loadedSubmissions.sort((a, b) => b.rawId - a.rawId);
      setSubmissions(loadedSubmissions);

      // 4. Get global submissions if recycler
      if (isRecycler) {
        const globalCount = await registry.submissionCounter();
        const loadedGlobal = [];
        for (let i = 1; i <= Number(globalCount); i++) {
          try {
            const sub = await registry.getSubmission(i);
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

            loadedGlobal.push({
              id: `EW${String(subId).padStart(3, "0")}`,
              rawId: Number(subId),
              user: subUser,
              category: subCategory,
              icon: rewardRates.find((item) => item.name === subCategory)?.icon || "♻",
              quantity: Number(subQuantity),
              weight: Number(subWeight) / 1000,
              estimatedReward: Number(subReward),
              finalReward: subRewardIssued ? Number(subReward) : 0,
              status: statusMap[Number(subStatus)] || "Pending",
              submittedAt: new Date(Number(subSubmittedAt) * 1000).toISOString(),
              verifiedAt: Number(subVerifiedAt) > 0 ? new Date(Number(subVerifiedAt) * 1000).toISOString() : null,
              rewardIssued: !!subRewardIssued
            });
          } catch (e) {
            console.error(`Error fetching global sub ${i}:`, e);
          }
        }
        loadedGlobal.sort((a, b) => b.rawId - a.rawId);
        setGlobalSubmissions(loadedGlobal);
      }
    } catch (err) {
      console.error("Error loading blockchain data:", err);
      setValidationMessage(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    
    const checkConnection = async () => {
      if (!window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts && accounts.length > 0 && active) {
          const account = accounts[0].address.toLowerCase();
          setWalletAddress(account);
          setWalletConnected(true);
          await loadBlockchainData(account);
        }
      } catch (err) {
        console.error("Error checking initial connection:", err);
      }
    };

    checkConnection();

    if (window.ethereum) {
      const handleAccounts = async (accounts) => {
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

      const handleChain = () => {
        if (!active) return;
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccounts);
      window.ethereum.on("chainChanged", handleChain);

      return () => {
        active = false;
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccounts);
          window.ethereum.removeListener("chainChanged", handleChain);
        }
      };
    }
  }, []);

  const verifiedSubmissions = submissions.filter(
    (submission) => submission.status === "Verified"
  );
  
  const totalRecycledWeight = verifiedSubmissions.reduce(
    (total, submission) => total + Number(submission.weight || 0),
    0
  );
  
  const totalRewards = verifiedSubmissions.reduce(
    (total, submission) => total + Number(submission.finalReward || 0),
    0
  );

  const formatDate = (date) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "—";
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setValidationMessage("MetaMask is not detected. Please install the MetaMask extension.");
      return;
    }
    try {
      setValidationMessage("");
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        const account = accounts[0].toLowerCase();
        setWalletAddress(account);
        setWalletConnected(true);
        await loadBlockchainData(account);
      }
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setValidationMessage(parseError(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationMessage("");

    if (!walletConnected) {
      setValidationMessage("Please connect your wallet first.");
      return;
    }

    if (!isSepolia) {
      setValidationMessage("Please switch to Sepolia Testnet.");
      return;
    }

    if (!formData.category || Number(formData.quantity) < 1) {
      setValidationMessage("Choose a category and enter a quantity of at least 1.");
      return;
    }

    if (Number(formData.weight) <= 0) {
      setValidationMessage("Enter a weight greater than 0 kg.");
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const registry = getRegistryContract(signer);

      const weightInGrams = Math.round(Number(formData.weight) * 1000);

      const tx = await registry.submitEwaste(
        formData.category,
        BigInt(formData.quantity),
        BigInt(weightInGrams)
      );

      await tx.wait();

      setFormData({
        category: "Mobile Phone",
        quantity: 1,
        weight: "",
        description: "",
      });

      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);

      await loadBlockchainData(walletAddress);
    } catch (err) {
      console.error("Error submitting e-waste:", err);
      setValidationMessage(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (rawId) => {
    if (!walletConnected) return;
    setValidationMessage("");
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const registry = getRegistryContract(signer);

      const tx = await registry.verifySubmission(BigInt(rawId));
      await tx.wait();
      
      await loadBlockchainData(walletAddress);
    } catch (err) {
      console.error("Error verifying submission:", err);
      setValidationMessage(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (rawId) => {
    if (!walletConnected) return;
    setValidationMessage("");
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const registry = getRegistryContract(signer);

      const tx = await registry.rejectSubmission(BigInt(rawId));
      await tx.wait();
      
      await loadBlockchainData(walletAddress);
    } catch (err) {
      console.error("Error rejecting submission:", err);
      setValidationMessage(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueReward = async (rawId) => {
    if (!walletConnected) return;
    setValidationMessage("");
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const registry = getRegistryContract(signer);

      const tx = await registry.issueReward(BigInt(rawId));
      await tx.wait();
      
      await loadBlockchainData(walletAddress);
    } catch (err) {
      console.error("Error issuing reward:", err);
      setValidationMessage(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="logo-area">
          <div className="logo-mark">♻</div>

          <div>
            <h2>E-WasteFi</h2>
            <span>RECYCLING NETWORK</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">MAIN MENU</p>

          {["Dashboard", "Recycle", "Rewards", "Activity"].map((item) => (
            <button
              key={item}
              className={`nav-item ${
                activePage === item ? "active" : ""
              }`}
              onClick={() => setActivePage(item)}
            >
              <span className="nav-icon">
                {item === "Dashboard" && "⌂"}
                {item === "Recycle" && "♻"}
                {item === "Rewards" && "✦"}
                {item === "Activity" && "◷"}
              </span>

              {item}
            </button>
          ))}
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">SYSTEM</p>

          <button className="nav-item">
            <span className="nav-icon">⚙</span>
            Settings
          </button>

          <button className="nav-item">
            <span className="nav-icon">?</span>
            Help Center
          </button>
        </div>

        <div className="sidebar-bottom">

          <div className="network-card">
            <div className="network-top">
              <span className="pulse" style={{ backgroundColor: walletConnected && isSepolia ? "#10B981" : "#EF4444" }}></span>
              <span>Network Status</span>
            </div>

            <strong>{walletConnected ? (isSepolia ? "Sepolia Testnet" : "Wrong Network") : "Not Connected"}</strong>

            <small>
              {walletConnected ? (isSepolia ? "Connected via MetaMask" : "Switch to Sepolia") : "Connect wallet to view"}
            </small>
          </div>

          <div className="sidebar-footer">
            <span>© 2026 E-WasteFi</span>
          </div>

        </div>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="main-area">

        {/* TOP BAR */}

        <header className="topbar">

          <div>
            <span className="breadcrumb">
              E-WasteFi / {activePage}
            </span>

            <h1>
              {activePage === "Dashboard"
                ? "Good morning, Recycler."
                : activePage}
            </h1>
          </div>

          <div className="topbar-actions">

            <button className="icon-button">
              ◔
            </button>

            <span className="role-badge" style={{
              padding: "6px 12px",
              borderRadius: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: role === "Recycler" ? "var(--accent-color)" : "var(--text-color)"
            }}>
              {role}
            </span>

            <button
              className={`wallet-connect ${
                walletConnected ? "connected" : ""
              }`}
              onClick={connectWallet}
            >
              <span className="wallet-dot"></span>

              {walletConnected
                ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
                : "Connect Wallet"}
            </button>

          </div>

        </header>

        {/* ================= CONTENT ================= */}

        <div className="content">

          {/* HERO */}

          <section className="welcome-card">

            <div className="welcome-content">

              <div className="live-tag">
                <span></span>
                BLOCKCHAIN-POWERED RECYCLING
              </div>

              <h2>
                Turn your old electronics
                <br />
                into <span>real impact.</span>
              </h2>

              <p>
                Recycle electronic waste, verify your contribution,
                and earn transparent rewards tracked through blockchain
                technology.
              </p>

              <button
                className="hero-button"
                onClick={() => setActivePage("Recycle")}
              >
                Start Recycling
                <span>→</span>
              </button>

            </div>

            <div className="impact-visual">

              <div className="orbit orbit-one"></div>
              <div className="orbit orbit-two"></div>

              <div className="impact-core">
                <span>♻</span>
                <small>IMPACT</small>
              </div>

              <div className="floating-card floating-top">
                <span>CO₂ SAVED</span>
                <strong>32.8 kg</strong>
              </div>

              <div className="floating-card floating-bottom">
                <span>REWARD</span>
                <strong>+50 EWF</strong>
              </div>

            </div>

          </section>

          {/* STATS */}

          <section className="stats-grid">

            <StatCard
              icon="◈"
              label="Total Submissions"
              value={walletConnected ? submissions.length : 0}
              change="Fetched from Sepolia"
            />

            <StatCard
              icon="⚖"
              label="E-Waste Recycled"
              value={`${(walletConnected ? totalRecycledWeight : 0).toFixed(1)} kg`}
              change="Verified submissions only"
            />

            <StatCard
              icon="✦"
              label="Rewards Earned"
              value={`${walletConnected ? vaultBalance : 0} EWF`}
              change="Stored in EWasteRewardVault"
            />

            <StatCard
              icon="✓"
              label="Verified Items"
              value={walletConnected ? verifiedSubmissions.length : 0}
              change="Pending and rejected excluded"
            />

          </section>

          {/* DASHBOARD GRID */}

          <section className="main-grid">

            {/* SUBMISSION */}

            <div className="card submit-card">

              <div className="card-heading">

                <div>
                  <span className="eyebrow">RECYCLING</span>
                  <h3>Submit E-Waste</h3>
                  <p>
                    Tell us what you're recycling and we'll calculate
                    your estimated reward.
                  </p>
                </div>

                <div className="step-number">
                  01
                </div>

              </div>

              <form onSubmit={handleSubmit}>

                <div className="form-grid">

                  <div className="input-group full">
                    <label>E-Waste Category</label>

                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                    >
                      <option>Mobile Phone</option>
                      <option>Laptop</option>
                      <option>Battery</option>
                      <option>Charger</option>
                      <option>Circuit Board</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="input-group">

                    <label>Quantity</label>

                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      placeholder="e.g. 2"
                      value={formData.quantity}
                      onChange={handleFormChange}
                    />

                  </div>

                  <div className="input-group">

                    <label>Weight</label>

                    <div className="input-with-unit">
                      <input
                        name="weight"
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0.0"
                        value={formData.weight}
                        onChange={handleFormChange}
                      />
                      <span>KG</span>
                    </div>

                  </div>

                  <div className="input-group full">

                    <label>Description</label>

                    <textarea
                      name="description"
                      rows="3"
                      placeholder="Add details about the electronic waste..."
                      value={formData.description}
                      onChange={handleFormChange}
                    />

                  </div>

                </div>

                <div className="estimated-reward">

                  <div>
                    <span>ESTIMATED REWARD</span>
                    <strong>{estimatedReward} EWF</strong>
                  </div>

                  <small>
                    Final reward is calculated after verification.
                  </small>

                </div>

                {validationMessage && (
                  <p className="validation-message" role="alert">
                    {validationMessage}
                  </p>
                )}

                <button className="submit-button" disabled={isLoading}>
                  {isLoading ? "Processing transaction..." : "Submit for Verification"}
                  <span>→</span>
                </button>

              </form>

            </div>

            {/* IMPACT */}

            <div className="card impact-card">

              <div className="card-heading">

                <div>
                  <span className="eyebrow">YOUR IMPACT</span>
                  <h3>Environmental Score</h3>
                </div>

                <span className="impact-percent">
                  76%
                </span>

              </div>

              <div className="score-ring">
                <div>
                  <strong>76</strong>
                  <span>/ 100</span>
                </div>
              </div>

              <p className="impact-message">
                You're doing great. Keep recycling to reach
                the <strong>Green Champion</strong> level.
              </p>

              <div className="progress-section">

                <div className="progress-label">
                  <span>Next milestone</span>
                  <strong>65.0 / 75 kg</strong>
                </div>

                <div className="progress-bar">
                  <div></div>
                </div>

                <small>
                  10.5 kg more to unlock 100 EWF bonus
                </small>

              </div>

              <div className="impact-metrics">

                <div>
                  <strong>32.8 kg</strong>
                  <span>CO₂ prevented</span>
                </div>

                <div>
                  <strong>12</strong>
                  <span>Devices recycled</span>
                </div>

              </div>

            </div>

          </section>

          {role === "Recycler" && (
            <section className="card recycler-panel">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">RECYCLER PORTAL</span>
                  <h3>Recycler Verification & Rewards</h3>
                  <p>As an authorized recycler, you can verify/reject submissions and issue rewards.</p>
                </div>
                <div className="step-number">02</div>
              </div>

              {globalSubmissions.length === 0 ? (
                <p className="empty-message">No submissions found on the blockchain.</p>
              ) : (
                <div className="recycler-list">
                  {globalSubmissions.map((submission) => {
                    const isPending = submission.status === "Pending";
                    const isVerified = submission.status === "Verified";
                    const isRewarded = submission.rewardIssued;

                    return (
                      <div className="recycler-row" key={`review-${submission.id}`}>
                        <div>
                          <strong>{submission.id} · {submission.category}</strong>
                          <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
                            User: {submission.user}
                          </span>
                          <span>{submission.quantity} item(s) · {submission.weight.toFixed(1)} kg · {formatDate(submission.submittedAt)}</span>
                          <span>Estimated reward: {submission.estimatedReward} EWF</span>
                          <span>
                            Status: <strong className={`status ${submission.status.toLowerCase()}`}>{submission.status}</strong>
                          </span>
                        </div>
                        <div className="recycler-actions">
                          {isPending && (
                            <>
                              <button className="submit-button" type="button" onClick={() => handleVerify(submission.rawId)} disabled={isLoading}>Verify</button>
                              <button className="view-button" type="button" onClick={() => handleReject(submission.rawId)} disabled={isLoading}>Reject</button>
                            </>
                          )}
                          {isVerified && !isRewarded && (
                            <button className="submit-button" type="button" onClick={() => handleIssueReward(submission.rawId)} disabled={isLoading} style={{ backgroundColor: "var(--accent-color)" }}>Issue Reward</button>
                          )}
                          {isVerified && isRewarded && (
                            <span className="reward-issued-badge" style={{ color: "var(--accent-color)", fontWeight: "600", fontSize: "0.95rem" }}>Reward Issued</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ACTIVITY + REWARDS */}

          <section className="bottom-grid">

            {/* ACTIVITY */}

            <div className="card activity-card">

              <div className="card-heading">

                <div>
                  <span className="eyebrow">ACTIVITY</span>
                  <h3>Recent Submissions</h3>
                </div>

                <button className="view-button">
                  View all →
                </button>

              </div>

              <div className="activity-list">

                {submissions.map((item) => (

                  <div className="activity-row" key={item.id}>

                    <div className="device-icon">
                      {item.icon}
                    </div>

                    <div className="activity-info">
                      <strong>{item.category}</strong>
                      <span>
                        {item.id} · {formatDate(item.submittedAt)}
                      </span>
                    </div>

                    <div className="activity-weight">
                      <strong>{item.quantity}</strong>
                      <span>{item.weight}</span>
                    </div>

                    <div>
                      <span
                        className={`status ${
                          item.status === "Verified"
                            ? "verified"
                            : item.status === "Rejected"
                              ? "rejected"
                              : "pending"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="activity-reward">
                      {item.finalReward > 0
                        ? `+${item.finalReward} EWF`
                        : "—"}
                    </div>

                  </div>

                ))}

              </div>

            </div>

            {/* REWARDS */}

            <div className="card rewards-card">

              <div className="card-heading">

                <div>
                  <span className="eyebrow">REWARDS</span>
                  <h3>Reward Rates</h3>
                </div>

                <span className="step-number">
                  EWF
                </span>

              </div>

              <div className="reward-balance">

                <span>AVAILABLE BALANCE</span>

                <strong>{walletConnected ? vaultBalance : 0}</strong>

                <small>EWF application reward units</small>

              </div>

              <div className="reward-rates">

                {rewardRates.map((item) => (

                  <div className="rate-row" key={item.name}>

                    <div className="rate-icon">
                      {item.icon}
                    </div>

                    <div>
                      <strong>{item.name}</strong>
                      <span>Base reward</span>
                    </div>

                    <b>
                      +{item.reward}
                    </b>

                  </div>

                ))}

              </div>

              <div className="reward-history">
                <span>REWARD HISTORY</span>
                {walletConnected && verifiedSubmissions.map((submission) => (
                  <div className="rate-row" key={`history-${submission.id}`}>
                    <div>
                      <strong>{submission.id}</strong>
                      <span>{submission.category} · {formatDate(submission.verifiedAt)}</span>
                    </div>
                    <b>+{submission.finalReward} EWF</b>
                  </div>
                ))}
                {(!walletConnected || verifiedSubmissions.length === 0) && (
                  <p className="empty-message" style={{ fontSize: "0.85rem", textAlign: "center", padding: "10px" }}>No history found.</p>
                )}
              </div>

            </div>

          </section>

          {/* BLOCKCHAIN BAR */}

          <section className="blockchain-bar">

            <div className="chain-status">
              <span className="chain-pulse" style={{ backgroundColor: walletConnected && isSepolia ? "#10B981" : "#EF4444" }}></span>

              <div>
                <strong>Blockchain Network</strong>
                <span>
                  {!walletConnected 
                    ? "Wallet not connected" 
                    : !isSepolia 
                      ? "Wrong network. Please connect to Ethereum Sepolia Network (Chain ID 11155111)" 
                      : "Connected to smart contracts on Sepolia"
                  }
                </span>
              </div>
            </div>

            <div className="chain-info">
              <span>NETWORK</span>
              <strong>{walletConnected && isSepolia ? "Sepolia Testnet" : "None"}</strong>
            </div>

            <div className="chain-info">
              <span>STATUS</span>
              <strong className={walletConnected && isSepolia ? "online" : "offline"}>
                ● {walletConnected && isSepolia ? "Connected" : "Disconnected"}
              </strong>
            </div>

          </section>

        </div>

        {/* NOTIFICATION */}

        {showNotification && (

          <div className="toast">

            <div className="toast-icon">
              ✓
            </div>

            <div>
              <strong>Submission created</strong>
              <span>
                Your e-waste is waiting for verification.
              </span>
            </div>

          </div>

        )}

      </main>

    </div>
  );
}


/* =========================
   STAT CARD COMPONENT
========================= */

function StatCard({ icon, label, value, change }) {

  return (

    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-content">

        <span>{label}</span>

        <strong>{value}</strong>

        <small>{change}</small>

      </div>

    </div>

  );
}

export default App;