import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ERC4626_VAULT_ADDRESS, ERC4626_ASSET_ADDRESS } from "../config/addresses";
import { ERC20_ABI, ERC4626_ABI } from "../config/abis";
import StatCard from "../components/StatCard";
import TransactionStatus from "../components/TransactionStatus";
import EmptyState from "../components/EmptyState";
import { parseBlockchainError } from "../blockchain/wallet";

export function VaultPage({ walletConnected, walletAddress, onConnect }) {
  const [vaultAddress, setVaultAddress] = useState(ERC4626_VAULT_ADDRESS);
  const [assetAddress, setAssetAddress] = useState(ERC4626_ASSET_ADDRESS);
  const [activeTab, setActiveTab] = useState("deposit"); // deposit | mint | withdraw | redeem

  // Live contract data
  const [assetSymbol, setAssetSymbol] = useState("EWT");
  const [vaultSymbol, setVaultSymbol] = useState("EWVS");
  const [decimals, setDecimals] = useState(18);
  const [assetBalance, setAssetBalance] = useState("0");
  const [shareBalance, setShareBalance] = useState("0");
  const [totalAssets, setTotalAssets] = useState("0");
  const [totalShares, setTotalShares] = useState("0");
  const [shareRate, setShareRate] = useState("1.0");

  // Form inputs & previews
  const [inputAmount, setInputAmount] = useState("");
  const [previewResult, setPreviewResult] = useState("");
  const [allowance, setAllowance] = useState("0");

  // Tx state
  const [txState, setTxState] = useState({
    status: "idle",
    txHash: null,
    error: null,
    actionName: "Vault Operation",
  });
  const [isLoading, setIsLoading] = useState(false);

  const isConfigured = Boolean(vaultAddress && ethers.isAddress(vaultAddress));

  const loadVaultData = useCallback(async () => {
    if (!walletConnected || !isConfigured || !window.ethereum) return;
    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const vault = new ethers.Contract(vaultAddress, ERC4626_ABI, provider);

      // 1. Get underlying asset address from vault if not set
      let currentAssetAddr = assetAddress;
      try {
        currentAssetAddr = await vault.asset();
        if (currentAssetAddr && currentAssetAddr !== assetAddress) {
          setAssetAddress(currentAssetAddr);
        }
      } catch (e) {
        console.warn("Could not read vault.asset():", e);
      }

      // 2. Fetch Vault Stats
      const [vSymbol, vDecimals, tAssets, tSupply, userShares] = await Promise.all([
        vault.symbol().catch(() => "EWVS"),
        vault.decimals().catch(() => 18),
        vault.totalAssets().catch(() => 0n),
        vault.totalSupply().catch(() => 0n),
        walletAddress ? vault.balanceOf(walletAddress).catch(() => 0n) : 0n,
      ]);

      setVaultSymbol(vSymbol);
      setDecimals(Number(vDecimals));
      setTotalAssets(ethers.formatUnits(tAssets, vDecimals));
      setTotalShares(ethers.formatUnits(tSupply, vDecimals));
      setShareBalance(ethers.formatUnits(userShares, vDecimals));

      // 3. Conversion rate (assets per 1 share)
      try {
        const oneShare = ethers.parseUnits("1", vDecimals);
        const assetsPerShare = await vault.convertToAssets(oneShare);
        setShareRate(ethers.formatUnits(assetsPerShare, vDecimals));
      } catch {
        setShareRate("1.0");
      }

      // 4. Fetch Asset stats
      if (currentAssetAddr && ethers.isAddress(currentAssetAddr)) {
        const assetContract = new ethers.Contract(currentAssetAddr, ERC20_ABI, provider);
        const [aSymbol, userAssetBal, currentAllowance] = await Promise.all([
          assetContract.symbol().catch(() => "EWT"),
          walletAddress ? assetContract.balanceOf(walletAddress).catch(() => 0n) : 0n,
          walletAddress ? assetContract.allowance(walletAddress, vaultAddress).catch(() => 0n) : 0n,
        ]);
        setAssetSymbol(aSymbol);
        setAssetBalance(ethers.formatUnits(userAssetBal, vDecimals));
        setAllowance(ethers.formatUnits(currentAllowance, vDecimals));
      }
    } catch (err) {
      console.error("Failed to load vault data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [walletConnected, isConfigured, vaultAddress, assetAddress, walletAddress]);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  // Live preview calculation on input change
  useEffect(() => {
    if (!inputAmount || isNaN(Number(inputAmount)) || Number(inputAmount) <= 0 || !isConfigured) {
      setPreviewResult("");
      return;
    }

    let active = true;
    const calculatePreview = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const vault = new ethers.Contract(vaultAddress, ERC4626_ABI, provider);
        const parsed = ethers.parseUnits(inputAmount, decimals);

        let resultBigInt;
        if (activeTab === "deposit") {
          resultBigInt = await vault.previewDeposit(parsed);
        } else if (activeTab === "mint") {
          resultBigInt = await vault.previewMint(parsed);
        } else if (activeTab === "withdraw") {
          resultBigInt = await vault.previewWithdraw(parsed);
        } else if (activeTab === "redeem") {
          resultBigInt = await vault.previewRedeem(parsed);
        }

        if (active && resultBigInt !== undefined) {
          setPreviewResult(ethers.formatUnits(resultBigInt, decimals));
        }
      } catch {
        // Fallback rough preview if preview call reverts
        if (active) {
          const rate = parseFloat(shareRate) || 1;
          const amt = parseFloat(inputAmount) || 0;
          if (activeTab === "deposit") setPreviewResult((amt / rate).toFixed(4));
          else if (activeTab === "mint") setPreviewResult((amt * rate).toFixed(4));
          else if (activeTab === "withdraw") setPreviewResult((amt / rate).toFixed(4));
          else if (activeTab === "redeem") setPreviewResult((amt * rate).toFixed(4));
        }
      }
    };

    calculatePreview();
    return () => {
      active = false;
    };
  }, [inputAmount, activeTab, isConfigured, vaultAddress, decimals, shareRate]);

  // Approve ERC-20 underlying asset
  const handleApprove = async () => {
    if (!walletConnected) return;
    try {
      setTxState({
        status: "awaiting",
        txHash: null,
        error: null,
        actionName: `Approval of ${assetSymbol}`,
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const assetContract = new ethers.Contract(assetAddress, ERC20_ABI, signer);

      const parsedAmount = ethers.parseUnits(inputAmount || "1000000", decimals);
      const tx = await assetContract.approve(vaultAddress, parsedAmount);

      setTxState({
        status: "confirming",
        txHash: tx.hash,
        error: null,
        actionName: `Approval of ${assetSymbol}`,
      });

      await tx.wait();

      setTxState({
        status: "confirmed",
        txHash: tx.hash,
        error: null,
        actionName: `Approval of ${assetSymbol}`,
      });

      await loadVaultData();
    } catch (err) {
      setTxState({
        status: "failed",
        txHash: null,
        error: parseBlockchainError(err),
        actionName: "Approval",
      });
    }
  };

  // Execute Vault action (deposit, mint, withdraw, redeem)
  const handleExecute = async (e) => {
    e.preventDefault();
    if (!walletConnected) return;
    if (!inputAmount || Number(inputAmount) <= 0) return;

    const actionLabels = {
      deposit: "Deposit into Vault",
      mint: "Mint Vault Shares",
      withdraw: "Withdraw Assets",
      redeem: "Redeem Vault Shares",
    };

    const actionName = actionLabels[activeTab] || "Vault Transaction";

    try {
      setTxState({
        status: "awaiting",
        txHash: null,
        error: null,
        actionName,
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = new ethers.Contract(vaultAddress, ERC4626_ABI, signer);
      const parsedAmount = ethers.parseUnits(inputAmount, decimals);

      let tx;
      if (activeTab === "deposit") {
        tx = await vault.deposit(parsedAmount, walletAddress);
      } else if (activeTab === "mint") {
        tx = await vault.mint(parsedAmount, walletAddress);
      } else if (activeTab === "withdraw") {
        tx = await vault.withdraw(parsedAmount, walletAddress, walletAddress);
      } else if (activeTab === "redeem") {
        tx = await vault.redeem(parsedAmount, walletAddress, walletAddress);
      }

      setTxState({
        status: "confirming",
        txHash: tx.hash,
        error: null,
        actionName,
      });

      await tx.wait();

      setTxState({
        status: "confirmed",
        txHash: tx.hash,
        error: null,
        actionName,
      });

      setInputAmount("");
      setPreviewResult("");
      await loadVaultData();
    } catch (err) {
      console.error(`${actionName} failed:`, err);
      setTxState({
        status: "failed",
        txHash: null,
        error: parseBlockchainError(err),
        actionName,
      });
    }
  };

  const needsApproval =
    (activeTab === "deposit" || activeTab === "mint") &&
    Number(allowance) < Number(inputAmount || 0);

  return (
    <div className="page-container vault-page">
      <div className="page-header-row">
        <div>
          <h2>Experiment 3: ERC-4626 Tokenized Vault</h2>
          <p>
            Standardized yield-bearing vault adhering to EIP-4626. Deposit underlying e-waste reward tokens (EWT)
            to receive yield-accumulating shares (EWVS).
          </p>
        </div>
      </div>

      <TransactionStatus
        status={txState.status}
        txHash={txState.txHash}
        error={txState.error}
        actionName={txState.actionName}
        onDismiss={() => setTxState({ status: "idle", txHash: null, error: null, actionName: "Vault" })}
      />

      {/* STATS OVERVIEW */}
      <section className="stats-grid">
        <StatCard
          icon="⬡"
          label={`My ${vaultSymbol} Shares`}
          value={walletConnected && isConfigured ? `${parseFloat(shareBalance).toFixed(4)} ${vaultSymbol}` : "—"}
          change="Vault token balance"
        />

        <StatCard
          icon="📦"
          label={`My ${assetSymbol} Assets`}
          value={walletConnected && isConfigured ? `${parseFloat(assetBalance).toFixed(4)} ${assetSymbol}` : "—"}
          change="Underlying token balance"
        />

        <StatCard
          icon="🏦"
          label="Total Assets in Vault"
          value={isConfigured ? `${parseFloat(totalAssets).toFixed(2)} ${assetSymbol}` : "—"}
          change={`Total Supply: ${parseFloat(totalShares).toFixed(2)} ${vaultSymbol}`}
        />

        <StatCard
          icon="⚖"
          label="Share Exchange Rate"
          value={isConfigured ? `1 ${vaultSymbol} = ${parseFloat(shareRate).toFixed(4)} ${assetSymbol}` : "—"}
          change="Assets per share ratio"
          badge="EIP-4626"
        />
      </section>

      {!isConfigured ? (
        <div className="card deploy-setup-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">CONFIGURATION REQUIRED</span>
              <h3>ERC-4626 Vault Contract Setup</h3>
              <p>
                Configure the vault and asset contract addresses below or set <code>VITE_ERC4626_VAULT_ADDRESS</code> in your <code>.env</code> file.
              </p>
            </div>
            <span className="step-number">EXP 3</span>
          </div>

          <div className="contract-config-form">
            <div className="input-group">
              <label>ERC-4626 Vault Contract Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={vaultAddress}
                onChange={(e) => setVaultAddress(e.target.value.trim())}
              />
            </div>

            <div className="input-group">
              <label>Underlying ERC-20 Asset Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={assetAddress}
                onChange={(e) => setAssetAddress(e.target.value.trim())}
              />
            </div>

            <button className="submit-button" onClick={loadVaultData}>
              Connect to Vault Contract →
            </button>
          </div>

          <div className="deployment-snippet">
            <strong>Local Hardhat Deployment Guide:</strong>
            <code>
              {`// contracts/EWasteVault4626.sol
npx hardhat run scripts/deploy-vault.js --network localhost
# Set VITE_ERC4626_VAULT_ADDRESS="0x..." in hiten_dapp/.env`}
            </code>
          </div>
        </div>
      ) : (
        <div className="main-grid">
          {/* INTERACTION CARD */}
          <div className="card vault-action-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">VAULT OPERATIONS</span>
                <h3>Deposit & Redeem</h3>
              </div>
            </div>

            {/* TABS */}
            <div className="vault-tabs">
              <button
                className={`vault-tab-btn ${activeTab === "deposit" ? "active" : ""}`}
                onClick={() => { setActiveTab("deposit"); setInputAmount(""); }}
              >
                Deposit Assets
              </button>
              <button
                className={`vault-tab-btn ${activeTab === "mint" ? "active" : ""}`}
                onClick={() => { setActiveTab("mint"); setInputAmount(""); }}
              >
                Mint Shares
              </button>
              <button
                className={`vault-tab-btn ${activeTab === "withdraw" ? "active" : ""}`}
                onClick={() => { setActiveTab("withdraw"); setInputAmount(""); }}
              >
                Withdraw Assets
              </button>
              <button
                className={`vault-tab-btn ${activeTab === "redeem" ? "active" : ""}`}
                onClick={() => { setActiveTab("redeem"); setInputAmount(""); }}
              >
                Redeem Shares
              </button>
            </div>

            {!walletConnected ? (
              <EmptyState
                icon="🔌"
                title="Connect Wallet"
                description="Connect your MetaMask wallet to interact with the ERC-4626 vault."
                actionText="Connect MetaMask"
                onAction={onConnect}
              />
            ) : (
              <form onSubmit={handleExecute}>
                <div className="vault-input-box">
                  <div className="vault-input-header">
                    <span>
                      {activeTab === "deposit" && `Deposit ${assetSymbol}`}
                      {activeTab === "mint" && `Mint ${vaultSymbol}`}
                      {activeTab === "withdraw" && `Withdraw ${assetSymbol}`}
                      {activeTab === "redeem" && `Redeem ${vaultSymbol}`}
                    </span>
                    <button
                      type="button"
                      className="max-btn"
                      onClick={() => {
                        if (activeTab === "deposit") setInputAmount(assetBalance);
                        else if (activeTab === "withdraw") setInputAmount(assetBalance);
                        else setInputAmount(shareBalance);
                      }}
                    >
                      MAX (
                      {activeTab === "deposit" || activeTab === "withdraw"
                        ? `${parseFloat(assetBalance).toFixed(2)} ${assetSymbol}`
                        : `${parseFloat(shareBalance).toFixed(2)} ${vaultSymbol}`}
                      )
                    </button>
                  </div>

                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.0"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      required
                    />
                    <span className="token-unit">
                      {activeTab === "deposit" || activeTab === "withdraw" ? assetSymbol : vaultSymbol}
                    </span>
                  </div>
                </div>

                {/* LIVE PREVIEW BOX */}
                <div className="vault-preview-card">
                  <div className="preview-row">
                    <span>
                      {activeTab === "deposit" && "You will receive approximately:"}
                      {activeTab === "mint" && "Required asset deposit:"}
                      {activeTab === "withdraw" && "Shares burned from balance:"}
                      {activeTab === "redeem" && "Underlying assets returned:"}
                    </span>
                    <strong>
                      {previewResult ? `${parseFloat(previewResult).toFixed(4)}` : "—"}{" "}
                      {activeTab === "deposit" || activeTab === "withdraw" ? vaultSymbol : assetSymbol}
                    </strong>
                  </div>
                  <small>Calculated on-chain via EIP-4626 preview hook</small>
                </div>

                <div className="action-buttons-row">
                  {needsApproval ? (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={handleApprove}
                      disabled={isLoading}
                    >
                      Approve {assetSymbol} Spend →
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    className="submit-button"
                    disabled={
                      isLoading ||
                      needsApproval ||
                      !inputAmount ||
                      Number(inputAmount) <= 0 ||
                      txState.status === "awaiting" ||
                      txState.status === "confirming"
                    }
                  >
                    {activeTab === "deposit" && `Deposit ${assetSymbol} →`}
                    {activeTab === "mint" && `Mint ${vaultSymbol} →`}
                    {activeTab === "withdraw" && `Withdraw ${assetSymbol} →`}
                    {activeTab === "redeem" && `Redeem ${vaultSymbol} →`}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* VAULT SPECIFICATION & SPECS */}
          <div className="card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">STANDARDS & SECURITY</span>
                <h3>EIP-4626 Specification</h3>
              </div>
            </div>

            <div className="spec-item-list">
              <div className="spec-item">
                <span>Standard</span>
                <strong>ERC-4626 (Tokenized Vault)</strong>
              </div>
              <div className="spec-item">
                <span>Underlying Asset</span>
                <code>{assetAddress ? `${assetAddress.slice(0, 10)}...${assetAddress.slice(-6)}` : "Not bound"}</code>
              </div>
              <div className="spec-item">
                <span>Vault Share Token</span>
                <code>{vaultAddress.slice(0, 10)}...{vaultAddress.slice(-6)}</code>
              </div>
              <div className="spec-item">
                <span>Inflation Protection</span>
                <span className="status-pill verified">Virtual Shares Offset</span>
              </div>
              <div className="spec-item">
                <span>Exchange Rate Calculation</span>
                <code>convertToAssets = (shares * totalAssets) / totalSupply</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VaultPage;
