import React, { useState } from "react";
import TransactionStatus from "../components/TransactionStatus";
import EmptyState from "../components/EmptyState";
import { formatAddress, parseBlockchainError } from "../blockchain/wallet";

export function RecyclerPanelPage({
  walletConnected,
  isSepolia: _isSepolia,
  role,
  globalSubmissions,
  onVerify,
  onReject,
  onIssueReward,
  onConnect,
  onAuthorizeRecycler,
  formatDate,
  isLoading,
}) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [txState, setTxState] = useState({
    status: "idle",
    txHash: null,
    error: null,
    actionName: "Action",
  });

  const isRecyclerRole = role === "Recycler";

  const filteredSubmissions = globalSubmissions.filter((sub) => {
    if (filter !== "All" && sub.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        sub.id.toLowerCase().includes(q) ||
        sub.category.toLowerCase().includes(q) ||
        sub.user.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAction = async (actionType, rawId, idStr) => {
    try {
      setTxState({
        status: "awaiting",
        txHash: null,
        error: null,
        actionName: `${actionType} for ${idStr}`,
      });

      let tx;
      if (actionType === "Verification") {
        tx = await onVerify(rawId);
      } else if (actionType === "Rejection") {
        tx = await onReject(rawId);
      } else if (actionType === "Reward Issuance") {
        tx = await onIssueReward(rawId);
      }

      setTxState({
        status: "confirming",
        txHash: tx.hash,
        error: null,
        actionName: `${actionType} for ${idStr}`,
      });

      await tx.wait();

      setTxState({
        status: "confirmed",
        txHash: tx.hash,
        error: null,
        actionName: `${actionType} for ${idStr}`,
      });
    } catch (err) {
      console.error(`${actionType} failed:`, err);
      const isReject =
        err.code === "ACTION_REJECTED" ||
        err.code === 4001 ||
        (err.message && err.message.toLowerCase().includes("rejected")) ||
        (err.message && err.message.toLowerCase().includes("denied"));
      setTxState({
        status: isReject ? "rejected" : "failed",
        txHash: null,
        error: isReject ? "Transaction was cancelled in wallet." : parseBlockchainError(err),
        actionName: actionType,
      });
    }
  };

  return (
    <div className="page-container recycler-panel-page">
      <div className="page-header-row">
        <div>
          <h2>Recycler Verification & Reward Portal</h2>
          <p>
            Authorized collection centers verify physical drop-offs, record verification on Sepolia,
            and trigger automated reward issuance.
          </p>
        </div>

        <div className="role-status-badge">
          <span>Your Role: </span>
          <strong className={isRecyclerRole ? "role-recycler" : "role-user"}>
            {role}
          </strong>
        </div>
      </div>

      {!isRecyclerRole && walletConnected && (
        <div
          className="warning-notice-banner"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flex: "1" }}>
            <span style={{ fontSize: "1.2rem" }}>ℹ</span>
            <div>
              <strong>Connected Account is currently: {role}</strong>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#cbd5e1" }}>
                This account is not yet marked as an Authorized Recycler. Click the button to authorize this account for verification and reward testing.
              </p>
            </div>
          </div>
          {onAuthorizeRecycler && (
            <button
              onClick={onAuthorizeRecycler}
              style={{
                backgroundColor: "#10b981",
                border: "none",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "0.85rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
              }}
            >
              🛡️ Authorize as Recycler
            </button>
          )}
        </div>
      )}

      <TransactionStatus
        status={txState.status}
        txHash={txState.txHash}
        error={txState.error}
        actionName={txState.actionName}
        onDismiss={() => setTxState({ status: "idle", txHash: null, error: null, actionName: "Action" })}
      />

      <div className="card">
        <div className="table-controls-row">
          <div className="filter-pill-group">
            {["All", "Pending", "Verified", "Rejected"].map((f) => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
                <span className="filter-count">
                  {f === "All"
                    ? globalSubmissions.length
                    : globalSubmissions.filter((s) => s.status === f).length}
                </span>
              </button>
            ))}
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search by ID, Category, or User address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {!walletConnected ? (
          <EmptyState
            icon="🔌"
            title="Connect Wallet"
            description="Connect your wallet to inspect global submissions on the Sepolia network."
            actionText="Connect MetaMask"
            onAction={onConnect}
          />
        ) : filteredSubmissions.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No Submissions Matching Filter"
            description={
              globalSubmissions.length === 0
                ? "No submissions have been recorded on the smart contract yet."
                : "No submissions match your active filter."
            }
          />
        ) : (
          <div className="recycler-list">
            {filteredSubmissions.map((sub) => {
              const isPending = sub.status === "Pending";
              const isVerified = sub.status === "Verified";
              const isRewarded = sub.rewardIssued;

              return (
                <div className="recycler-row" key={`rec-${sub.id}`}>
                  <div className="recycler-row-main">
                    <div className="device-icon">{sub.icon}</div>
                    <div className="recycler-info">
                      <div className="recycler-id-line">
                        <strong>{sub.id} · {sub.category}</strong>
                        <span className={`status ${sub.status.toLowerCase()}`}>{sub.status}</span>
                      </div>
                      <span className="sub-user-addr" title={sub.user}>
                        User: <code>{formatAddress(sub.user)}</code>
                      </span>
                      <div className="sub-meta-stats">
                        <span>{sub.quantity} unit(s)</span>
                        <span>·</span>
                        <span>{sub.weight.toFixed(2)} kg</span>
                        <span>·</span>
                        <span>Submitted: {formatDate(sub.submittedAt)}</span>
                        {sub.verifiedAt && (
                          <>
                            <span>·</span>
                            <span>Verified: {formatDate(sub.verifiedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="recycler-row-reward">
                    <div className="reward-calc">
                      <span>ESTIMATED REWARD</span>
                      <strong>{sub.estimatedReward} EWF</strong>
                      {isRewarded && <span className="reward-tag-paid">✓ Credited to Vault</span>}
                    </div>

                    <div className="recycler-actions">
                      {isPending && (
                        <>
                          <button
                            className="verify-action-btn"
                            disabled={!isRecyclerRole || isLoading}
                            onClick={() => handleAction("Verification", sub.rawId, sub.id)}
                            title={!isRecyclerRole ? "Requires Recycler role" : "Verify submission"}
                          >
                            ✓ Verify
                          </button>
                          <button
                            className="reject-action-btn"
                            disabled={!isRecyclerRole || isLoading}
                            onClick={() => handleAction("Rejection", sub.rawId, sub.id)}
                            title={!isRecyclerRole ? "Requires Recycler role" : "Reject submission"}
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}

                      {isVerified && !isRewarded && (
                        <button
                          className="issue-action-btn"
                          disabled={!isRecyclerRole || isLoading}
                          onClick={() => handleAction("Reward Issuance", sub.rawId, sub.id)}
                          title={!isRecyclerRole ? "Requires Recycler role" : "Mint reward in vault"}
                        >
                          ✦ Issue Reward
                        </button>
                      )}

                      {isVerified && isRewarded && (
                        <span className="reward-issued-badge">Reward Distributed</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecyclerPanelPage;
