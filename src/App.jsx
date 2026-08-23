import { useEffect, useState } from "react";
import "./App.css";
import {
  issueReward,
  submitEwaste,
  verifySubmission,
} from "./services/blockchainService";

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
  const [submissions, setSubmissions] = useState(loadSubmissions);
  const [walletConnected, setWalletConnected] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [formData, setFormData] = useState({
    category: "Mobile Phone",
    quantity: 1,
    weight: "",
    description: "",
  });

  const selectedRate = rewardRates.find(
    (item) => item.name === formData.category
  )?.reward || 0;
  const estimatedReward = Number(formData.quantity) * selectedRate;

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(submissions));
  }, [submissions]);

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

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  const getNextId = () => {
    const highestId = submissions.reduce((highest, submission) => {
      const numericId = Number(submission.id.replace("EW", ""));
      return Number.isNaN(numericId) ? highest : Math.max(highest, numericId);
    }, 0);
    return `EW${String(highestId + 1).padStart(3, "0")}`;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const connectWallet = () => {
    setWalletConnected(!walletConnected);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationMessage("");

    if (!formData.category || Number(formData.quantity) < 1) {
      setValidationMessage("Choose a category and enter a quantity of at least 1.");
      return;
    }

    if (Number(formData.weight) <= 0) {
      setValidationMessage("Enter a weight greater than 0 kg.");
      return;
    }

    const simulatedSubmission = submitEwaste();
    const newSubmission = {
      id: getNextId(),
      category: formData.category,
      icon: rewardRates.find((item) => item.name === formData.category)?.icon,
      quantity: Number(formData.quantity),
      weight: Number(formData.weight),
      description: formData.description,
      estimatedReward,
      finalReward: 0,
      status: "Pending",
      submittedAt: new Date().toISOString(),
      verifiedAt: null,
      transactionHash: null,
      recycler: null,
    };

    setSubmissions((currentSubmissions) => [newSubmission, ...currentSubmissions]);
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

    if (!simulatedSubmission.success) {
      setValidationMessage("The simulated submission could not be processed.");
    }
  };

  const updateSubmissionStatus = (id, nextStatus) => {
    setSubmissions((currentSubmissions) =>
      currentSubmissions.map((submission) => {
        if (submission.id !== id || submission.status !== "Pending") {
          return submission;
        }

        if (nextStatus === "Rejected") {
          return {
            ...submission,
            status: "Rejected",
            verifiedAt: null,
            finalReward: 0,
            recycler: "Demo Recycler",
          };
        }

        const verification = verifySubmission();
        const reward = issueReward();
        return {
          ...submission,
          status: "Verified",
          verifiedAt: new Date().toISOString(),
          finalReward: submission.estimatedReward,
          transactionHash: `${verification.transactionId} / ${reward.transactionId}`,
          recycler: "Demo Recycler",
        };
      })
    );
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
              <span className="pulse"></span>
              <span>Network Status</span>
            </div>

            <strong>Sepolia Testnet</strong>

            <small>
              Simulation mode
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

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Demo role"
            >
              <option>User</option>
              <option>Recycler</option>
            </select>

            <button
              className={`wallet-connect ${
                walletConnected ? "connected" : ""
              }`}
              onClick={connectWallet}
            >
              <span className="wallet-dot"></span>

              {walletConnected
                ? "0x7A...91F2"
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
              value={submissions.length}
              change="Saved in this browser"
            />

            <StatCard
              icon="⚖"
              label="E-Waste Recycled"
              value={`${totalRecycledWeight.toFixed(1)} kg`}
              change="Verified submissions only"
            />

            <StatCard
              icon="✦"
              label="Rewards Earned"
              value={`${totalRewards} EWF`}
              change="Verified rewards only"
            />

            <StatCard
              icon="✓"
              label="Verified Items"
              value={verifiedSubmissions.length}
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

                <button className="submit-button">
                  Submit for Verification
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
                  <span className="eyebrow">DEMO MODE</span>
                  <h3>Recycler Verification</h3>
                  <p>Frontend simulation. Review pending submissions before rewards are credited.</p>
                </div>
                <div className="step-number">02</div>
              </div>

              {submissions.filter((submission) => submission.status === "Pending").length === 0 ? (
                <p className="empty-message">There are no pending submissions.</p>
              ) : (
                <div className="recycler-list">
                  {submissions
                    .filter((submission) => submission.status === "Pending")
                    .map((submission) => (
                      <div className="recycler-row" key={`review-${submission.id}`}>
                        <div>
                          <strong>{submission.id} · {submission.category}</strong>
                          <span>{submission.quantity} item(s) · {submission.weight} kg · {formatDate(submission.submittedAt)}</span>
                          <span>{submission.description || "No description provided"}</span>
                          <span>Estimated reward: {submission.estimatedReward} EWF</span>
                        </div>
                        <div className="recycler-actions">
                          <button className="submit-button" type="button" onClick={() => updateSubmissionStatus(submission.id, "Verified")}>Verify</button>
                          <button className="view-button" type="button" onClick={() => updateSubmissionStatus(submission.id, "Rejected")}>Reject</button>
                        </div>
                      </div>
                    ))}
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

                <strong>{totalRewards}</strong>

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
                {verifiedSubmissions.map((submission) => (
                  <div className="rate-row" key={`history-${submission.id}`}>
                    <div>
                      <strong>{submission.id}</strong>
                      <span>{submission.category} · {formatDate(submission.verifiedAt)}</span>
                    </div>
                    <b>+{submission.finalReward} EWF</b>
                  </div>
                ))}
              </div>

            </div>

          </section>

          {/* BLOCKCHAIN BAR */}

          <section className="blockchain-bar">

            <div className="chain-status">
              <span className="chain-pulse"></span>

              <div>
                <strong>Blockchain Network</strong>
                <span>
                  Simulation Mode · Smart contract integration pending
                </span>
              </div>
            </div>

            <div className="chain-info">
              <span>NETWORK</span>
              <strong>Sepolia Testnet</strong>
            </div>

            <div className="chain-info">
              <span>STATUS</span>
              <strong className="online">
                ● Online
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