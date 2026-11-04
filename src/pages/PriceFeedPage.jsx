import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { PRICE_CONSUMER_ADDRESS } from "../config/addresses";
import { PRICE_CONSUMER_ABI } from "../config/abis";
import StatCard from "../components/StatCard";

// Known official Sepolia Chainlink ETH / USD Data Feed
const SEPOLIA_CHAINLINK_ETH_USD = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

const AGGREGATOR_V3_ABI = [
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() view returns (uint8)",
  "function description() view returns (string)",
];

export function PriceFeedPage({ walletConnected: _walletConnected, onConnect: _onConnect }) {
  const [consumerAddress, setConsumerAddress] = useState(
    PRICE_CONSUMER_ADDRESS || SEPOLIA_CHAINLINK_ETH_USD
  );

  // Oracle states
  const [ethPriceUsd, setEthPriceUsd] = useState("0.00");
  const [feedDecimals, setFeedDecimals] = useState(8);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [feedDescription, setFeedDescription] = useState("ETH / USD");
  const [isLoading, setIsLoading] = useState(false);

  // Gas fee calculator state
  const [txHashInput, setTxHashInput] = useState("");
  const [gasDetails, setGasDetails] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState("");

  const isConfigured = Boolean(consumerAddress && ethers.isAddress(consumerAddress));

  const loadPriceData = useCallback(async () => {
    if (!window.ethereum || !isConfigured) return;
    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Attempt reading using custom PriceConsumer ABI first, fallback to Chainlink AggregatorV3
      let priceInt = 0n;
      let dec = 8;
      let updated = 0n;
      let stale = false;

      try {
        const consumer = new ethers.Contract(consumerAddress, PRICE_CONSUMER_ABI, provider);
        const [p, d, u, s] = await Promise.all([
          consumer.getLatestPrice(),
          consumer.getDecimals().catch(() => 8),
          consumer.getLastUpdatedAt().catch(() => 0n),
          consumer.isPriceStale().catch(() => false),
        ]);
        priceInt = p;
        dec = Number(d);
        updated = u;
        stale = s;
      } catch {
        // Fallback to direct Chainlink AggregatorV3 interface
        const aggregator = new ethers.Contract(consumerAddress, AGGREGATOR_V3_ABI, provider);
        const [round, d, desc] = await Promise.all([
          aggregator.latestRoundData(),
          aggregator.decimals(),
          aggregator.description().catch(() => "ETH / USD"),
        ]);
        priceInt = round[1];
        updated = round[3];
        dec = Number(d);
        setFeedDescription(desc);

        // Check staleness (older than 3 hours)
        const ageSec = Math.floor(Date.now() / 1000) - Number(updated);
        stale = ageSec > 10800;
      }

      setFeedDecimals(dec);
      setIsStale(stale);
      setUpdatedAt(Number(updated));

      const formatted = ethers.formatUnits(priceInt, dec);
      setEthPriceUsd(parseFloat(formatted).toFixed(2));
    } catch (err) {
      console.error("Failed to load Chainlink price feed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [consumerAddress, isConfigured]);

  useEffect(() => {
    loadPriceData();
    const interval = setInterval(loadPriceData, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [loadPriceData]);

  // Gas Fee Lookup by Tx Hash
  const handleCalculateGas = async (e) => {
    e.preventDefault();
    setCalcError("");
    setGasDetails(null);

    const hash = txHashInput.trim();
    if (!hash || !hash.startsWith("0x") || hash.length !== 66) {
      setCalcError("Please enter a valid 66-character Ethereum transaction hash (0x...).");
      return;
    }

    try {
      setCalcLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const receipt = await provider.getTransactionReceipt(hash);

      if (!receipt) {
        setCalcError("Transaction receipt not found. Make sure you are connected to the network where it was mined.");
        return;
      }

      const gasUsed = receipt.gasUsed;
      const gasPrice = receipt.effectiveGasPrice || receipt.gasPrice || 0n;
      const feeWei = gasUsed * gasPrice;

      const feeEth = ethers.formatEther(feeWei);
      const currentEthRate = parseFloat(ethPriceUsd) || 0;
      const feeUsd = (parseFloat(feeEth) * currentEthRate).toFixed(4);

      setGasDetails({
        blockNumber: receipt.blockNumber,
        gasUsed: gasUsed.toString(),
        effectiveGasPriceGwei: ethers.formatUnits(gasPrice, "gwei"),
        feeEth,
        feeUsd,
        status: receipt.status === 1 ? "Success" : "Reverted",
      });
    } catch (err) {
      console.error("Error inspecting gas receipt:", err);
      setCalcError(err.message || "Failed to inspect transaction hash.");
    } finally {
      setCalcLoading(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "—";
    const sec = Math.floor(Date.now() / 1000) - timestamp;
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    return `${Math.floor(sec / 3600)}h ago`;
  };

  return (
    <div className="page-container pricefeed-page">
      <div className="page-header-row">
        <div>
          <h2>Experiment 7: Chainlink Decentralized Oracles</h2>
          <p>
            Real-time decentralized price feeds and gas expenditure calculator powered by Chainlink.
          </p>
        </div>
      </div>

      {isStale && (
        <div className="warning-notice-banner" style={{ borderColor: "#ef4444" }}>
          <span>⚠</span>
          <div>
            <strong>Oracle Heartbeat Warning: Stale Data Detected</strong>
            <p>
              The price feed update timestamp exceeds the standard heartbeat window. Prices may not reflect current spot market rates.
            </p>
          </div>
        </div>
      )}

      {/* STATS OVERVIEW */}
      <section className="stats-grid">
        <StatCard
          icon="◎"
          label={feedDescription}
          value={`$${ethPriceUsd}`}
          change={`Decimals: ${feedDecimals} · Chainlink Aggregator`}
          badge="Live Feed"
        />

        <StatCard
          icon="⏱"
          label="Last Oracle Update"
          value={getTimeAgo(updatedAt)}
          change={updatedAt ? new Date(updatedAt * 1000).toLocaleTimeString() : "—"}
        />

        <StatCard
          icon="🛡"
          label="Feed Health"
          value={isStale ? "Stale Feed" : "Healthy Heartbeat"}
          change="Automated round validation"
        />

        <StatCard
          icon="⛽"
          label="Est. Recycle Tx Gas"
          value={`~$${((0.00015) * (parseFloat(ethPriceUsd) || 0)).toFixed(3)}`}
          change="~120k gas @ 2 gwei"
          badge="E-WasteFi"
        />
      </section>

      <div className="main-grid">
        {/* GAS CALCULATOR */}
        <div className="card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">CHAINLINK POWERED</span>
              <h3>On-Chain Gas Fee Calculator</h3>
              <p>
                Enter any Sepolia transaction hash to calculate exact gas used, ETH fee, and USD equivalent.
              </p>
            </div>
            <span className="step-number">GAS</span>
          </div>

          <form onSubmit={handleCalculateGas}>
            <div className="input-group full">
              <label>Transaction Hash</label>
              <input
                type="text"
                placeholder="0x4d5a... (paste confirmed Sepolia txHash)"
                value={txHashInput}
                onChange={(e) => setTxHashInput(e.target.value)}
                required
              />
            </div>

            {calcError && <p className="validation-message">{calcError}</p>}

            <button type="submit" className="submit-button" disabled={calcLoading || !txHashInput}>
              {calcLoading ? "Fetching On-Chain Receipt..." : "Analyze Gas & USD Cost →"}
            </button>
          </form>

          {gasDetails && (
            <div className="gas-receipt-card" style={{ marginTop: "20px" }}>
              <h4>Transaction Gas Breakdown</h4>
              <div className="spec-item-list">
                <div className="spec-item">
                  <span>Execution Status</span>
                  <span className={`status-pill ${gasDetails.status === "Success" ? "verified" : "rejected"}`}>
                    {gasDetails.status}
                  </span>
                </div>
                <div className="spec-item">
                  <span>Block Number</span>
                  <strong>#{gasDetails.blockNumber}</strong>
                </div>
                <div className="spec-item">
                  <span>Gas Units Consumed</span>
                  <strong>{Number(gasDetails.gasUsed).toLocaleString()} units</strong>
                </div>
                <div className="spec-item">
                  <span>Effective Gas Price</span>
                  <strong>{parseFloat(gasDetails.effectiveGasPriceGwei).toFixed(3)} Gwei</strong>
                </div>
                <div className="spec-item">
                  <span>Network Fee (ETH)</span>
                  <code style={{ color: "var(--accent-color)" }}>{parseFloat(gasDetails.feeEth).toFixed(6)} ETH</code>
                </div>
                <div className="spec-item">
                  <span>Fiat Equivalent (USD)</span>
                  <strong style={{ fontSize: "1.1rem", color: "#4ade80" }}>${gasDetails.feeUsd} USD</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FEED CONFIGURATION */}
        <div className="card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">FEED TOPOLOGY</span>
              <h3>Chainlink Oracle Setup</h3>
            </div>
          </div>

          <div className="contract-config-form">
            <div className="input-group full">
              <label>Price Consumer / Aggregator Address</label>
              <input
                type="text"
                value={consumerAddress}
                onChange={(e) => setConsumerAddress(e.target.value.trim())}
              />
              <small>Default: Sepolia ETH/USD Aggregator (<code>{SEPOLIA_CHAINLINK_ETH_USD.slice(0, 12)}...</code>)</small>
            </div>

            <button
              className="view-button"
              style={{ alignSelf: "flex-start" }}
              onClick={loadPriceData}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "↻ Refresh Price Feed"}
            </button>
          </div>

          <div className="spec-item-list" style={{ marginTop: "20px" }}>
            <div className="spec-item">
              <span>Oracle Pair</span>
              <strong>ETH / USD</strong>
            </div>
            <div className="spec-item">
              <span>Network</span>
              <strong>Ethereum Sepolia</strong>
            </div>
            <div className="spec-item">
              <span>Heartbeat</span>
              <strong>3600 seconds (1 hour)</strong>
            </div>
            <div className="spec-item">
              <span>Deviation Threshold</span>
              <strong>0.5% trigger</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriceFeedPage;
