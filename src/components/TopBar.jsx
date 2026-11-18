import React, { useState } from "react";
import { formatAddress, switchToSepolia } from "../blockchain/wallet";

export function TopBar({
  activePage,
  walletConnected,
  walletAddress,
  walletType = "MetaMask",
  isSepolia,
  isSupported = true,
  networkName = "",
  role,
  onConnect,
  onSwitchAccount,
  onDisconnect,
  onRefresh,
  isLoading,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const getPageTitle = (page) => {
    switch (page) {
      case "Dashboard":
        return "Decentralized E-Waste Hub";
      case "Recycle":
        return "Submit E-Waste for Recycling";
      case "RecyclerPortal":
        return "Recycler Verification Portal";
      case "Rewards":
        return "Reward Balances & Rates";
      case "Activity":
        return "Recycling Activity & Submissions";
      case "Vault":
        return "ERC-4626 Tokenized Vault";
      case "LiquidityPool":
        return "Constant Product AMM Pool";
      case "Staking":
        return "Yield Farming & Staking";
      case "Dex":
        return "Decentralized Token Swap";
      case "PriceFeed":
        return "Chainlink Decentralized Oracle";
      default:
        return page;
    }
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="topbar">
      <div>
        <span className="breadcrumb">
          E-WasteFi / {activePage}
        </span>
        <h1>{getPageTitle(activePage)}</h1>
      </div>

      <div className="topbar-actions" style={{ position: "relative" }}>
        {onRefresh && (
          <button
            className="icon-button"
            onClick={onRefresh}
            title="Refresh blockchain data"
            disabled={isLoading}
          >
            <span className={isLoading ? "spin" : ""}>↻</span>
          </button>
        )}

        {walletConnected && (
          <span
            className="role-badge"
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              backgroundColor: role === "Recycler" ? "rgba(74, 222, 128, 0.15)" : "rgba(255, 255, 255, 0.05)",
              border: role === "Recycler" ? "1px solid rgba(74, 222, 128, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "0.82rem",
              fontWeight: "600",
              color: role === "Recycler" ? "var(--accent-color, #4ade80)" : "#cbd5e1",
            }}
          >
            Role: {role}
          </span>
        )}

        {walletConnected && !isSupported && (
          <button
            className="switch-network-tag"
            onClick={() => switchToSepolia().catch(console.error)}
          >
            ⚠ Unsupported Network (Switch)
          </button>
        )}

        {!walletConnected ? (
          <button
            className="wallet-connect"
            onClick={onConnect}
            disabled={isLoading}
          >
            <span
              className="wallet-dot"
              style={{ backgroundColor: "#ef4444" }}
            ></span>
            Connect Wallet
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Account pill button that toggles menu */}
            <button
              className="wallet-connect connected"
              onClick={() => setShowMenu(!showMenu)}
              title="Click to view account options"
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span
                className="wallet-dot"
                style={{
                  backgroundColor: isSupported ? "#10b981" : "#f59e0b",
                }}
              ></span>
              <span style={{ fontSize: "0.9rem" }}>
                {walletType === "WalletConnect" ? "🌐" : "🦊"}
              </span>
              <span>{formatAddress(walletAddress)}</span>
              <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>▼</span>
            </button>

            {/* Direct quick-action switch account button */}
            <button
              className="icon-button"
              onClick={onSwitchAccount}
              title="Switch MetaMask Account"
              disabled={isLoading}
              style={{
                fontSize: "0.85rem",
                padding: "8px 12px",
                width: "auto",
                borderRadius: "20px",
                gap: "5px",
                backgroundColor: "rgba(74, 222, 128, 0.1)",
                border: "1px solid rgba(74, 222, 128, 0.3)",
                color: "var(--accent-color, #4ade80)",
                display: "inline-flex",
                alignItems: "center"
              }}
            >
              <span>⇄</span>
              <span>Switch Acc</span>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: "0",
                  marginTop: "8px",
                  backgroundColor: "#161f1a",
                  border: "1px solid rgba(74, 222, 128, 0.2)",
                  borderRadius: "12px",
                  padding: "16px",
                  width: "280px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Connected Account
                  </span>
                  <button
                    onClick={() => setShowMenu(false)}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem" }}
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <div style={{ fontSize: "0.85rem", fontFamily: "monospace", color: "#e2e8f0", wordBreak: "break-all" }}>
                    {walletAddress}
                  </div>
                  <button
                    onClick={copyAddress}
                    style={{
                      background: "none",
                      border: "none",
                      color: copied ? "#10b981" : "var(--accent-color, #4ade80)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      padding: "4px 0",
                      marginTop: "4px"
                    }}
                  >
                    {copied ? "✔ Copied to clipboard" : "📋 Copy Address"}
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#94a3b8" }}>
                  <span>Provider:</span>
                  <span style={{ color: "#38bdf8", fontWeight: "600" }}>
                    {walletType === "WalletConnect" ? "🌐 WalletConnect" : "🦊 MetaMask"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#94a3b8" }}>
                  <span>Network:</span>
                  <span style={{ color: isSupported ? "#10b981" : "#f59e0b", fontWeight: "600" }}>
                    {networkName || (isSepolia ? "Sepolia Testnet" : "Ganache / Local")}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#94a3b8" }}>
                  <span>Current Role:</span>
                  <span style={{ color: role === "Recycler" ? "#4ade80" : "#e2e8f0", fontWeight: "600" }}>
                    {role}
                  </span>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onSwitchAccount();
                    }}
                    style={{
                      backgroundColor: "rgba(74, 222, 128, 0.15)",
                      border: "1px solid rgba(74, 222, 128, 0.4)",
                      color: "#4ade80",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <span>⇄</span> Switch MetaMask Account
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDisconnect();
                    }}
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#ef4444",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      cursor: "pointer"
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default TopBar;
