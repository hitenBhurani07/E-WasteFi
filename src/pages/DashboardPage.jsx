import React from "react";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";

export function DashboardPage({
  walletConnected,
  isSepolia: _isSepolia,
  submissions,
  vaultBalance,
  onNavigate,
  onConnect,
  formatDate,
}) {
  const verifiedSubmissions = submissions.filter((s) => s.status === "Verified");
  const totalRecycledWeight = verifiedSubmissions.reduce(
    (total, s) => total + Number(s.weight || 0),
    0
  );
  const totalPending = submissions.filter((s) => s.status === "Pending").length;
  const recentSubmissions = submissions.slice(0, 5);

  const co2PreventedKg = (totalRecycledWeight * 1.8).toFixed(1);
  const devicesCount = verifiedSubmissions.reduce((acc, s) => acc + (s.quantity || 1), 0);

  return (
    <div className="page-container dashboard-page">
      {/* HERO BANNER */}
      <section className="welcome-card">
        <div className="welcome-content">
          <div className="live-tag">
            <span></span>
            BLOCKCHAIN-POWERED RECYCLING
          </div>

          <h2>
            Turn your old electronics
            <br />
            into <span>real green impact.</span>
          </h2>

          <p>
            Submit electronic waste, get verified by registered recyclers on Sepolia,
            and earn EWF reward tokens redeemable across our DeFi ecosystem.
          </p>

          <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
            <button className="hero-button" onClick={() => onNavigate("Recycle")}>
              Start Recycling <span>→</span>
            </button>
            <button className="secondary-button" onClick={() => onNavigate("Vault")}>
              Explore Vault <span>⬡</span>
            </button>
          </div>
        </div>

        <div className="impact-visual">
          <div className="orbit orbit-one"></div>
          <div className="orbit orbit-two"></div>

          <div className="impact-core">
            <span>♻</span>
            <small>IMPACT</small>
          </div>

          <div className="floating-card floating-top">
            <span>CO₂ PREVENTED</span>
            <strong>{walletConnected ? `${co2PreventedKg} kg` : "0.0 kg"}</strong>
          </div>

          <div className="floating-card floating-bottom">
            <span>REWARDS EARNED</span>
            <strong>{walletConnected ? `+${vaultBalance} EWF` : "+0 EWF"}</strong>
          </div>
        </div>
      </section>

      {/* STATS GRID */}
      <section className="stats-grid">
        <StatCard
          icon="◈"
          label="My Submissions"
          value={walletConnected ? submissions.length : "—"}
          change={walletConnected ? `${totalPending} pending verification` : "Connect wallet"}
        />

        <StatCard
          icon="⚖"
          label="E-Waste Recycled"
          value={walletConnected ? `${totalRecycledWeight.toFixed(1)} kg` : "—"}
          change={walletConnected ? "Verified on Sepolia" : "Connect wallet"}
        />

        <StatCard
          icon="✦"
          label="Reward Balance"
          value={walletConnected ? `${vaultBalance} EWF` : "—"}
          change="EWasteRewardVault"
        />

        <StatCard
          icon="✓"
          label="Verified Items"
          value={walletConnected ? verifiedSubmissions.length : "—"}
          change={walletConnected ? "Successfully processed" : "Connect wallet"}
        />
      </section>

      {/* DASHBOARD CONTENT GRID */}
      <section className="main-grid">
        {/* IMPACT PROGRESS */}
        <div className="card impact-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">ENVIRONMENTAL IMPACT</span>
              <h3>Eco Sustainability Score</h3>
            </div>
            <span className="impact-percent">
              {walletConnected && submissions.length > 0 ? "82%" : "0%"}
            </span>
          </div>

          <div className="score-ring">
            <div>
              <strong>{walletConnected && submissions.length > 0 ? "82" : "0"}</strong>
              <span>/ 100</span>
            </div>
          </div>

          <p className="impact-message">
            {walletConnected && submissions.length > 0
              ? "Every kilogram of recycled electronics diverts harmful lead and rare-earth toxins from landfills."
              : "Connect your MetaMask wallet and submit your first batch of e-waste to start tracking your score."}
          </p>

          <div className="progress-section">
            <div className="progress-label">
              <span>Current Progress</span>
              <strong>{totalRecycledWeight.toFixed(1)} / 50 kg</strong>
            </div>
            <div className="progress-bar">
              <div
                style={{
                  width: `${Math.min(100, (totalRecycledWeight / 50) * 100)}%`,
                }}
              ></div>
            </div>
            <small>
              {Math.max(0, 50 - totalRecycledWeight).toFixed(1)} kg remaining to reach Green Pioneer status
            </small>
          </div>

          <div className="impact-metrics">
            <div>
              <strong>{co2PreventedKg} kg</strong>
              <span>CO₂ prevented</span>
            </div>
            <div>
              <strong>{devicesCount}</strong>
              <span>Devices diverted</span>
            </div>
          </div>
        </div>

        {/* PROTOCOL EXPERIMENTS QUICK NAV */}
        <div className="card defi-quicknav-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">WEB3 EXPERIMENTS</span>
              <h3>Ecosystem Protocols</h3>
              <p>Explore all 7 experiments integrated into the E-WasteFi network.</p>
            </div>
          </div>

          <div className="defi-grid">
            <div className="defi-badge-item" onClick={() => onNavigate("Recycle")}>
              <span className="defi-item-icon">♻</span>
              <div>
                <strong>Exp 1: Registry</strong>
                <small>E-Waste submission & verification</small>
              </div>
              <span className="status-pill live">Sepolia</span>
            </div>

            <div className="defi-badge-item" onClick={() => onNavigate("Vault")}>
              <span className="defi-item-icon">⬡</span>
              <div>
                <strong>Exp 3: ERC-4626 Vault</strong>
                <small>Yield-bearing tokenized vault</small>
              </div>
              <span className="status-pill ready">Ready</span>
            </div>

            <div className="defi-badge-item" onClick={() => onNavigate("LiquidityPool")}>
              <span className="defi-item-icon">⇄</span>
              <div>
                <strong>Exp 4: AMM Pool</strong>
                <small>Constant product liquidity provider</small>
              </div>
              <span className="status-pill ready">Ready</span>
            </div>

            <div className="defi-badge-item" onClick={() => onNavigate("Staking")}>
              <span className="defi-item-icon">⚡</span>
              <div>
                <strong>Exp 5: Yield Farm</strong>
                <small>Stake EWR to harvest RWR</small>
              </div>
              <span className="status-pill ready">Ready</span>
            </div>

            <div className="defi-badge-item" onClick={() => onNavigate("Dex")}>
              <span className="defi-item-icon">↔</span>
              <div>
                <strong>Exp 6: DEX / Swap</strong>
                <small>Automated token swap interface</small>
              </div>
              <span className="status-pill ready">Ready</span>
            </div>

            <div className="defi-badge-item" onClick={() => onNavigate("PriceFeed")}>
              <span className="defi-item-icon">◎</span>
              <div>
                <strong>Exp 7: Chainlink Oracles</strong>
                <small>Live ETH/USD feed & gas calculator</small>
              </div>
              <span className="status-pill ready">Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT ACTIVITY SECTION */}
      <section className="card" style={{ marginTop: "24px" }}>
        <div className="card-heading">
          <div>
            <span className="eyebrow">RECENT ACTIVITY</span>
            <h3>Latest Submissions</h3>
          </div>
          {walletConnected && submissions.length > 0 && (
            <button className="view-button" onClick={() => onNavigate("Activity")}>
              View all ({submissions.length}) →
            </button>
          )}
        </div>

        {!walletConnected ? (
          <EmptyState
            icon="🔌"
            title="Wallet Not Connected"
            description="Connect your MetaMask wallet on Sepolia to view your live on-chain e-waste submissions."
            actionText="Connect MetaMask"
            onAction={onConnect}
          />
        ) : submissions.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No Submissions Yet"
            description="You haven't submitted any electronic waste for recycling yet. Earn EWF rewards on your first drop!"
            actionText="Submit E-Waste"
            onAction={() => onNavigate("Recycle")}
          />
        ) : (
          <div className="activity-list">
            {recentSubmissions.map((item) => (
              <div className="activity-row" key={item.id}>
                <div className="device-icon">{item.icon}</div>
                <div className="activity-info">
                  <strong>{item.category}</strong>
                  <span>{item.id} · {formatDate(item.submittedAt)}</span>
                </div>
                <div className="activity-weight">
                  <strong>{item.quantity} unit(s)</strong>
                  <span>{item.weight.toFixed(1)} kg</span>
                </div>
                <div>
                  <span className={`status ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>
                <div className="activity-reward">
                  {item.rewardIssued ? `+${item.finalReward} EWF` : `Est: ${item.estimatedReward} EWF`}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
