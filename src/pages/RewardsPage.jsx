import React from "react";
import { REWARD_RATES } from "../services/registryService";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";

export function RewardsPage({
  walletConnected,
  vaultBalance,
  submissions,
  onConnect,
  onNavigate,
  formatDate,
}) {
  const verifiedSubmissions = submissions.filter((s) => s.status === "Verified");
  const rewardedSubmissions = submissions.filter((s) => s.rewardIssued);
  const pendingReward = submissions
    .filter((s) => s.status === "Pending")
    .reduce((acc, s) => acc + (s.estimatedReward || 0), 0);

  return (
    <div className="page-container rewards-page">
      <div className="page-header-row">
        <div>
          <h2>E-Waste Reward Tokens (EWF)</h2>
          <p>
            Track your verified on-chain rewards minted through the EWasteRewardVault smart contract.
            Use them across the E-WasteFi DeFi ecosystem.
          </p>
        </div>
      </div>

      {/* REWARD SUMMARY CARDS */}
      <section className="stats-grid">
        <StatCard
          icon="✦"
          label="Available EWF Balance"
          value={walletConnected ? `${vaultBalance} EWF` : "—"}
          change="Available in EWasteRewardVault"
          badge="Live On-Chain"
        />

        <StatCard
          icon="⌛"
          label="Pending Verification"
          value={walletConnected ? `${pendingReward} EWF` : "—"}
          change="Awaiting recycler verification"
        />

        <StatCard
          icon="✓"
          label="Total Distributed"
          value={walletConnected ? `${rewardedSubmissions.reduce((a, s) => a + s.finalReward, 0)} EWF` : "—"}
          change="Directly credited to your account"
        />

        <StatCard
          icon="⬡"
          label="DeFi Utility"
          value="5 Protocols"
          change="Vault · AMM · Staking · DEX"
        />
      </section>

      <div className="main-grid">
        {/* REWARD RATES TABLE */}
        <div className="card rewards-rates-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">STANDARDIZED RATES</span>
              <h3>Reward Schedule</h3>
              <p>Standardized incentive units rewarded per verified device.</p>
            </div>
            <span className="step-number">EWF</span>
          </div>

          <div className="reward-rates">
            {REWARD_RATES.map((item) => (
              <div className="rate-row" key={item.name}>
                <div className="rate-icon">{item.icon}</div>
                <div className="rate-info">
                  <strong>{item.name}</strong>
                  <span>Base incentive credit</span>
                </div>
                <b className="rate-val">+{item.reward} EWF</b>
              </div>
            ))}
          </div>

          <div className="defi-callout-card">
            <span className="callout-icon">💡</span>
            <div>
              <strong>Stake or Swap Your Rewards</strong>
              <p>Deposit your EWF into the ERC-4626 Vault to earn automated compounding yield, or provide liquidity on our AMM.</p>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button className="view-button" onClick={() => onNavigate("Vault")}>Open Vault →</button>
                <button className="view-button" onClick={() => onNavigate("LiquidityPool")}>View AMM →</button>
              </div>
            </div>
          </div>
        </div>

        {/* USER REWARD HISTORY */}
        <div className="card reward-history-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">YOUR AUDIT LOG</span>
              <h3>Reward Distribution History</h3>
            </div>
          </div>

          {!walletConnected ? (
            <EmptyState
              icon="🔌"
              title="Connect Wallet"
              description="Connect your wallet to inspect your reward history on Sepolia."
              actionText="Connect MetaMask"
              onAction={onConnect}
            />
          ) : verifiedSubmissions.length === 0 ? (
            <EmptyState
              icon="✦"
              title="No Verified Rewards Yet"
              description="Once your e-waste submissions are verified by a recycler, your earned EWF credits will appear here."
              actionText="Submit E-Waste"
              onAction={() => onNavigate("Recycle")}
            />
          ) : (
            <div className="reward-history-list">
              {verifiedSubmissions.map((sub) => (
                <div className="reward-history-row" key={`rew-${sub.id}`}>
                  <div className="rate-icon">{sub.icon}</div>
                  <div className="history-details">
                    <strong>{sub.id} · {sub.category}</strong>
                    <span>
                      {sub.quantity} unit(s) · {sub.weight.toFixed(1)} kg · {formatDate(sub.verifiedAt || sub.submittedAt)}
                    </span>
                  </div>
                  <div className="history-amount">
                    {sub.rewardIssued ? (
                      <strong className="reward-credited">+{sub.finalReward} EWF</strong>
                    ) : (
                      <span className="reward-verified-pending">Verified (Reward pending)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RewardsPage;
