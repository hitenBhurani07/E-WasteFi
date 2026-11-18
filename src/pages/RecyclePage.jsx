import React, { useState } from "react";
import { REWARD_RATES } from "../services/registryService";
import TransactionStatus from "../components/TransactionStatus";
import EmptyState from "../components/EmptyState";
import { switchToSepolia, parseBlockchainError } from "../blockchain/wallet";

export function RecyclePage({
  walletConnected,
  isSepolia,
  isSupported = true,
  onSubmitEwaste,
  onConnect,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    category: "Mobile Phone",
    quantity: 1,
    weight: "",
    description: "",
  });

  const [txState, setTxState] = useState({
    status: "idle",
    txHash: null,
    error: null,
  });

  const selectedRate =
    REWARD_RATES.find((item) => item.name === formData.category)?.reward || 0;
  const estimatedReward = Number(formData.quantity) * selectedRate;

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategorySelect = (category) => {
    setFormData((prev) => ({ ...prev, category }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!walletConnected) {
      setTxState({
        status: "failed",
        error: "Please connect your wallet first.",
      });
      return;
    }

    if (!isSupported) {
      setTxState({
        status: "failed",
        error: "Please switch to a supported network (Sepolia, Ganache, or Localhost).",
      });
      return;
    }

    if (!formData.category || Number(formData.quantity) < 1) {
      setTxState({
        status: "failed",
        error: "Please select a category and specify a quantity of at least 1.",
      });
      return;
    }

    if (Number(formData.weight) <= 0) {
      setTxState({
        status: "failed",
        error: "Please enter a valid weight in kilograms (greater than 0).",
      });
      return;
    }

    try {
      setTxState({ status: "awaiting", txHash: null, error: null });

      const tx = await onSubmitEwaste({
        category: formData.category,
        quantity: formData.quantity,
        weight: formData.weight,
        description: formData.description,
      });

      setTxState({
        status: "confirming",
        txHash: tx.hash,
        error: null,
      });

      await tx.wait();

      setTxState({
        status: "confirmed",
        txHash: tx.hash,
        error: null,
      });

      // Reset form
      setFormData({
        category: "Mobile Phone",
        quantity: 1,
        weight: "",
        description: "",
      });
    } catch (err) {
      console.error("Submission failed:", err);
      const isReject =
        err.code === "ACTION_REJECTED" ||
        err.code === 4001 ||
        (err.message && err.message.toLowerCase().includes("rejected")) ||
        (err.message && err.message.toLowerCase().includes("denied"));
      setTxState({
        status: isReject ? "rejected" : "failed",
        txHash: null,
        error: isReject ? "Transaction was cancelled in wallet." : parseBlockchainError(err),
      });
    }
  };

  return (
    <div className="page-container recycle-page">
      <div className="page-header-row">
        <div>
          <h2>Submit E-Waste for Recycling</h2>
          <p>
            Log your discarded electronic devices into the EWasteRegistry smart contract.
            Authorized recyclers verify your deposit before releasing EWF reward tokens.
          </p>
        </div>
      </div>

      <TransactionStatus
        status={txState.status}
        txHash={txState.txHash}
        error={txState.error}
        actionName="E-Waste Submission"
        onDismiss={() => setTxState({ status: "idle", txHash: null, error: null })}
      />

      <div className="main-grid">
        {/* SUBMISSION FORM */}
        <div className="card submit-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">STEP 01</span>
              <h3>Deposit Details</h3>
              <p>Specify the category, item count, and measured weight.</p>
            </div>
            <div className="step-number">01</div>
          </div>

          {!walletConnected ? (
            <EmptyState
              icon="🔌"
              title="Connect Wallet to Submit"
              description="You need a Web3 wallet connected to Sepolia to submit electronic waste to the smart contract."
              actionText="Connect MetaMask"
              onAction={onConnect}
            />
          ) : !isSupported ? (
            <EmptyState
              icon="⚠"
              title="Unsupported Network"
              description="Please connect to Sepolia, Ganache (5777 / 1337), or a local testnet."
              actionText="Switch to Sepolia"
              onAction={() => switchToSepolia().catch(console.error)}
            />
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="input-group full">
                  <label>Select Category</label>
                  <div className="category-chips-grid">
                    {REWARD_RATES.map((item) => (
                      <button
                        type="button"
                        key={item.name}
                        className={`category-chip ${formData.category === item.name ? "selected" : ""}`}
                        onClick={() => handleCategorySelect(item.name)}
                      >
                        <span className="chip-icon">{item.icon}</span>
                        <span className="chip-name">{item.name}</span>
                        <span className="chip-reward">+{item.reward} EWF</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Quantity of Items</label>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    placeholder="e.g. 2"
                    value={formData.quantity}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Total Weight (kg)</label>
                  <div className="input-with-unit">
                    <input
                      name="weight"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.0"
                      value={formData.weight}
                      onChange={handleFormChange}
                      required
                    />
                    <span>KG</span>
                  </div>
                </div>

                <div className="input-group full">
                  <label>Notes / Serial Info (Optional)</label>
                  <textarea
                    name="description"
                    rows="3"
                    placeholder="Add details, brand, condition, or serial numbers..."
                    value={formData.description}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="estimated-reward">
                <div>
                  <span>ESTIMATED REWARD</span>
                  <strong>{estimatedReward} EWF</strong>
                </div>
                <small>
                  Rates: {selectedRate} EWF per item. Final credit minted by EWasteRewardVault after verification.
                </small>
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={isLoading || txState.status === "awaiting" || txState.status === "confirming"}
              >
                {txState.status === "awaiting"
                  ? "Check MetaMask..."
                  : txState.status === "confirming"
                  ? "Confirming on Sepolia..."
                  : "Submit to EWasteRegistry →"}
              </button>
            </form>
          )}
        </div>

        {/* INSTRUCTIONS / GUIDELINES */}
        <div className="card guide-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">RECYCLING GUIDELINES</span>
              <h3>How It Works</h3>
            </div>
            <div className="step-number">ℹ</div>
          </div>

          <div className="guide-steps">
            <div className="guide-step-item">
              <span className="guide-step-num">1</span>
              <div>
                <strong>On-Chain Submission</strong>
                <p>
                  Your submission records the category, item quantity, and weight (in grams) directly on the Sepolia smart contract.
                </p>
              </div>
            </div>

            <div className="guide-step-item">
              <span className="guide-step-num">2</span>
              <div>
                <strong>Physical Drop-Off & Verification</strong>
                <p>
                  Drop off your items at any registered e-waste collection center. An authorized recycler inspects the hardware and calls <code>verifySubmission()</code>.
                </p>
              </div>
            </div>

            <div className="guide-step-item">
              <span className="guide-step-num">3</span>
              <div>
                <strong>Reward Issuance</strong>
                <p>
                  The recycler calls <code>issueReward()</code> which triggers the <code>EWasteRewardVault</code> contract to credit EWF reward tokens directly to your address.
                </p>
              </div>
            </div>
          </div>

          <div className="contract-address-box">
            <span>REGISTRY CONTRACT</span>
            <code>0x7CC2B7Cd0cDfB3D29f562c6a63821A812CF1ccf2</code>
            <a
              href="https://sepolia.etherscan.io/address/0x7CC2B7Cd0cDfB3D29f562c6a63821A812CF1ccf2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              View on Etherscan ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecyclePage;
