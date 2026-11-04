import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  DEX_ROUTER_ADDRESS,
  DEX_FACTORY_ADDRESS,
  AMM_TOKEN0_ADDRESS,
  AMM_TOKEN1_ADDRESS,
} from "../config/addresses";
import { DEX_ROUTER_ABI, DEX_FACTORY_ABI, DEX_PAIR_ABI, ERC20_ABI } from "../config/abis";
import StatCard from "../components/StatCard";
import TransactionStatus from "../components/TransactionStatus";
import EmptyState from "../components/EmptyState";
import { parseBlockchainError } from "../blockchain/wallet";

export function DexPage({ walletConnected, walletAddress, onConnect }) {
  const [routerAddress, setRouterAddress] = useState(DEX_ROUTER_ADDRESS);
  const [factoryAddress, setFactoryAddress] = useState(DEX_FACTORY_ADDRESS);
  const [tokenAAddress, setTokenAAddress] = useState(AMM_TOKEN0_ADDRESS);
  const [tokenBAddress, setTokenBAddress] = useState(AMM_TOKEN1_ADDRESS);

  const [activeTab, setActiveTab] = useState("swap"); // "swap" | "addLiquidity" | "removeLiquidity"
  const [swapDirection, setSwapDirection] = useState("AtoB"); // "AtoB" or "BtoA"
  const [slippage, setSlippage] = useState("0.5"); // percentage

  // Pair & token states
  const [pairAddress, setPairAddress] = useState("");
  const [tokenASymbol, setTokenASymbol] = useState("EWASTE");
  const [tokenBSymbol, setTokenBSymbol] = useState("EREWARD");
  const [tokenABalance, setTokenABalance] = useState("0");
  const [tokenBBalance, setTokenBBalance] = useState("0");
  const [reserveA, setReserveA] = useState("0");
  const [reserveB, setReserveB] = useState("0");
  const [userLpBalance, setUserLpBalance] = useState("0");
  const [totalLpSupply, setTotalLpSupply] = useState("0");

  // Inputs
  const [inputAmount, setInputAmount] = useState("");
  const [outputEstimate, setOutputEstimate] = useState("");
  const [addAmountA, setAddAmountA] = useState("");
  const [addAmountB, setAddAmountB] = useState("");
  const [removeLpAmount, setRemoveLpAmount] = useState("");

  const [txState, setTxState] = useState({
    status: "idle",
    txHash: null,
    error: null,
    actionName: "DEX Action",
  });
  const [isLoading, setIsLoading] = useState(false);

  const isConfigured = Boolean(routerAddress && ethers.isAddress(routerAddress));

  // Load Pair & Token Data
  const loadDexData = useCallback(async () => {
    if (!walletConnected || !isConfigured || !window.ethereum) return;
    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const router = new ethers.Contract(routerAddress, DEX_ROUTER_ABI, provider);

      // Get factory from router if not set
      let factAddr = factoryAddress;
      try {
        if (!factAddr) factAddr = await router.factory();
        if (factAddr && factAddr !== factoryAddress) setFactoryAddress(factAddr);
      } catch {
        // Fallback
      }

      // Check Pair address via factory
      let currentPair = pairAddress;
      if (factAddr && ethers.isAddress(factAddr) && tokenAAddress && tokenBAddress) {
        try {
          const factory = new ethers.Contract(factAddr, DEX_FACTORY_ABI, provider);
          currentPair = await factory.getPair(tokenAAddress, tokenBAddress);
          setPairAddress(currentPair);
        } catch (e) {
          console.warn("Could not fetch pair:", e);
        }
      }

      // Fetch Token A & Token B balances
      if (tokenAAddress && ethers.isAddress(tokenAAddress)) {
        const cA = new ethers.Contract(tokenAAddress, ERC20_ABI, provider);
        const [sym, bal] = await Promise.all([
          cA.symbol().catch(() => "EWASTE"),
          walletAddress ? cA.balanceOf(walletAddress).catch(() => 0n) : 0n,
        ]);
        setTokenASymbol(sym);
        setTokenABalance(ethers.formatUnits(bal || 0n, 18));
      }

      if (tokenBAddress && ethers.isAddress(tokenBAddress)) {
        const cB = new ethers.Contract(tokenBAddress, ERC20_ABI, provider);
        const [sym, bal] = await Promise.all([
          cB.symbol().catch(() => "EREWARD"),
          walletAddress ? cB.balanceOf(walletAddress).catch(() => 0n) : 0n,
        ]);
        setTokenBSymbol(sym);
        setTokenBBalance(ethers.formatUnits(bal || 0n, 18));
      }

      // Read Reserves & LP from pair contract
      if (currentPair && ethers.isAddress(currentPair) && currentPair !== ethers.ZeroAddress) {
        const pair = new ethers.Contract(currentPair, DEX_PAIR_ABI, provider);
        const [res, lpBal, lpTot] = await Promise.all([
          pair.getReserves().catch(() => [0n, 0n, 0]),
          walletAddress ? pair.balanceOf(walletAddress).catch(() => 0n) : 0n,
          pair.totalSupply().catch(() => 0n),
        ]);
        setReserveA(ethers.formatUnits(res[0] || 0n, 18));
        setReserveB(ethers.formatUnits(res[1] || 0n, 18));
        setUserLpBalance(ethers.formatUnits(lpBal || 0n, 18));
        setTotalLpSupply(ethers.formatUnits(lpTot || 0n, 18));
      }
    } catch (err) {
      console.error("Failed to load DEX data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [walletConnected, isConfigured, routerAddress, factoryAddress, tokenAAddress, tokenBAddress, pairAddress, walletAddress]);

  useEffect(() => {
    loadDexData();
  }, [loadDexData]);

  // Live swap estimate using getAmountsOut or standard CPMM formula
  useEffect(() => {
    if (!inputAmount || isNaN(Number(inputAmount)) || Number(inputAmount) <= 0) {
      setOutputEstimate("");
      return;
    }

    const isAtoB = swapDirection === "AtoB";
    const rIn = isAtoB ? parseFloat(reserveA) : parseFloat(reserveB);
    const rOut = isAtoB ? parseFloat(reserveB) : parseFloat(reserveA);

    if (rIn > 0 && rOut > 0) {
      const amtIn = parseFloat(inputAmount);
      const amtInWithFee = amtIn * 0.997;
      const numerator = amtInWithFee * rOut;
      const denominator = rIn + amtInWithFee;
      setOutputEstimate((numerator / denominator).toFixed(4));
    } else {
      setOutputEstimate("");
    }
  }, [inputAmount, swapDirection, reserveA, reserveB]);

  // Execute Swap
  const handleSwap = async (e) => {
    e.preventDefault();
    if (!walletConnected || !isConfigured || !inputAmount) return;

    const isAtoB = swapDirection === "AtoB";
    const fromToken = isAtoB ? tokenAAddress : tokenBAddress;
    const toToken = isAtoB ? tokenBAddress : tokenAAddress;
    const fromSymbol = isAtoB ? tokenASymbol : tokenBSymbol;
    const toSymbol = isAtoB ? tokenBSymbol : tokenASymbol;

    const actionName = `Swap ${fromSymbol} → ${toSymbol}`;

    try {
      setTxState({ status: "awaiting", txHash: null, error: null, actionName });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Approve in-token to Router
      const inContract = new ethers.Contract(fromToken, ERC20_ABI, signer);
      const parsedIn = ethers.parseUnits(inputAmount, 18);
      const txApp = await inContract.approve(routerAddress, parsedIn);
      await txApp.wait();

      const router = new ethers.Contract(routerAddress, DEX_ROUTER_ABI, signer);
      const slipFactor = (100 - parseFloat(slippage)) / 100;
      const minOut = ethers.parseUnits((parseFloat(outputEstimate || "0") * slipFactor).toFixed(6), 18);
      const path = [fromToken, toToken];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 mins

      const tx = await router.swapExactTokensForTokens(
        parsedIn,
        minOut,
        path,
        walletAddress,
        deadline
      );

      setTxState({ status: "confirming", txHash: tx.hash, error: null, actionName });
      await tx.wait();

      setTxState({ status: "confirmed", txHash: tx.hash, error: null, actionName });
      setInputAmount("");
      setOutputEstimate("");
      await loadDexData();
    } catch (err) {
      setTxState({ status: "failed", txHash: null, error: parseBlockchainError(err), actionName });
    }
  };

  // Add Liquidity via Router
  const handleAddLiquidity = async (e) => {
    e.preventDefault();
    if (!walletConnected || !isConfigured) return;
    try {
      setTxState({ status: "awaiting", txHash: null, error: null, actionName: "Add Liquidity via Router" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const cA = new ethers.Contract(tokenAAddress, ERC20_ABI, signer);
      const cB = new ethers.Contract(tokenBAddress, ERC20_ABI, signer);
      const pA = ethers.parseUnits(addAmountA, 18);
      const pB = ethers.parseUnits(addAmountB, 18);

      // Approvals
      const txAppA = await cA.approve(routerAddress, pA);
      await txAppA.wait();
      const txAppB = await cB.approve(routerAddress, pB);
      await txAppB.wait();

      const router = new ethers.Contract(routerAddress, DEX_ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      const tx = await router.addLiquidity(
        tokenAAddress,
        tokenBAddress,
        pA,
        pB,
        0n, // Min A (0 for test UI simplicity)
        0n, // Min B
        walletAddress,
        deadline
      );

      setTxState({ status: "confirming", txHash: tx.hash, error: null, actionName: "Add Liquidity" });
      await tx.wait();

      setTxState({ status: "confirmed", txHash: tx.hash, error: null, actionName: "Add Liquidity" });
      setAddAmountA("");
      setAddAmountB("");
      await loadDexData();
    } catch (err) {
      setTxState({ status: "failed", txHash: null, error: parseBlockchainError(err), actionName: "Add Liquidity" });
    }
  };

  // Remove Liquidity via Router
  const handleRemoveLiquidity = async (e) => {
    e.preventDefault();
    if (!walletConnected || !isConfigured || !pairAddress) return;
    try {
      setTxState({ status: "awaiting", txHash: null, error: null, actionName: "Remove Liquidity via Router" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const pair = new ethers.Contract(pairAddress, ERC20_ABI, signer);
      const pLp = ethers.parseUnits(removeLpAmount, 18);
      const txApp = await pair.approve(routerAddress, pLp);
      await txApp.wait();

      const router = new ethers.Contract(routerAddress, DEX_ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      const tx = await router.removeLiquidity(
        tokenAAddress,
        tokenBAddress,
        pLp,
        0n,
        0n,
        walletAddress,
        deadline
      );

      setTxState({ status: "confirming", txHash: tx.hash, error: null, actionName: "Remove Liquidity" });
      await tx.wait();

      setTxState({ status: "confirmed", txHash: tx.hash, error: null, actionName: "Remove Liquidity" });
      setRemoveLpAmount("");
      await loadDexData();
    } catch (err) {
      setTxState({ status: "failed", txHash: null, error: parseBlockchainError(err), actionName: "Remove Liquidity" });
    }
  };

  return (
    <div className="page-container dex-page">
      <div className="page-header-row">
        <div>
          <h2>Experiment 6: DEX / Router Swap Interface</h2>
          <p>
            Decentralized Exchange router with multi-token swap routing, slippage control, and liquidity management.
          </p>
        </div>
      </div>

      <TransactionStatus
        status={txState.status}
        txHash={txState.txHash}
        error={txState.error}
        actionName={txState.actionName}
        onDismiss={() => setTxState({ status: "idle", txHash: null, error: null, actionName: "DEX" })}
      />

      {/* STATS OVERVIEW */}
      <section className="stats-grid">
        <StatCard
          icon="💳"
          label={`${tokenASymbol} Balance`}
          value={walletConnected ? `${parseFloat(tokenABalance).toFixed(2)} ${tokenASymbol}` : "—"}
          change={`Pool Reserve: ${parseFloat(reserveA).toFixed(2)}`}
        />

        <StatCard
          icon="✦"
          label={`${tokenBSymbol} Balance`}
          value={walletConnected ? `${parseFloat(tokenBBalance).toFixed(2)} ${tokenBSymbol}` : "—"}
          change={`Pool Reserve: ${parseFloat(reserveB).toFixed(2)}`}
        />

        <StatCard
          icon="⇄"
          label="My LP Position"
          value={walletConnected ? `${parseFloat(userLpBalance).toFixed(4)} LP` : "—"}
          change={`Total Pool Supply: ${parseFloat(totalLpSupply).toFixed(2)}`}
        />

        <StatCard
          icon="⚙"
          label="Router Standard"
          value="Uniswap V2"
          change="ExactTokensForTokens"
          badge="Router"
        />
      </section>

      {!isConfigured ? (
        <div className="card deploy-setup-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">CONFIGURATION REQUIRED</span>
              <h3>DEX Router Contract Setup</h3>
              <p>Configure the Router & Factory contract addresses or specify <code>VITE_DEX_ROUTER_ADDRESS</code> in <code>.env</code>.</p>
            </div>
            <span className="step-number">EXP 6</span>
          </div>

          <div className="contract-config-form">
            <div className="input-group">
              <label>DEX Router Contract Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={routerAddress}
                onChange={(e) => setRouterAddress(e.target.value.trim())}
              />
            </div>

            <div className="input-group">
              <label>DEX Factory Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={factoryAddress}
                onChange={(e) => setFactoryAddress(e.target.value.trim())}
              />
            </div>

            <div className="input-group">
              <label>Token A ({tokenASymbol}) Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={tokenAAddress}
                onChange={(e) => setTokenAAddress(e.target.value.trim())}
              />
            </div>

            <div className="input-group">
              <label>Token B ({tokenBSymbol}) Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={tokenBAddress}
                onChange={(e) => setTokenBAddress(e.target.value.trim())}
              />
            </div>

            <button className="submit-button" onClick={loadDexData}>
              Connect to DEX Router →
            </button>
          </div>
        </div>
      ) : (
        <div className="main-grid">
          {/* SWAP CARD */}
          <div className="card">
            <div className="vault-tabs">
              <button
                className={`vault-tab-btn ${activeTab === "swap" ? "active" : ""}`}
                onClick={() => setActiveTab("swap")}
              >
                ↔ Token Swap
              </button>
              <button
                className={`vault-tab-btn ${activeTab === "addLiquidity" ? "active" : ""}`}
                onClick={() => setActiveTab("addLiquidity")}
              >
                + Add Liquidity
              </button>
              <button
                className={`vault-tab-btn ${activeTab === "removeLiquidity" ? "active" : ""}`}
                onClick={() => setActiveTab("removeLiquidity")}
              >
                - Remove Liquidity
              </button>
            </div>

            {!walletConnected ? (
              <EmptyState
                icon="🔌"
                title="Connect Wallet"
                description="Connect your MetaMask wallet to execute decentralized token swaps."
                actionText="Connect MetaMask"
                onAction={onConnect}
              />
            ) : activeTab === "swap" ? (
              <form onSubmit={handleSwap}>
                {/* INPUT TOKEN BOX */}
                <div className="vault-input-box">
                  <div className="vault-input-header">
                    <span>Pay With</span>
                    <button
                      type="button"
                      className="max-btn"
                      onClick={() =>
                        setInputAmount(swapDirection === "AtoB" ? tokenABalance : tokenBBalance)
                      }
                    >
                      MAX (
                      {parseFloat(swapDirection === "AtoB" ? tokenABalance : tokenBBalance).toFixed(2)})
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
                      {swapDirection === "AtoB" ? tokenASymbol : tokenBSymbol}
                    </span>
                  </div>
                </div>

                {/* FLIP BUTTON */}
                <div style={{ textAlign: "center", margin: "10px 0" }}>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => {
                      setSwapDirection((prev) => (prev === "AtoB" ? "BtoA" : "AtoB"));
                      setInputAmount("");
                      setOutputEstimate("");
                    }}
                    title="Reverse Swap Direction"
                  >
                    ⇅
                  </button>
                </div>

                {/* OUTPUT TOKEN BOX */}
                <div className="vault-input-box">
                  <div className="vault-input-header">
                    <span>You Receive (Estimated)</span>
                  </div>
                  <div className="input-with-unit">
                    <input
                      type="text"
                      placeholder="0.0"
                      value={outputEstimate}
                      readOnly
                    />
                    <span className="token-unit">
                      {swapDirection === "AtoB" ? tokenBSymbol : tokenASymbol}
                    </span>
                  </div>
                </div>

                {/* SLIPPAGE & ROUTE DETAILS */}
                <div className="vault-preview-card" style={{ marginTop: "16px" }}>
                  <div className="preview-row">
                    <span>Slippage Tolerance:</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {["0.1", "0.5", "1.0"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`filter-pill ${slippage === s ? "active" : ""}`}
                          style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                          onClick={() => setSlippage(s)}
                        >
                          {s}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="preview-row" style={{ marginTop: "8px" }}>
                    <span>Minimum received after slippage:</span>
                    <strong>
                      {outputEstimate
                        ? `${(parseFloat(outputEstimate) * (1 - parseFloat(slippage) / 100)).toFixed(4)}`
                        : "—"}
                    </strong>
                  </div>
                </div>

                <button
                  type="submit"
                  className="submit-button"
                  style={{ marginTop: "16px" }}
                  disabled={isLoading || !inputAmount}
                >
                  Approve & Swap via Router →
                </button>
              </form>
            ) : activeTab === "addLiquidity" ? (
              <form onSubmit={handleAddLiquidity}>
                <div className="form-grid">
                  <div className="input-group">
                    <label>{tokenASymbol} Amount</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.0"
                      value={addAmountA}
                      onChange={(e) => setAddAmountA(e.target.value)}
                      required
                    />
                    <small>Balance: {parseFloat(tokenABalance).toFixed(2)}</small>
                  </div>
                  <div className="input-group">
                    <label>{tokenBSymbol} Amount</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.0"
                      value={addAmountB}
                      onChange={(e) => setAddAmountB(e.target.value)}
                      required
                    />
                    <small>Balance: {parseFloat(tokenBBalance).toFixed(2)}</small>
                  </div>
                </div>
                <button type="submit" className="submit-button" disabled={isLoading || !addAmountA || !addAmountB}>
                  Approve Both & Add Liquidity →
                </button>
              </form>
            ) : (
              <form onSubmit={handleRemoveLiquidity}>
                <div className="input-group full">
                  <label>LP Tokens to Remove</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.0"
                      value={removeLpAmount}
                      onChange={(e) => setRemoveLpAmount(e.target.value)}
                      required
                    />
                    <span className="token-unit">LP</span>
                  </div>
                  <small>Available: {parseFloat(userLpBalance).toFixed(4)} LP</small>
                </div>
                <button type="submit" className="submit-button" disabled={isLoading || !removeLpAmount}>
                  Remove Liquidity & Claim Tokens →
                </button>
              </form>
            )}
          </div>

          {/* POOL & ROUTER INFO */}
          <div className="card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">DEX ARCHITECTURE</span>
                <h3>Contract Topology</h3>
              </div>
            </div>

            <div className="spec-item-list">
              <div className="spec-item">
                <span>Router Address</span>
                <code>{routerAddress ? `${routerAddress.slice(0, 10)}...${routerAddress.slice(-6)}` : "—"}</code>
              </div>
              <div className="spec-item">
                <span>Factory Address</span>
                <code>{factoryAddress ? `${factoryAddress.slice(0, 10)}...${factoryAddress.slice(-6)}` : "—"}</code>
              </div>
              <div className="spec-item">
                <span>Pair Contract</span>
                <code>{pairAddress ? `${pairAddress.slice(0, 10)}...${pairAddress.slice(-6)}` : "Not Created"}</code>
              </div>
              <div className="spec-item">
                <span>Routing Algorithm</span>
                <span className="status-pill verified">Exact In / Min Out Protection</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DexPage;
