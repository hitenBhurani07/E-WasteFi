import React from "react";

export function StatCard({ icon, label, value, change, badge }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{label}</span>
          {badge && <span className="stat-badge">{badge}</span>}
        </div>
        <strong>{value}</strong>
        {change && <small>{change}</small>}
      </div>
    </div>
  );
}

export default StatCard;
