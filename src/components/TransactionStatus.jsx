import React from "react";

/**
 * TransactionStatus
 * Displays state for Web3 transactions:
 * status: "idle" | "awaiting" | "submitted" | "confirming" | "confirmed" | "failed" | "rejected"
 */
export function TransactionStatus({ status, txHash, error, onDismiss, actionName = "Transaction" }) {
  if (!status || status === "idle") return null;

  const isSepolia = true;
  const explorerBase = isSepolia ? "https://sepolia.etherscan.io/tx/" : "";

  return (
    <div className={`tx-status-banner tx-status-${status}`}>
      <div className="tx-status-left">
        {status === "awaiting" && <span className="tx-spinner">◌</span>}
        {status === "submitted" && <span className="tx-spinner spin">↻</span>}
        {status === "confirming" && <span className="tx-spinner spin">⌛</span>}
        {status === "confirmed" && <span className="tx-icon-success">✓</span>}
        {(status === "failed" || status === "rejected") && <span className="tx-icon-error">⚠</span>}

        <div className="tx-status-text">
          <strong>
            {status === "awaiting" && `Please confirm ${actionName} in your wallet...`}
            {status === "submitted" && `${actionName} submitted to network...`}
            {status === "confirming" && `Confirming ${actionName} on blockchain...`}
            {status === "confirmed" && `${actionName} confirmed successfully!`}
            {status === "rejected" && `${actionName} was cancelled in wallet.`}
            {status === "failed" && `${actionName} failed.`}
          </strong>

          {error && <span className="tx-error-msg">{error}</span>}

          {txHash && (
            <div className="tx-hash-link">
              <span>Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
              {explorerBase && (
                <a
                  href={`${explorerBase}${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-explorer-btn"
                >
                  View on Etherscan ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {(status === "confirmed" || status === "failed" || status === "rejected") && onDismiss && (
        <button className="tx-dismiss-btn" onClick={onDismiss} aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}

export default TransactionStatus;
