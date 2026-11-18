import React from "react";
import { WALLET_TYPES } from "../blockchain/wallet";

export function ConnectWalletModal({ isOpen, onClose, onSelectWallet, isLoading }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#161c24",
          border: "1px solid rgba(74, 222, 128, 0.2)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "440px",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
          color: "#f8fafc",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", margin: 0, color: "#fff" }}>
              Connect Wallet
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "4px 0 0 0" }}>
              Choose how you want to connect to E-WasteFi
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
          {/* Option 1: MetaMask */}
          <button
            onClick={() => onSelectWallet(WALLET_TYPES.METAMASK)}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
              color: "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#f6851b";
              e.currentTarget.style.backgroundColor = "rgba(246, 133, 27, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(246, 133, 27, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.6rem",
                }}
              >
                🦊
              </div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "1rem", color: "#f8fafc" }}>
                  MetaMask
                </div>
                <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                  Browser extension (Desktop or Mobile)
                </div>
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "6px", backgroundColor: "rgba(246, 133, 27, 0.2)", color: "#f6851b", fontWeight: "600" }}>
              Extension
            </span>
          </button>

          {/* Option 2: WalletConnect */}
          <button
            onClick={() => onSelectWallet(WALLET_TYPES.WALLETCONNECT)}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
              color: "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#3b99fc";
              e.currentTarget.style.backgroundColor = "rgba(59, 153, 252, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(59, 153, 252, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                }}
              >
                🌐
              </div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "1rem", color: "#f8fafc" }}>
                  WalletConnect
                </div>
                <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                  Scan QR code with Trust, Rainbow, or mobile app
                </div>
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "6px", backgroundColor: "rgba(59, 153, 252, 0.2)", color: "#3b99fc", fontWeight: "600" }}>
              QR Code
            </span>
          </button>
        </div>

        {/* Footer info */}
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            borderRadius: "8px",
            fontSize: "0.75rem",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          🔒 All connections are encrypted and non-custodial via EIP-1193 standard.
        </div>
      </div>
    </div>
  );
}
