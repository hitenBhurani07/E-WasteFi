import React from "react";

export function Sidebar({
  activePage,
  setActivePage,
  walletConnected,
  isSepolia,
  isSupported = true,
  networkName = "",
  role,
}) {
  const mainNavItems = [
    { id: "Dashboard", label: "Dashboard", icon: "⌂" },
    { id: "Recycle", label: "Recycle", icon: "♻" },
    { id: "RecyclerPortal", label: "Recycler Portal", icon: "🛡", badge: role === "Recycler" ? "Role" : null },
    { id: "Rewards", label: "Rewards", icon: "✦" },
    { id: "Activity", label: "Activity", icon: "◷" },
  ];

  const defiNavItems = [
    { id: "Vault", label: "Vault (ERC-4626)", icon: "⬡", exp: "Exp 3" },
    { id: "LiquidityPool", label: "Liquidity Pool", icon: "⇄", exp: "Exp 4" },
    { id: "Staking", label: "Staking / Farm", icon: "⚡", exp: "Exp 5" },
    { id: "Dex", label: "DEX / Swap", icon: "↔", exp: "Exp 6" },
    { id: "PriceFeed", label: "Price Feed", icon: "◎", exp: "Exp 7" },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-area" onClick={() => setActivePage("Dashboard")} style={{ cursor: "pointer" }}>
        <div className="logo-mark">♻</div>
        <div>
          <h2>E-WasteFi</h2>
          <span>RECYCLING NETWORK</span>
        </div>
      </div>

      <div className="sidebar-scrollable">
        <div className="sidebar-section">
          <p className="sidebar-label">E-WASTE CORE</p>
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">DEFI & PROTOCOLS</p>
          {defiNavItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
              <span className="nav-exp-tag">{item.exp}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-bottom">
        <div className="network-card">
          <div className="network-top">
            <span
              className="pulse"
              style={{
                backgroundColor: walletConnected && isSupported ? "#10B981" : walletConnected ? "#F59E0B" : "#EF4444",
                boxShadow: walletConnected && isSupported
                  ? "0 0 0 4px rgba(16, 185, 129, 0.15)"
                  : "0 0 0 4px rgba(239, 68, 68, 0.15)",
              }}
            ></span>
            <span>Network Status</span>
          </div>

          <strong>
            {walletConnected
              ? isSupported
                ? networkName || (isSepolia ? "Sepolia Testnet" : "Localhost / Ganache")
                : "Wrong Network"
              : "Not Connected"}
          </strong>

          <small>
            {walletConnected
              ? isSupported
                ? "Connected via MetaMask"
                : "Switch to Sepolia or Ganache"
              : "Connect wallet to interact"}
          </small>
        </div>

        <div className="sidebar-footer">
          <span>© 2026 E-WasteFi · Web3 Green Protocol</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
