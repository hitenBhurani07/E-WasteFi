import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { AMM_ADDRESS, AMM_TOKEN0_ADDRESS, AMM_TOKEN1_ADDRESS } from "../config/addresses";
import { AMM_ABI, ERC20_ABI } from "../config/abis";
import StatCard from "../components/StatCard";
import TransactionStatus from "../components/TransactionStatus";
import EmptyState from "../components/EmptyState";
import { parseBlockchainError } from "../blockchain/wallet";

export function LiquidityPoolPage({ walletConnected, walletAddress, onConnect }) {
  const [ammAddress, setAmmAddress] = useState(AMM_ADDRESS);
  const [token0Address, setToken0Address] = useState(AMM_TOKEN0_ADDRESS);
  const [token1Address, setToken1Address] = useState(AMM_TOKEN1_ADDRESS);

  const [activeTab, setActiveTab] = useState("add"); // "add" | "remove" | "swap0to1" | "swap1to0"

  // Live pool state
  const [reserve0, setReserve0] = useState("0");
  const [reserve1, setReserve1] = useState("0");
  const [token0Symbol, setToken0Symbol] = useState("EWT");
  const [token1Symbol, setToken1Symbol] = useState("EWR");
  const [token0Balance, setToken0Balance] = useState("0");
  const [token1Balance, setToken1Balance] = useState("0");
  const [userLpBalance, setUserLpBalance] = useState("0");
  const [totalLpSupply, setTotalLpSupply] = useState("0");

  // Input states
  const [amount0Input, setAmount0Input] = useState("");
  const [amount1Input, setAmount1Input] = useState("");
  const [removeLpInput, setRemoveLpInput] = useState("");
  const [swapInput, setSwapInput] = useState("");
  const [swapPreview, setSwapPreview] = useState("");

  const [txState, setTxState] = useState({
    status: "idle",
    txHash: null,
    error: null,
    actionName: "AMM Action",
  });
  const [isLoading, setIsLoading] = useState(false);

  const isConfigured = Boolean(ammAddress && ethers.isAddress(ammAddress));

  const loadPoolData = useCallback(async () => {
    if (!walletConnected || !isConfigured || !window.ethereum) return;
    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const amm = new ethers.Contract(ammAddress, AMM_ABI, provider);

      // 1. Reserves & LP Supply
      const [reserves, userLp, lpTotal] = await Promise.all([
        amm.getReserves().catch(() => [0n, 0n]),
        walletAddress ? amm.lpBalances(walletAddress).catch(() => 0n) : 0n,
        amm.totalLPSupply().catch(() => 0n),
      ]);

      const r0 = ethers.formatUnits(reserves[0] || 0n, 18);
      const r1 = ethers.formatUnits(reserves[1] || 0n, 18);
      setReserve0(r0);
      setReserve1(r1);
      setUserLpBalance(ethers.formatUnits(userLp || 0n, 18));
      setTotalLpSupply(ethers.formatUnits(lpTotal || 0n, 18));

      // 2. Fetch token info if addresses present
      let t0Addr = token0Address;
      let t1Addr = token1Address;
      try {
        if (!t0Addr) t0Addr = await amm.token0();
        if (!t1Addr) t1Addr = await amm.token1();
        if (t0Addr && t0Addr !== token0Address) setToken0Address(t0Addr);
        if (t1Addr && t1Addr !== token1Address) setToken1Address(t1Addr);
      } catch {
        // Fallback
      }

      if (t0Addr && ethers.isAddress(t0Addr)) {
        const t0Contract = new ethers.Contract(t0Addr, ERC20_ABI, provider);
        const [sym0, bal0] = await Promise.all([
          t0Contract.symbol().catch(() => "EWT"),
          walletAddress ? t0Contract.balanceOf(walletAddress).catch(() => 0n) : 0n,
        ]);
        setToken0Symbol(sym0);
        setToken0Balance(ethers.formatUnits(bal0, 18));
      }

      if (t1Addr && ethers.isAddress(t1Addr)) {
        const t1Contract = new ethers.Contract(t1Addr, ERC20_ABI, provider);
        const [sym1, bal1] = await Promise.all([
          t1Contract.symbol().catch(() => "EWR"),
          walletAddress ? t1Contract.balanceOf(walletAddress).catch(() => 0n) : 0n,
        ]);
        setToken1Symbol(sym1);
        setToken1Balance(ethers.formatUnits(bal1, 18));
      }
    } catch (err) {
      console.error("Failed to load AMM data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [walletConnected, isConfigured, ammAddress, token0Address, token1Address, walletAddress]);

  useEffect(() => {
    loadPoolData();
  }, [loadPoolData]);

  // Calculate swap output preview (x * y = k formula with 0.3% fee)
  useEffect(() => {
    if (!swapInput || isNaN(Number(swapInput)) || Number(swapInput) <= 0) {
      setSwapPreview("");
      return;
    }

    const rIn = activeTab === "swap0to1" ? parseFloat(reserve0) : parseFloat(reserve1);
    const rOut = activeTab === "swap0to1" ? parseFloat(reserve1) : parseFloat(reserve0);

    if (rIn > 0 && rOut > 0) {
      const amountIn = parseFloat(swapInput);
      const amountInWithFee = amountIn * 0.997; // 0.3% AMM fee
      const numerator = amountInWithFee * rOut;
      const denominator = rIn + amountInWithFee;
      const estOut = numerator / denominator;
      setSwapPreview(estOut.toFixed(4));
    } else {
      setSwapPreview("");
    }
  }, [swapInput, activeTab, reserve0, reserve1]);

  // Auto-sync second token ratio on add liquidity
  const handleAmount0Change = (val) => {
    setAmount0Input(val);
    const r0 = parseFloat(reserve0);
    const r1 = parseFloat(reserve1);
    if (r0 > 0 && r1 > 0 && val && !isNaN(val)) {
      setAmount1Input(((parseFloat(val) * r1) / r0).toFixed(4));
    }
  };

  // Add Liquidity
  const handleAddLiquidity = async (e) => {
    e.preventDefault();
    if (!walletConnected || !isConfigured) return;
    try {
      setTxState({ status: "awaiting", txHash: null, error: null, actionName: "Add Liquidity" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Approvals
      if (token0Address && ethers.isAddress(token0Address)) {
        const t0 = new ethers.Contract(token0Address, ERC20_ABI, signer);
        const a0 = ethers.parseUnits(amount0Input, 18);
        const txApp0 = await t0.approve(ammAddress, a0);
        await txApp0.wait();
      }

      if (token1Address && ethers.isAddress(token1Address)) {
        const t1 = new ethers.Contract(token1Address, ERC20_ABI, signer);
        const a1 = ethers.parseUnits(amount1Input, 18);
        const txApp1 = await t1.approve(ammAddress, a1);
        await txApp1.wait();
      }

      const amm = new ethers.Contract(ammAddress, AMM_ABI, signer);
      const a0 = ethers.parseUnits(amount0Input, 18);
      const a1 = ethers.parseUnits(amount1Input, 18);

      const tx = await amm.addLiquidity(a0, a1);
      setTxState({ status: "confirming", txHash: tx.hash, error: null, actionName: "Add Liquidity" });
      await tx.wait();

      setTxState({ status: "confirmed", txHash: tx.hash, error: null, actionName: "Add Liquidity" });
      setAmount0Input("");
      setAmount1Input("");
      await loadPoolData();
    } catch (err) {
      setTxState({ status: "failed", txHash: null, error: parseBlockchainError(err), actionName: "Add Liquidity" });
    }
  };

  // Remove Liquidity
  const handleRemoveLiquidity = async (e) => {
    e.preventDefault();
    if (!walletConnected || !isConfigured) return;
    try {
      setTxState({ status: "awaiting", txHash: null, error: null, actionName: "Remove Liquidity" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const amm = new ethers.Contract(ammAddress, AMM_ABI, signer);

      const parsedLp = ethers.parseUnits(removeLpInput, 18);
      const tx = await amm.removeLiquidity(parsedLp);

      setTxState({ status: "confirming", txHash: tx.hash, error: null, actionName: "Remove Liquidity" });
      await tx.wait();

      setTxState({ status: "confirmed", txHash: tx.hash, error: null, actionName: "Remove Liquidity" });
      setRemoveLpInput("");
      await loadPoolData();
    } catch (err) {
      setTxState({ status: "failed", txHash: null, error: parseBlockchainError(err), actionName: "Remove Liquidity" });
    }
  };

  // Swap on AMM
  const handleSwap = async (e) => {
    e.preventDefault();
    if (!walletConnected || !isConfigured) return;
    const is0To1 = activeTab === "swap0to1";
    const actionLabel = is0To1 ? `Swap ${token0Symbol} → ${token1Symbol}` : `Swap ${token1Symbol} → ${token0Symbol}`;

    try {
      setTxState({ status: "awaiting", txHash: null, error: null, actionName: actionLabel });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const inTokenAddr = is0To1 ? token0Address : token1Address;
      const inContract = new ethers.Contract(inTokenAddr, ERC20_ABI, signer);
      const parsedIn = ethers.parseUnits(swapInput, 18);

      // Approve in-token
      const txApp = await inContract.approve(ammAddress, parsedIn);
      await txApp.wait();

      const amm = new ethers.Contract(ammAddress, AMM_ABI, signer);
      const tx = is0To1
        ? await amm.swapToken0ForToken1(parsedIn)
        : await amm.swapToken1ForToken0(parsedIn);

      setTxState({ status: "confirming", txHash: tx.hash, error: null, actionName: actionLabel });
      await tx.wait();

      setTxState({ status: "confirmed", txHash: tx.hash, error: null, actionName: actionLabel });
      setSwapInput("");
      setSwapPreview("");
      await loadPoolData();
    } catch (err) {
      setTxState({ status: "failed", txHash: null, error: parseBlockchainError(err), actionName: actionLabel });
    }
  };

  return (
    <div className="page-container amm-page">
      <div className="page-header-row">
        <div>
          <h2>Experiment 4: Constant Product AMM Pool</h2>
          <p>
            Decentralized Automated Market Maker (x · y = k). Provide liquidity to earn pool trading fees
            or swap between E-Waste Tokens (EWT) and Reward Tokens (EWR).
          </p>
        </div>
      </div>

      <TransactionStatus
        status={txState.status}
        txHash={txState.txHash}
        error={txState.error}
        actionName={txState.actionName}
        onDismiss={() => setTxState({ status: "idle", txHash: null, error: null, actionName: "AMM Action" })}
      />

      {/* STATS OVERVIEW */}
      <section className="stats-grid">
        <StatCard
          icon="📦"
          label={`${token0Symbol} Reserve`}
          value={isConfigured ? `${parseFloat(reserve0).toFixed(2)} ${token0Symbol}` : "—"}
          change={`My balance: ${parseFloat(token0Balance).toFixed(2)}`}
        />

        <StatCard
          icon="✦"
          label={`${token1Symbol} Reserve`}
          value={isConfigured ? `${parseFloat(reserve1).toFixed(2)} ${token1Symbol}` : "—"}
          change={`My balance: ${parseFloat(token1Balance).toFixed(2)}`}
        />

        <StatCard
          icon="⇄"
          label="My LP Tokens"
          value={walletConnected && isConfigured ? `${parseFloat(userLpBalance).toFixed(4)} LP` : "—"}
          change={`Total Pool Supply: ${parseFloat(totalLpSupply).toFixed(2)}`}
        />

        <StatCard
          icon="⚡"
          label="Pool Fee Rate"
          value="0.30%"
          change="Paid to liquidity providers"
          badge="x · y = k"
        />
      </section>

      {!isConfigured ? (
        <div className="card deploy-setup-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">CONFIGURATION REQUIRED</span>
              <h3>AMM Pool Contract Setup</h3>
              <p>Configure the AMM contract address below or specify <code>VITE_AMM_ADDRESS</code> in <code>.env</code>.</p>
            </div>
            <span className="step-number">EXP 4</span>
          </div>

          <div className="contract-config-form">
            <div className="input-group">
              <label>AMM Pool Contract Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={ammAddress}
                onChange={(e) => setAmmAddress(e.target.value.trim())}
              />
            </div>

            <div className="input-group">
              <label>Token 0 (EWT) Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={token0Address}
                onChange={(e) => setToken0Address(e.target.value.trim())}
              />
            </div>

            <div className="input-group">
              <label>Token 1 (EWR) Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={token1Address}
                onChange={(e) => setToken1Address(e.target.value.trim())}
              />
            </div>

            <button className="submit-button" onClick={loadPoolData}>
              Connect to AMM Contract →
            </button>
          </div>
        </div>
      ) : (
        <div className="main-grid">
          <div className="card">
            {/* TABS */}
            <div className="vault-tabs">
              <button
                className={`vault-tab-btn ${activeTab === "add" ? "active" : ""}`}
                onClick={() => setActiveTab("add")}
              >
                + Add Liquidity
              </button>
              <button
                className={`vault-tab-btn ${activeTab === "remove" ? "active" : ""}`}
                onClick={() => setActiveTab("remove")}
              >
                - Remove Liquidity
              </button>
              <button
                className={`vault-tab-btn ${activeTab === "swap0to1" ? "active" : ""}`}
                onClick={() => setActiveTab("swap0to1")}
              >
                Swap {token0Symbol}→{token1Symbol}
              </button>
              <button
                className={`vault-tab-btn ${activeTab === "swap1to0" ? "active" : ""}`}
                onClick={() => setActiveTab("swap1to0")}
              >
                Swap {token1Symbol}→{token0Symbol}
              </button>
            </div>

            {!walletConnected ? (
              <EmptyState
                icon="🔌"
                title="Connect Wallet"
                description="Connect your MetaMask wallet to interact with the AMM Liquidity Pool."
                actionText="Connect MetaMask"
                onAction={onConnect}
              />
            ) : activeTab === "add" ? (
              <form onSubmit={handleAddLiquidity}>
                <div className="form-grid">
                  <div className="input-group">
                    <label>{token0Symbol} Amount</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.0"
                      value={amount0Input}
                      onChange={(e) => handleAmount0Change(e.target.value)}
                      required
                    />
                    <small>Balance: {parseFloat(token0Balance).toFixed(2)} {token0Symbol}</small>
                  </div>

                  <div className="input-group">
                    <label>{token1Symbol} Amount</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.0"
                      value={amount1Input}
                      onChange={(e) => setAmount1Input(e.target.value)}
                      required
                    />
                    <small>Balance: {parseFloat(token1Balance).toFixed(2)} {token1Symbol}</small>
                  </div>
                </div>

                <div className="vault-preview-card">
                  <span>Pool Ratio: 1 {token0Symbol} ≈ {(parseFloat(reserve1) / (parseFloat(reserve0) || 1)).toFixed(4)} {token1Symbol}</span>
                  <small>LP tokens minted proportionally to current pool supply</small>
                </div>

                <button type="submit" className="submit-button" disabled={isLoading}>
                  Approve & Supply Liquidity →
                </button>
              </form>
            ) : activeTab === "remove" ? (
              <form onSubmit={handleRemoveLiquidity}>
                <div className="input-group full">
                  <label>LP Tokens to Burn</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.0"
                      value={removeLpInput}
                      onChange={(e) => setRemoveLpInput(e.target.value)}
                      required
                    />
                    <span className="token-unit">LP</span>
                  </div>
                  <small>Available: {parseFloat(userLpBalance).toFixed(4)} LP</small>
                </div>

                <button type="submit" className="submit-button" disabled={isLoading || !removeLpInput}>
                  Burn LP & Withdraw Tokens →
                </button>
              </form>
            ) : (
              <form onSubmit={handleSwap}>
                <div className="input-group full">
                  <label>Input {activeTab === "swap0to1" ? token0Symbol : token1Symbol}</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.0"
                    value={swapInput}
                    onChange={(e) => setSwapInput(e.target.value)}
                    required
                  />
                  <small>
                    Balance:{" "}
                    {activeTab === "swap0to1"
                      ? `${parseFloat(token0Balance).toFixed(2)} ${token0Symbol}`
                      : `${parseFloat(token1Balance).toFixed(2)} ${token1Symbol}`}
                  </small>
                </div>

                <div className="vault-preview-card">
                  <div className="preview-row">
                    <span>Expected Output:</span>
                    <strong>
                      {swapPreview || "0.0000"}{" "}
                      {activeTab === "swap0to1" ? token1Symbol : token0Symbol}
                    </strong>
                  </div>
                  <small>Includes 0.3% protocol fee</small>
                </div>

                <button type="submit" className="submit-button" disabled={isLoading || !swapInput}>
                  Execute AMM Swap →
                </button>
              </form>
            )}
          </div>

          <div className="card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">AMM FORMULA</span>
                <h3>Constant Product Model</h3>
              </div>
            </div>

            <div className="spec-item-list">
              <div className="spec-item">
                <span>Invariant Invariant</span>
                <code>k = x · y</code>
              </div>
              <div className="spec-item">
                <span>Reserve Product (k)</span>
                <code>{(parseFloat(reserve0) * parseFloat(reserve1)).toFixed(2)}</code>
              </div>
              <div className="spec-item">
                <span>LP Mint Rule</span>
                <code>LP = sqrt(amount0 · amount1)</code>
              </div>
              <div className="spec-item">
                <span>Contract Address</span>
                <code>{ammAddress ? `${ammAddress.slice(0, 10)}...${ammAddress.slice(-6)}` : "—"}</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiquidityPoolPage;
