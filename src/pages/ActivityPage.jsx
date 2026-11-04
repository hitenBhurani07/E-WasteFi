import React, { useState } from "react";
import EmptyState from "../components/EmptyState";

export function ActivityPage({
  walletConnected,
  submissions,
  onConnect,
  onNavigate,
  formatDate,
}) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter !== "All" && sub.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return sub.id.toLowerCase().includes(q) || sub.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="page-container activity-page">
      <div className="page-header-row">
        <div>
          <h2>Submissions & Activity Ledger</h2>
          <p>
            Complete audit trail of all electronic waste you have submitted to the decentralized registry.
          </p>
        </div>

        <button className="hero-button" onClick={() => onNavigate("Recycle")}>
          + New Submission
        </button>
      </div>

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
                    ? submissions.length
                    : submissions.filter((s) => s.status === f).length}
                </span>
              </button>
            ))}
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search by ID or Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {!walletConnected ? (
          <EmptyState
            icon="🔌"
            title="Connect Wallet"
            description="Connect your MetaMask wallet on Sepolia to view your personal recycling ledger."
            actionText="Connect MetaMask"
            onAction={onConnect}
          />
        ) : filteredSubmissions.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No Submissions Found"
            description={
              submissions.length === 0
                ? "You haven't submitted any electronic waste yet. Create your first submission today!"
                : "No submissions matched your filter criteria."
            }
            actionText={submissions.length === 0 ? "Start Recycling" : undefined}
            onAction={submissions.length === 0 ? () => onNavigate("Recycle") : undefined}
          />
        ) : (
          <div className="activity-table-wrapper">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Submission ID</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Weight</th>
                  <th>Reward</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                  <th>Verified At</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <span className="submission-id-tag">{sub.id}</span>
                    </td>
                    <td>
                      <div className="table-category-cell">
                        <span className="cell-icon">{sub.icon}</span>
                        <strong>{sub.category}</strong>
                      </div>
                    </td>
                    <td>{sub.quantity} unit(s)</td>
                    <td>{sub.weight.toFixed(2)} kg</td>
                    <td>
                      {sub.rewardIssued ? (
                        <strong className="reward-cell-issued">+{sub.finalReward} EWF</strong>
                      ) : (
                        <span className="reward-cell-est">Est: {sub.estimatedReward} EWF</span>
                      )}
                    </td>
                    <td>
                      <span className={`status ${sub.status.toLowerCase()}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td>{formatDate(sub.submittedAt)}</td>
                    <td>{formatDate(sub.verifiedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityPage;
