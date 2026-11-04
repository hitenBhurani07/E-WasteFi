import React, { useState } from "react";
import { formatAddress, switchToSepolia } from "../blockchain/wallet";

export function WalletStatus({
  walletConnected,
  walletAddress,
  chainId,
  isSepolia,
  role,
  onConnect,
}) {
  const [copied, setCopied] = useState(false);
  const [switching, setSwitching] = useState(false);

  const copyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      setSwitching(true);
      await switchToSepolia();
    } catch (err) {
      console.error("Failed to switch network:", err);
    } finally {
      setSwitching(false);
    }
  };

  if (!walletConnected) {
    return (
      <div className="wallet-status-bar offline">
        <div className="wallet-status-info">
          <span className="chain-pulse offline"></span>
          <span>Wallet Disconnected</span>
        </div>
        <button className="wallet-status-btn" onClick={onConnect}>
          Connect MetaMask
        </button>
      </div>
    );
  }

  return (
    <div className={`wallet-status-bar ${isSepolia ? "online" : "warning"}`}>
      <div className="wallet-status-info">
        <span className={`chain-pulse ${isSepolia ? "online" : "warning"}`}></span>
        <div>
          <div className="wallet-status-account">
            <span className="account-pill" onClick={copyAddress} title="Click to copy address">
              {formatAddress(walletAddress)}
              <small className="copy-tag">{copied ? "Copied!" : "📋"}</small>
            </span>
            <span className="role-tag">{role}</span>
          </div>
          <span className="wallet-network-label">
            {isSepolia ? "Sepolia Testnet (11155111)" : `Network ID: ${chainId || "Unknown"} (Wrong Network)`}
          </span>
        </div>
      </div>

      {!isSepolia && (
        <button
          className="switch-network-btn"
          onClick={handleSwitchNetwork}
          disabled={switching}
        >
          {switching ? "Switching..." : "Switch to Sepolia"}
        </button>
      )}
    </div>
  );
}

export default WalletStatus;
