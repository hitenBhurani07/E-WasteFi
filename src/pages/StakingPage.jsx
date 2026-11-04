import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { FARM_ADDRESS, FARM_STAKE_TOKEN, FARM_REWARD_TOKEN } from "../config/addresses";
import { FARM_ABI, ERC20_ABI } from "../config/abis";
import StatCard from "../components/StatCard";
import TransactionStatus from "../components/TransactionStatus";
import EmptyState from "../components/EmptyState";
import { parseBlockchainError } from "../blockchain/wallet";

export function StakingPage({ walletConnected, walletAddress, onConnect }) {
  const [farmAddress, setFarmAddress] = useState(FARM_ADDRESS);
  const [stakeTokenAddress, setStakeTokenAddress] = useState(FARM_STAKE_TOKEN);
  const [rewardTokenAddress, setRewardTokenAddress] = useState(FARM_REWARD_TOKEN);

  const [stakeTokenSymbol, setStakeTokenSymbol] = useState("EWR");
  const [rewardTokenSymbol, setRewardTokenSymbol] = useState("RWR");

  // Balances
  const [stakeTokenWalletBal, setStakeTokenWalletBal] = useState("0");
  const [rewardTokenWalletBal, setRewardTokenWalletBal] = useState("0");
  const [stakedBalance, setStakedBalance] = useState("0");
  const [pendingRewards, setPendingRewards] = useState("0");
  const [rewardRate, setRewardRate] = useState("0");

  // Inputs
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  const [txState, setTxState] = useState({
    status: "idle",
    txHash: null,
    error: null,
    actionName: "Farm Action",
  });
  const [isLoading, setIsLoading] = useState(false);

  const isConfigured = Boolean(farmAddress && ethers.isAddress(farmAddress));

  const loadFarmData = useCallback(async () => {
    if (!walletConnected || !isConfigured || !window.ethereum) return;
    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const farm = new ethers.Contract(farmAddress, FARM_ABI, provider);

      // Try reading token addresses if not set
      let sAddr = stakeTokenAddress;
      let rAddr = rewardTokenAddress;
      try {
        if (!sAddr) sAddr = await farm.stakeToken();
        if (!rAddr) rAddr = await farm.rewardToken();
        if (sAddr && sAddr !== stakeTokenAddress) setStakeTokenAddress(sAddr);
        if (rAddr && rAddr !== rewardTokenAddress) setRewardTokenAddress(rAddr);
      } catch {
        // ABI may not have getters
      }

      const [staked, earned, rate] = await Promise.all([
        walletAddress ? farm.stakedBalance(walletAddress).catch(() => 0n) : 0n,
        walletAddress ? farm.earnedRewards(walletAddress).catch(() => 0n) : 0n,
        farm.rewardRate().catch(() => 0n),
      ]);

      setStakedBalance(ethers.formatUnits(staked || 0n, 18));
      setPendingRewards(ethers.formatUnits(earned || 0n, 18));
      setRewardRate(ethers.formatUnits(rate || 0n, 18));

      // Token balances
      if (sAddr && ethers.isAddress(sAddr)) {
        const sContract = new ethers.Contract(sAddr, ERC20_ABI, provider);
        const [sym, bal] = await Promise.all([
          sContract.symbol().catch(() => "EWR"),
          walletAddress ? sContract.balanceOf(walletAddress).catch(() => 0n) : 0n,
        ]);
        setStakeTokenSymbol(sym);
        setStakeTokenWalletBal(ethers.formatUnits(bal || 0n, 18));
      }

      if (rAddr && ethers.isAddress(rAddr)) {
        const rContract = new ethers.Contract(rAddr, ERC20_ABI, provider);
        const [sym, bal] = await Promise.all([
          rContract.symbol().catch(() => "RWR"),
          walletAddress ? rContract.balanceOf(walletAddress).catch(() => 0n) : 0n,
        ]);
        setRewardTokenSymbol(sym);
        setRewardTokenWalletBal(ethers.formatUnits(bal || 0n, 18));
      }
    } catch (err) {
      console.error("Failed to load Farm data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [walletConnected, isConfigured, farmAddress, stakeTokenAddress, rewardTokenAddress, walletAddress]);

  useEffect(() => {
    loadFarmData();
  }, [loadFarmData]);

  // Periodic polling for earned rewards tick
  useEffect(() => {
    if (!walletConnected || !isConfigured) return;
    const interval = setInterval(() => {
      loadFarmData();
    }, 12000);
    return () => clearInterval(interval);
  }, [walletConnected, isConfigured, loadFarmData]);

  // Stake action
  const handleStake = async (e) => {
    e.preventDefault();
    if (!walletConnected || !isConfigured || !stakeAmount) return;
    try {
      setTxState({ status: "awaiting", txHash: null, error: null, actionName: "Stake Tokens" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Approve stake token
      if (stakeTokenAddress && ethers.isAddress(stakeTokenAddress)) {
        const sContract = new ethers.Contract(stakeTokenAddress, ERC20_ABI, signer);
        const parsedStake = ethers.parseUnits(stakeAmount, 18);
        const txApp = await sContract.approve(farmAddress, parsedStake);
        await txApp.wait();
      }

      const farm = new ethers.Contract(farmAddress, FARM_ABI, signer);
      const parsedStake = ethers.parseUnits(stakeAmount, 18);
      const tx = await farm.stake(parsedStake);

      setTxState({ status: "confirming", txHash: tx.hash, error: null, actionName: "Stake Tokens" });
      await tx.wait();

      setTxState({ status: "confirmed", txHash: tx.hash, error: null, actionName: "Stake Tokens" });
      setStakeAmount("");
      await loadFarmData();
    } catch (err) {
      setTxState({ status: "failed", txHash: null, error: parseBlockchainError(err), actionName: "Stake" });
    }
  };

  // Harvest rewards action
  const handleHarvest = async () => {
    if (!walletConnected || !isConfigured) return;
    try {
      setTxState({ status: "awaiting", txHash: null, error: null, actionName: "Harvest Rewards" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const farm = new ethers.Contract(farmAddress, FARM_ABI, signer);

      const tx = await farm.harvest();
      setTxState({ status: "confirming", txHash: tx.hash, error: null, actionName: "Harvest Rewards" });
      await tx.wait();

      setTxState({ status: "confirmed", txHash: tx.hash, error: null, actionName: "Harvest Rewards" });
      await loadFarmData();
    } catch (err) {
      setTxState({ status: "failed", txHash: null, error: parseBlockchainError(err), actionName: "Harvest" });
    }
  };

  // Unstake action
  const handleUnstake = async (e) => {
    e.preventDefault();
    if (!walletConnected || !isConfigured || !unstakeAmount) return;
    try {
      setTxState({ status: "awaiting", txHash: null, error: null, actionName: "Unstake Tokens" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const farm = new ethers.Contract(farmAddress, FARM_ABI, signer);

      const parsedUnstake = ethers.parseUnits(unstakeAmount, 18);
      const tx = await farm.unstake(parsedUnstake);

      setTxState({ status: "confirming", txHash: tx.hash, error: null, actionName: "Unstake Tokens" });
      await tx.wait();

      setTxState({ status: "confirmed", txHash: tx.hash, error: null, actionName: "Unstake Tokens" });
      setUnstakeAmount("");
      await loadFarmData();
    } catch (err) {
      setTxState({ status: "failed", txHash: null, error: parseBlockchainError(err), actionName: "Unstake" });
    }
  };

  // Full exit (unstake all + harvest)
  const handleExit = async () => {
    if (!walletConnected || !isConfigured) return;
    try {
      setTxState({ status: "awaiting", txHash: null, error: null, actionName: "Full Farm Exit" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const farm = new ethers.Contract(farmAddress, FARM_ABI, signer);

      if (parseFloat(stakedBalance) > 0) {
        const parsedAll = ethers.parseUnits(stakedBalance, 18);
        const tx1 = await farm.unstake(parsedAll);
        await tx1.wait();
      }

      if (parseFloat(pendingRewards) > 0) {
        const tx2 = await farm.harvest();
        await tx2.wait();
      }

      setTxState({ status: "confirmed", txHash: null, error: null, actionName: "Full Farm Exit" });
      await loadFarmData();
    } catch (err) {
      setTxState({ status: "failed", txHash: null, error: parseBlockchainError(err), actionName: "Exit" });
    }
  };

  return (
    <div className="page-container farm-page">
      <div className="page-header-row">
        <div>
          <h2>Experiment 5: Yield Farming & Staking</h2>
          <p>
            Stake e-waste reward tokens ({stakeTokenSymbol}) to earn continuous emission of protocol reward tokens ({rewardTokenSymbol}).
          </p>
        </div>
      </div>

      <TransactionStatus
        status={txState.status}
        txHash={txState.txHash}
        error={txState.error}
        actionName={txState.actionName}
        onDismiss={() => setTxState({ status: "idle", txHash: null, error: null, actionName: "Farm Action" })}
      />

      {/* STATS OVERVIEW */}
      <section className="stats-grid">
        <StatCard
          icon="⚡"
          label={`Staked ${stakeTokenSymbol}`}
          value={walletConnected && isConfigured ? `${parseFloat(stakedBalance).toFixed(2)} ${stakeTokenSymbol}` : "—"}
          change={`Wallet: ${parseFloat(stakeTokenWalletBal).toFixed(2)} ${stakeTokenSymbol}`}
        />

        <StatCard
          icon="✦"
          label={`Pending ${rewardTokenSymbol}`}
          value={walletConnected && isConfigured ? `${parseFloat(pendingRewards).toFixed(4)} ${rewardTokenSymbol}` : "—"}
          change="Earned rewards ready to harvest"
          badge="Live Ticking"
        />

        <StatCard
          icon="💰"
          label={`Harvested ${rewardTokenSymbol}`}
          value={walletConnected && isConfigured ? `${parseFloat(rewardTokenWalletBal).toFixed(2)} ${rewardTokenSymbol}` : "—"}
          change="Balance in your wallet"
        />

        <StatCard
          icon="📈"
          label="Emission Rate"
          value={isConfigured ? `${parseFloat(rewardRate).toFixed(2)}/sec` : "—"}
          change="Configured protocol incentive"
        />
      </section>

      {!isConfigured ? (
        <div className="card deploy-setup-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">CONFIGURATION REQUIRED</span>
              <h3>Yield Farm Contract Setup</h3>
              <p>Configure the Staking Farm contract address below or specify <code>VITE_FARM_ADDRESS</code> in <code>.env</code>.</p>
            </div>
            <span className="step-number">EXP 5</span>
          </div>

          <div className="contract-config-form">
            <div className="input-group">
              <label>Farm / Staking Contract Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={farmAddress}
                onChange={(e) => setFarmAddress(e.target.value.trim())}
              />
            </div>

            <div className="input-group">
              <label>Stake Token (EWR) Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={stakeTokenAddress}
                onChange={(e) => setStakeTokenAddress(e.target.value.trim())}
              />
            </div>

            <div className="input-group">
              <label>Reward Token (RWR) Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={rewardTokenAddress}
                onChange={(e) => setRewardTokenAddress(e.target.value.trim())}
              />
            </div>

            <button className="submit-button" onClick={loadFarmData}>
              Connect to Farm Contract →
            </button>
          </div>
        </div>
      ) : (
        <div className="main-grid">
          {/* STAKE & HARVEST CONTROLS */}
          <div className="card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">STAKE & EARN</span>
                <h3>Deposit & Harvest</h3>
              </div>
            </div>

            {!walletConnected ? (
              <EmptyState
                icon="🔌"
                title="Connect Wallet"
                description="Connect your MetaMask wallet to stake your tokens and farm rewards."
                actionText="Connect MetaMask"
                onAction={onConnect}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* STAKE FORM */}
                <form onSubmit={handleStake}>
                  <div className="input-group full">
                    <div className="vault-input-header">
                      <label>Stake {stakeTokenSymbol}</label>
                      <button
                        type="button"
                        className="max-btn"
                        onClick={() => setStakeAmount(stakeTokenWalletBal)}
                      >
                        MAX ({parseFloat(stakeTokenWalletBal).toFixed(2)})
                      </button>
                    </div>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.0"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        required
                      />
                      <span className="token-unit">{stakeTokenSymbol}</span>
                    </div>
                  </div>

                  <button type="submit" className="submit-button" disabled={isLoading || !stakeAmount}>
                    Approve & Stake {stakeTokenSymbol} →
                  </button>
                </form>

                {/* HARVEST CARD */}
                <div className="vault-preview-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span>Pending Rewards:</span>
                    <strong>{parseFloat(pendingRewards).toFixed(4)} {rewardTokenSymbol}</strong>
                  </div>
                  <button
                    className="hero-button"
                    style={{ padding: "8px 18px", fontSize: "0.88rem" }}
                    onClick={handleHarvest}
                    disabled={isLoading || parseFloat(pendingRewards) <= 0}
                  >
                    ✦ Harvest Rewards
                  </button>
                </div>

                {/* UNSTAKE FORM */}
                <form onSubmit={handleUnstake}>
                  <div className="input-group full">
                    <div className="vault-input-header">
                      <label>Partial Unstake</label>
                      <button
                        type="button"
                        className="max-btn"
                        onClick={() => setUnstakeAmount(stakedBalance)}
                      >
                        MAX ({parseFloat(stakedBalance).toFixed(2)})
                      </button>
                    </div>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.0"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        required
                      />
                      <span className="token-unit">{stakeTokenSymbol}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" className="secondary-button" disabled={isLoading || !unstakeAmount}>
                      Unstake Amount
                    </button>
                    <button
                      type="button"
                      className="view-button"
                      onClick={handleExit}
                      disabled={isLoading || (parseFloat(stakedBalance) <= 0 && parseFloat(pendingRewards) <= 0)}
                      title="Unstake all tokens and harvest remaining rewards"
                    >
                      Exit All (Unstake + Harvest)
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">FARM DETAILS</span>
                <h3>Yield Architecture</h3>
              </div>
            </div>

            <div className="spec-item-list">
              <div className="spec-item">
                <span>Staking Token</span>
                <code>{stakeTokenAddress ? `${stakeTokenAddress.slice(0, 10)}...${stakeTokenAddress.slice(-6)}` : "—"}</code>
              </div>
              <div className="spec-item">
                <span>Reward Token</span>
                <code>{rewardTokenAddress ? `${rewardTokenAddress.slice(0, 10)}...${rewardTokenAddress.slice(-6)}` : "—"}</code>
              </div>
              <div className="spec-item">
                <span>Reward Calculation</span>
                <code>earned = (staked * timeElapsed * rewardRate) / totalStaked</code>
              </div>
              <div className="spec-item">
                <span>Lockup Period</span>
                <span className="status-pill verified">No Lockup · Instant Withdraw</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StakingPage;
