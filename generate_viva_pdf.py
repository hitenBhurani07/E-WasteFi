import os
import subprocess

html_path = r"c:\Users\hiten\hiten_dapp\docs\E_WasteFi_Viva_Demo_Presentation_Guide.html"
pdf_path = r"c:\Users\hiten\hiten_dapp\E_WasteFi_Complete_Viva_and_Implementation_Guide.pdf"
img_base = r"c:\Users\hiten\hiten_dapp\docs\screenshots"

# Convert local file path to file:// uri for Chrome
def file_uri(filename):
    p = os.path.join(img_base, filename).replace("\\", "/")
    return f"file:///{p}"

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>E-WasteFi — Complete Implementation & Viva Demonstration Guide</title>
<style>
  @page {{
    size: A4;
    margin: 20mm 15mm 20mm 15mm;
  }}
  body {{
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 11pt;
    background-color: #ffffff;
  }}
  h1, h2, h3, h4 {{
    color: #0f172a;
    font-weight: 700;
    page-break-after: avoid;
  }}
  h1 {{
    font-size: 24pt;
    border-bottom: 3px solid #10b981;
    padding-bottom: 8px;
    margin-top: 0;
    color: #064e3b;
  }}
  h2 {{
    font-size: 16pt;
    border-left: 5px solid #10b981;
    padding-left: 10px;
    margin-top: 24pt;
    color: #065f46;
  }}
  h3 {{
    font-size: 13pt;
    margin-top: 14pt;
    color: #1e293b;
  }}
  p {{
    margin: 6pt 0;
  }}
  .cover-header {{
    text-align: center;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 20px;
    margin-bottom: 25px;
  }}
  .cover-title {{
    font-size: 26pt;
    font-weight: 800;
    color: #065f46;
    margin: 0;
  }}
  .cover-sub {{
    font-size: 14pt;
    color: #64748b;
    margin-top: 5px;
  }}
  .authors-card {{
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 12px 20px;
    margin: 15px auto;
    max-width: 500px;
    text-align: center;
  }}
  .script-box {{
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-left: 5px solid #3b82f6;
    border-radius: 6px;
    padding: 12px 16px;
    margin: 10px 0;
    font-style: normal;
  }}
  .script-speaker {{
    font-weight: 700;
    color: #1d4ed8;
    text-transform: uppercase;
    font-size: 9pt;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }}
  .action-box {{
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-left: 5px solid #10b981;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 10px 0;
    font-weight: 600;
    color: #065f46;
  }}
  .qna-box {{
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    padding: 12px 16px;
    margin: 12px 0;
  }}
  .qna-q {{
    font-weight: 700;
    color: #92400e;
    margin-bottom: 4px;
  }}
  .qna-a {{
    color: #78350f;
  }}
  .screenshot-container {{
    text-align: center;
    margin: 15px 0;
    page-break-inside: avoid;
  }}
  .screenshot-img {{
    max-width: 95%;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }}
  .screenshot-caption {{
    font-size: 9pt;
    color: #64748b;
    margin-top: 6px;
    font-style: italic;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 10pt;
  }}
  th, td {{
    border: 1px solid #cbd5e1;
    padding: 8px 10px;
    text-align: left;
  }}
  th {{
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 600;
  }}
  code {{
    background: #f1f5f9;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 4px;
    font-family: Consolas, monospace;
    font-size: 9.5pt;
  }}
  .page-break {{
    page-break-before: always;
  }}
</style>
</head>
<body>

<div class="cover-header">
  <div class="cover-title">♻️ E-WasteFi</div>
  <div class="cover-sub">Decentralized Electronic-Waste Recycling & Rewards Protocol</div>
  <div style="font-size: 12pt; color: #047857; margin-top: 8px; font-weight: 600;">Complete Step-by-Step Viva Voce & Practical Demonstration Script</div>
  
  <div class="authors-card">
    <strong>Project Authors & Presenters:</strong><br>
    <strong>Hiten Bhurani</strong> &nbsp;|&nbsp; <strong>Dhrijesh Bhusara</strong><br>
    <span style="color: #64748b; font-size: 9.5pt;">Department of Computer Engineering / Information Technology — Academic Year 2026</span>
  </div>
</div>

<h2>Table of Contents</h2>
<ol>
  <li><strong>Introduction & Executive Overview</strong> (Spoken opening for presentation)</li>
  <li><strong>System Architecture & Role-Based Separation</strong></li>
  <li><strong>Experiment 1: E-Waste Lifecycle (Submission, Verification & Reward Issuance)</strong></li>
  <li><strong>Experiment 2: Multi-Wallet & Account Switching Demonstration</strong></li>
  <li><strong>Experiment 3: ERC-4626 Tokenized Yield Vault (EWVS & EWAT)</strong></li>
  <li><strong>Experiment 4: Automated Market Maker (AMM) Liquidity Pool (x · y = k)</strong></li>
  <li><strong>Experiment 5: DeFi Continuous Yield Farming & Staking Protocol</strong></li>
  <li><strong>Experiment 6: Full Uniswap V2 Decentralized Exchange (DEX Architecture)</strong></li>
  <li><strong>Experiment 7: Chainlink Decentralized Oracles & Gas-to-USD Translation</strong></li>
  <li><strong>Automated Test Suite & Code Quality Audit (41 Passing Tests)</strong></li>
  <li><strong>Frequently Asked Viva Voce Questions & Definitive Answers</strong></li>
</ol>

<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">

<h2>1. Introduction & Executive Overview (Opening Script)</h2>
<p>When you stand before your teacher ("Mam"), follow this exact opening sequence. Speak confidently, maintain eye contact, and introduce the problem clearly.</p>

<div class="script-box">
  <div class="script-speaker">Spoken Script — Presenter 1 (Hiten):</div>
  "Good morning, Ma'am! Today, Dhrijesh and I are excited to present our project: <strong>E-WasteFi</strong> — a Decentralized Electronic-Waste Recycling and Incentive Protocol built on Ethereum.<br><br>
  Electronic waste is the world's fastest-growing municipal waste stream, generating over 53 million tons annually. Traditional e-waste recycling schemes suffer from three core vulnerabilities:
  First, centralized recycling centers have zero transparent audit trails — submitted weights can be altered.
  Second, citizens lack guaranteed economic incentives to recycle responsibly.
  Third, existing digital records are siloed in centralized databases prone to tampering.<br><br>
  With E-WasteFi, we have eliminated intermediaries by deploying deterministic Solidity smart contracts on the blockchain. Every single e-waste item is minted as an immutable on-chain record, authenticated through role-based cryptographic verification, and automatically rewarded with token credits. Furthermore, we have expanded this platform into a full decentralized finance (DeFi) ecosystem covering tokenized ERC-4626 vaults, constant-product AMM liquidity pools, algorithmic yield farming, a complete Uniswap V2 DEX, and Chainlink oracle integration."
</div>

<div class="screenshot-container">
  <img src="{file_uri('dashboard.png')}" class="screenshot-img" alt="Dashboard">
  <div class="screenshot-caption">Figure 1: E-WasteFi Main Decentralized Hub — Real-time Eco Score, On-Chain Metrics, and Network Telemetry</div>
</div>

<div class="page-break"></div>

<h2>2. System Architecture & Role Separation</h2>

<div class="script-box">
  <div class="script-speaker">Spoken Script — Presenter 2 (Dhrijesh):</div>
  "Ma'am, to ensure bank-grade security and prevent single points of failure, we followed the architectural principle of <em>Separation of Concerns</em>. We split our core architecture into two distinct contracts:
  <ol>
    <li><code>EWasteRegistry.sol</code>: This serves as the state machine and logic controller. It manages item categories, weights, submission IDs, and authorized recycler addresses.</li>
    <li><code>EWasteRewardVault.sol</code>: This contract holds the reward balances. Crucially, it implements strict access control via the <code>onlyRegistry</code> modifier — meaning not even the deployer can mint rewards arbitrarily; rewards can only be credited if the approved Registry triggers it after successful physical verification!</li>
  </ol>
  This prevents any unauthorized inflation or duplicate reward issuance."
</div>

<table>
  <thead>
    <tr>
      <th>Layer</th>
      <th>Component</th>
      <th>Key Responsibility</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Frontend Layer</strong></td>
      <td>React 19 + Vite 8 + Ethers.js v6</td>
      <td>Reactive multi-page interface, real-time balance polling, transaction confirmation tracker.</td>
    </tr>
    <tr>
      <td><strong>Identity Layer</strong></td>
      <td>MetaMask & WalletConnect (EIP-2255)</td>
      <td>Key management, cryptographic signing, multi-account permissions, network switching.</td>
    </tr>
    <tr>
      <td><strong>State Controller</strong></td>
      <td><code>EWasteRegistry.sol</code></td>
      <td>Submission indexing, category reward calculation, lifecycle state transitions.</td>
    </tr>
    <tr>
      <td><strong>Reward Custody</strong></td>
      <td><code>EWasteRewardVault.sol</code></td>
      <td>Isolated reward ledger, authorized balance crediting, replay attack prevention.</td>
    </tr>
    <tr>
      <td><strong>DeFi Stack</strong></td>
      <td>ERC-4626, AMM, Farm, DEX</td>
      <td>Tokenized environmental vault shares, constant product swaps, continuous staking.</td>
    </tr>
    <tr>
      <td><strong>Oracle Layer</strong></td>
      <td>Chainlink AggregatorV3</td>
      <td>Decentralized ETH/USD price feeds with staleness, freshness, and sanity checks.</td>
    </tr>
  </tbody>
</table>

<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">

<h2>3. Experiment 1: E-Waste Lifecycle (Submission & Verification)</h2>

<div class="action-box">
  🖥️ <strong>Live Demonstration Step 1:</strong><br>
  1. Click on the <strong>"Recycle"</strong> tab in the sidebar.<br>
  2. Select <strong>"Laptop"</strong> or <strong>"Mobile Phone"</strong>.<br>
  3. Enter Quantity: <code>2</code> and Weight: <code>3.5 KG</code>.<br>
  4. Point out the live estimated reward: <code>2 × 50 = 100 EWF</code>.<br>
  5. Click <strong>"Submit for Verification"</strong> and sign the MetaMask prompt.
</div>

<div class="script-box">
  <div class="script-speaker">Spoken Script — Presenter 1 (Hiten):</div>
  "Now, Ma'am, let us demonstrate the complete electronic-waste lifecycle live on the blockchain.<br>
  I am currently connected as a standard user. On the Recycle page, I select 'Laptop' and enter a quantity of 2. Notice that the frontend dynamically computes the reward based on our contract's category coefficient table: Laptops earn 50 EWF each, so 2 laptops yield an estimated 100 EWF.<br>
  When I click 'Submit for Verification', our frontend dispatches a transaction to <code>submitEwaste('Laptop', 2, 3500)</code> on the blockchain. Notice our transaction tracker: it displays 'Awaiting Signature', then 'Mining', and finally 'Confirmed' only after <code>tx.wait(1)</code> receives a valid block receipt.<br>
  If we inspect the record on-chain, its status is strictly <code>Pending (0)</code>. At this stage, zero rewards have been credited, eliminating fake claims."
</div>

<div class="screenshot-container">
  <img src="{file_uri('recycle.png')}" class="screenshot-img" alt="Recycle Form">
  <div class="screenshot-caption">Figure 2: Experiment 1 — On-Chain E-Waste Submission Portal with Category Chip Matrix & Live Calculator</div>
</div>

<div class="page-break"></div>

<div class="action-box">
  🖥️ <strong>Live Demonstration Step 2:</strong><br>
  1. Switch to the Recycler Account (or show the Recycler Portal tab).<br>
  2. Navigate to <strong>"Recycler Portal"</strong> in the sidebar.<br>
  3. Point out the newly created submission with status <strong>Pending</strong>.<br>
  4. Click the <strong>"Verify"</strong> button and confirm in MetaMask.<br>
  5. Point out the status change to <strong>Verified</strong>, then click <strong>"Issue Reward"</strong>.<br>
  6. Switch to the <strong>"Rewards"</strong> tab and show the updated vault balance!
</div>

<div class="script-box">
  <div class="script-speaker">Spoken Script — Presenter 2 (Dhrijesh):</div>
  "Now, Ma'am, let us switch roles to an authorized industrial recycler. Only accounts where <code>recyclers[account] == true</code> have permission to access these verification functions.<br>
  In the Recycler Portal, we see the user's pending submission. The recycler inspects the physical device and clicks 'Verify'. This triggers <code>verifySubmission(submissionId)</code>, which records the verification timestamp and updates the status to <code>Verified (1)</code>.<br>
  Next, the recycler clicks 'Issue Reward'. This executes <code>issueReward(submissionId)</code>, which performs three defensive checks:
  1. The submission must be Verified.
  2. <code>rewardIssued</code> must be false.
  3. The reward vault must be set.<br>
  The contract marks <code>rewardIssued = true</code> and calls <code>creditReward(user, reward)</code> on the vault. If anyone attempts to call <code>issueReward()</code> a second time, the transaction reverts immediately with our custom error <code>RewardAlreadyIssued()</code>, completely preventing double-spend attacks!"
</div>

<div class="screenshot-container">
  <img src="{file_uri('recycler-portal.png')}" class="screenshot-img" alt="Recycler Portal">
  <div class="screenshot-caption">Figure 3: Experiment 1 — Authorized Recycler Verification Queue with On-Chain Role Guards</div>
</div>

<div class="screenshot-container">
  <img src="{file_uri('rewards.png')}" class="screenshot-img" alt="Rewards Page">
  <div class="screenshot-caption">Figure 4: Experiment 1 — Real-time Vault Reward Balance and Immutable Distribution History</div>
</div>

<div class="page-break"></div>

<h2>4. Experiment 2: Multi-Wallet & Account Switching</h2>

<div class="action-box">
  🖥️ <strong>Live Demonstration Step 3:</strong><br>
  1. Point to the top-right corner of the topbar.<br>
  2. Click the <strong>"⇄ Switch Acc"</strong> button.<br>
  3. Point out how MetaMask automatically opens its native account selection dialog.<br>
  4. Select a different account (e.g. Account 2). Show how the role badge and submissions update instantly without page reload!
</div>

<div class="script-box">
  <div class="script-speaker">Spoken Script — Presenter 1 (Hiten):</div>
  "Ma'am, in Experiment 2 we addressed a major real-world Web3 usability challenge: account switching.<br>
  Normally, in decentralized applications, clicking 'Connect Wallet' when already connected does nothing because the browser cache merely re-reads the default account.<br>
  To solve this, we implemented the <strong>EIP-2255 (Wallet Permissions)</strong> specification using <code>wallet_requestPermissions</code>. When I click our '⇄ Switch Acc' button, our application sends a permission request that directly prompts MetaMask's native account switcher dialog!<br>
  Furthermore, our application registers reactive EIP-1193 event listeners for <code>accountsChanged</code> and <code>chainChanged</code>. When I pick another account, the DApp automatically recalculates the user's role (switching between User and Recycler) and refreshes their on-chain ledger with zero manual page reloads."
</div>

<div class="screenshot-container">
  <img src="{file_uri('activity.png')}" class="screenshot-img" alt="Activity Log">
  <div class="screenshot-caption">Figure 5: Experiment 2 — User Personal Submissions Audit Trail with Status Filters & Network Badges</div>
</div>

<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">

<h2>5. Experiment 3: ERC-4626 Tokenized Yield Vault</h2>

<div class="action-box">
  🖥️ <strong>Live Demonstration Step 4:</strong><br>
  1. In the sidebar, click on <strong>"Vault (ERC-4626)"</strong>.<br>
  2. Show the Asset Token (<code>EWAT</code>) balance vs the Vault Share (<code>EWVS</code>) balance.<br>
  3. Enter an amount to Deposit (e.g., <code>50 EWAT</code>).<br>
  4. Show the mathematical preview: <code>50 EWAT → 50 EWVS</code>.<br>
  5. Explain the administrative <strong>Recycling Impact Tracking</strong>.
</div>

<div class="script-box">
  <div class="script-speaker">Spoken Script — Presenter 2 (Dhrijesh):</div>
  "In Experiment 3, we implemented the gold standard of DeFi yield vaults: <strong>ERC-4626</strong>.<br>
  Instead of building a non-standard staking contract, ERC-4626 provides a formal interface for yield-bearing vaults. Here, users deposit an underlying ERC-20 token called <code>EWasteAssetToken (EWAT)</code> and receive tokenized vault shares called <code>EWasteFiVault Shares (EWVS)</code>.<br>
  The mathematical core computes share allocation via:
  <div style='text-align: center; margin: 8px 0; font-family: Consolas;'>shares = (assets × totalSupply) / totalAssets()</div>
  Our contract implements all standard methods: <code>deposit()</code>, <code>mint()</code>, <code>withdraw()</code>, <code>redeem()</code>, along with view previews <code>previewDeposit()</code> and <code>previewRedeem()</code>.<br>
  Critically, Ma'am, we added a unique environmental extension: <code>recordRecyclingImpact(user, amountKg)</code>. This allows certified recyclers to record physical kilograms recycled as on-chain environmental impact, while keeping physical metrics completely separate from financial share pricing, preventing any artificial asset dilution!"
</div>

<div class="screenshot-container">
  <img src="{file_uri('vault.png')}" class="screenshot-img" alt="ERC-4626 Vault">
  <div class="screenshot-caption">Figure 6: Experiment 3 — ERC-4626 Tokenized Vault Interface with Asset/Share Conversions and Impact Tracker</div>
</div>

<div class="page-break"></div>

<h2>6. Experiment 4: Automated Market Maker (AMM) Liquidity Pool</h2>

<div class="action-box">
  🖥️ <strong>Live Demonstration Step 5:</strong><br>
  1. In the sidebar, click on <strong>"Liquidity Pool"</strong>.<br>
  2. Show the pool reserves of Token 0 (<code>EWT</code>) and Token 1 (<code>EWR</code>).<br>
  3. Enter <code>10 EWT</code> into the swap calculator.<br>
  4. Point out the expected output and the <strong>0.3% protocol fee</strong> deduction.<br>
  5. Execute the swap and show the updated pool reserves!
</div>

<div class="script-box">
  <div class="script-speaker">Spoken Script — Presenter 1 (Hiten):</div>
  "Ma'am, in Experiment 4 we designed and built an Automated Market Maker (AMM) liquidity pool from scratch using the <strong>Constant-Product Formula ($x \cdot y = k$)</strong>.<br>
  Traditional order-book exchanges require matching buyers with sellers. In decentralized recycling, liquidity must be automated. Our <code>EWasteAMM.sol</code> holds reserves of E-Waste Tokens (EWT) and E-Waste Reward Tokens (EWR).<br>
  When a user swaps tokens, our contract applies an exact 0.3% protocol fee (30 basis points) using the formula:
  <div style='text-align: center; margin: 8px 0; font-family: Consolas;'>amountOut = (amountIn × 997 × reserveOut) / (reserveIn × 1000 + amountIn × 997)</div>
  Liquidity providers deposit both tokens in equal proportion and receive internal LP shares calculated as the geometric mean: $\sqrt{{amount_0 \times amount_1}}$. The accumulated 0.3% fees remain in the pool, ensuring the invariant $k$ grows over time to reward liquidity providers!"
</div>

<div class="screenshot-container">
  <img src="{file_uri('liquidity-pool.png')}" class="screenshot-img" alt="Liquidity Pool">
  <div class="screenshot-caption">Figure 7: Experiment 4 — Constant-Product ($x \times y = k$) AMM Pool with Real-Time Reserves and 0.3% Fee Math</div>
</div>

<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">

<h2>7. Experiment 5: DeFi Yield Farming & Staking Protocol</h2>

<div class="action-box">
  🖥️ <strong>Live Demonstration Step 6:</strong><br>
  1. In the sidebar, click on <strong>"Staking / Farm"</strong>.<br>
  2. Point out the Staking Token (<code>EWR</code>) and Reward Token (<code>RWR</code>).<br>
  3. Enter an amount of EWR to stake (e.g., <code>100 EWR</code>) and click <strong>"Stake Tokens"</strong>.<br>
  4. Wait a few seconds: point out how the <strong>"Pending Rewards"</strong> counter increments in real time!<br>
  5. Click <strong>"Harvest Rewards"</strong> to claim accrued RWR tokens.
</div>

<div class="script-box">
  <div class="script-speaker">Spoken Script — Presenter 2 (Dhrijesh):</div>
  "In Experiment 5, we simulated DeFi yield farming and continuous staking.<br>
  Here, recyclers stake their recycling credits (<code>EWRToken</code>) into <code>SimpleYieldFarm.sol</code> to earn ongoing governance rewards in <code>RWRToken</code> (Recycling Worker Reward).<br>
  Instead of using expensive loops that would consume excessive gas, our contract implements the gas-efficient <strong>Synthetix $O(1)$ algorithm</strong>. Rewards accrue continuously per-second across all stakers:
  <div style='text-align: center; margin: 8px 0; font-family: Consolas;'>rewardPerTokenStored += (rewardRate × elapsed × 10¹⁸) / totalStaked</div>
  Users can stake, unstake partially, harvest rewards, or execute a single-transaction <code>exit()</code>. Furthermore, the contract strictly verifies that distributed rewards never exceed the funded reward pool balance, ensuring guaranteed mathematical solvency!"
</div>

<div class="screenshot-container">
  <img src="{file_uri('staking.png')}" class="screenshot-img" alt="Staking and Farming">
  <div class="screenshot-caption">Figure 8: Experiment 5 — Algorithmic Staking Interface with Per-Second Dynamic Reward Accrual and Solvency Guards</div>
</div>

<div class="page-break"></div>

<h2>8. Experiment 6: Full Uniswap V2 DEX Architecture</h2>

<div class="action-box">
  🖥️ <strong>Live Demonstration Step 7:</strong><br>
  1. In the sidebar, click on <strong>"DEX / Swap"</strong>.<br>
  2. Point out the three architectural tiers: Factory, Pair, and Router.<br>
  3. Show the slippage tolerance setting (e.g. <code>0.5%</code>) and deadline validation.<br>
  4. Perform a swap of <code>EWASTE</code> for <code>EREWARD</code>.<br>
  5. Point out how the Router verifies minimum output (<code>amountOutMin</code>) before executing!
</div>

<div class="script-box">
  <div class="script-speaker">Spoken Script — Presenter 1 (Hiten):</div>
  "In Experiment 6, we stepped beyond a single liquidity pool and engineered a full-scale Decentralized Exchange following the production <strong>Uniswap V2 architecture</strong>.<br>
  Our exchange is partitioned into three specialized contracts:
  <ol>
    <li><code>EWasteFactory.sol</code>: Manages the deployment of canonical token pairs. It sorts token addresses ($token0 < token1$) to guarantee a single canonical pair per token combination and prevents duplicate pair creation.</li>
    <li><code>EWastePair.sol</code>: Manages the underlying liquidity pool. During the very first deposit, it permanently locks <code>1,000 LP tokens</code> to <code>address(1)</code>, which mathematically prevents liquidity manipulation and share-inflation attacks.</li>
    <li><code>EWasteRouter.sol</code>: The user-facing routing contract. It orchestrates <code>addLiquidity()</code>, <code>removeLiquidity()</code>, and <code>swapExactTokensForTokens()</code> while enforcing slippage protection through <code>amountOutMin</code> and front-running protection through transaction <code>deadline</code> parameters."
  </ol>
</div>

<div class="screenshot-container">
  <img src="{file_uri('dex.png')}" class="screenshot-img" alt="DEX Swap">
  <div class="screenshot-caption">Figure 9: Experiment 6 — Uniswap V2 Decentralized Exchange with Slippage Protection & Multi-Hop Routing</div>
</div>

<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">

<h2>9. Experiment 7: Chainlink Price Feed & Gas Calculator</h2>

<div class="action-box">
  🖥️ <strong>Live Demonstration Step 8:</strong><br>
  1. In the sidebar, click on <strong>"Price Feed"</strong>.<br>
  2. Point out the live Chainlink ETH/USD oracle price (e.g. <code>$2,650.00</code>).<br>
  3. Show the Oracle Heartbeat status and feed decimals (<code>8 decimals</code>).<br>
  4. Paste any transaction hash from your submissions into the <strong>"Gas Fee USD Converter"</strong>.<br>
  5. Show how the exact gas used in wei is translated into real-world USD!
</div>

<div class="script-box">
  <div class="script-speaker">Spoken Script — Presenter 2 (Dhrijesh):</div>
  "Finally, in Experiment 7, we integrated decentralized <strong>Chainlink Price Oracles</strong>.<br>
  Smart contracts cannot access external Web APIs directly due to the blockchain consensus model. To solve this, our contract binds to Chainlink's <code>AggregatorV3Interface</code> connected to the Sepolia ETH/USD aggregator.<br>
  However, naive oracle integration is dangerous. In our contract <code>SafeEWastePriceConsumer.sol</code>, we implemented four defensive validation layers:
  <ol>
    <li><strong>Positive Price Check:</strong> Reverts if the oracle returns a price $\le 0$.</li>
    <li><strong>Uninitialized Round Check:</strong> Verifies that <code>updatedAt != 0</code>.</li>
    <li><strong>Future Timestamp Check:</strong> Reverts if the timestamp is greater than <code>block.timestamp</code>.</li>
    <li><strong>Staleness Check:</strong> Reverts if the price age exceeds our configurable <code>maxPriceAge</code> (e.g., 3600 seconds).</li>
  </ol>
  Using this validated price, our application calculates the true fiat USD cost of every recycling transaction:
  <div style='text-align: center; margin: 8px 0; font-family: Consolas;'>Fee(USD) = (gasUsed × effectiveGasPrice × Price_ETH_USD) / (10¹⁸ × 10⁸)</div>
  This provides complete cost transparency for recyclers and industrial auditors!"
</div>

<div class="screenshot-container">
  <img src="{file_uri('price-feed.png')}" class="screenshot-img" alt="Price Feed">
  <div class="screenshot-caption">Figure 10: Experiment 7 — Chainlink Price Consumer with Heartbeat Monitor and Gas-to-USD Translation</div>
</div>

<div class="page-break"></div>

<h2>10. Automated Test Suite & Code Quality Audit</h2>

<p>When presenting to the examiner, show the terminal and run the test suite live to prove code correctness:</p>

<div class="action-box">
  🖥️ <strong>Terminal Command:</strong> <code>npm run test</code>
</div>

<pre style="background: #0f172a; color: #38bdf8; padding: 14px; border-radius: 6px; font-size: 8.5pt; overflow-x: auto;">
  Experiment 1: EWasteRegistry and EWasteRewardVault
    Deployment & Configuration
      ✔ sets deployer as owner (54ms)
      ✔ links registry and vault correctly
    Recycler Management
      ✔ allows owner to add and remove a recycler
      ✔ prevents non-owners from adding recyclers
    Submissions & Rewards
      ✔ allows users to submit e-waste and calculates rewards accurately
      ✔ rejects invalid submission inputs
      ✔ handles full lifecycle: submit -> verify -> issue reward
      ✔ allows recycler to reject a submission

  Experiment 3: EWasteFiVault (ERC-4626)
    Initialization & Metadata
      ✔ has correct vault name, symbol and asset
      ✔ sets deployer as owner
    ERC-4626 Deposit & Redeem Lifecycle
      ✔ allows users to deposit assets and receive shares
      ✔ allows users to redeem shares for assets
    Recycling Impact Tracking
      ✔ allows owner to record recycling impact
      ✔ prevents non-owners from recording impact
      ✔ reverts on zero address user

  Experiment 4: EWasteAMM (Constant Product AMM)
    Deployment
      ✔ initializes tokens and zero reserves
    Liquidity Provision
      ✔ allows provider to add initial liquidity
      ✔ allows removing liquidity proportionally
    Swapping & 0.3% Fee
      ✔ swaps token0 for token1 with 0.3% fee applied
      ✔ swaps token1 for token0 with 0.3% fee applied
      ✔ reverts swap if input amount is zero

  Experiment 5: SimpleYieldFarm
    Deployment & Configuration
      ✔ sets correct tokens and reward rate
      ✔ allows owner to update reward rate
    Staking & Harvesting Flow
      ✔ allows user to stake tokens
      ✔ accrues rewards over time and allows harvesting
      ✔ allows user to unstake tokens
      ✔ does not distribute more than available funded rewards

  Experiment 6: EWaste DEX (Factory, Pair, Router)
    Factory
      ✔ creates a new pair and records it
      ✔ reverts on duplicate pair creation
    Router: Liquidity Management
      ✔ adds initial liquidity, locks minimum liquidity to address(1)
      ✔ removes liquidity through router
    Router: Swapping
      ✔ executes swapExactTokensForTokens correctly
      ✔ reverts if slippage exceeds amountOutMin

  Experiment 7: Chainlink Price Feed & Consumers
    MockPriceFeed & Basic Consumer
      ✔ reports correct decimals and initial price
      ✔ updates price when setAnswer is called
    SafeEWastePriceConsumer Validations
      ✔ returns price when feed is valid and fresh
      ✔ reverts on non-positive price
      ✔ reverts on stale price exceeding maxAge
      ✔ reverts on future price timestamp
      ✔ reverts on incomplete round (updatedAt == 0)
      ✔ allows owner to update maxAge

  41 passing (1s)
</pre>

<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">

<h2>11. Frequently Asked Viva Voce Questions & Answers</h2>

<div class="qna-box">
  <div class="qna-q">Q1: Why did you separate EWasteRegistry and EWasteRewardVault instead of writing one single contract?</div>
  <div class="qna-a"><strong>Answer:</strong> "Separation of Concerns. If business logic or submission categories need updating in the future, the submission registry can be upgraded without risking user funds or altering the reward balance ledger. Furthermore, by restricting reward crediting strictly to the registry via the <code>onlyRegistry</code> modifier, we eliminate unauthorized token minting."</div>
</div>

<div class="qna-box">
  <div class="qna-q">Q2: In Experiment 6, why does EWastePair burn the first 1,000 LP tokens to address(1)?</div>
  <div class="qna-a"><strong>Answer:</strong> "This mitigates the well-known <em>ERC-20 Inflation Attack</em> (also known as the first-depositor attack). If an attacker deposits 1 wei and immediately donates large assets, they could inflate the share price and round subsequent depositors down to zero shares. Permanently locking 1,000 minimum liquidity to <code>address(1)</code> ensures the pool's denominator can never be reduced to zero or easily manipulated."</div>
</div>

<div class="qna-box">
  <div class="qna-q">Q3: Why can't smart contracts fetch live prices directly from a web API like CoinGecko?</div>
  <div class="qna-a"><strong>Answer:</strong> "Because blockchains are deterministic state machines. Every node in the network must execute the same transaction and achieve the exact same state. Web APIs return different values at different milliseconds and can experience downtime. Chainlink solves this through a Decentralized Oracle Network (DON) where independent nodes aggregate data off-chain and commit a single cryptographically verified answer on-chain."</div>
</div>

<div class="qna-box">
  <div class="qna-q">Q4: How does your frontend know if a connected user is a Recycler or a regular User?</div>
  <div class="qna-a"><strong>Answer:</strong> "Whenever MetaMask connects or changes accounts, our app queries the contract: <code>await registry.recyclers(account)</code>. If true, the role state is set to 'Recycler', unlocking the verification queue. If false, it defaults to 'User' mode, hiding verification controls to prevent unauthorized access."</div>
</div>

<div class="qna-box">
  <div class="qna-q">Q5: How do you prevent reentrancy attacks in your AMM and Staking contracts?</div>
  <div class="qna-a"><strong>Answer:</strong> "We use OpenZeppelin's <code>ReentrancyGuard</code> with the <code>nonReentrant</code> modifier on all state-mutating liquidity and withdrawal functions, and we strictly follow the <em>Checks-Effects-Interactions</em> pattern: internal balances are decremented before external token transfers take place."</div>
</div>

<div style="margin-top: 30px; text-align: center; border-top: 2px solid #e2e8f0; padding-top: 15px;">
  <strong style="color: #065f46;">Conclusion Statement to Mam:</strong><br>
  <em>"In conclusion, Ma'am, E-WasteFi successfully demonstrates the complete progression of Web3 decentralized applications: from immutable real-world asset tracking and role authorization to advanced decentralized finance primitives and off-chain oracle integration. All 41 automated tests are passing, and the application is live and operational. Thank you!"</em>
</div>

</body>
</html>
"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML presentation guide generated: {html_path} ({len(html_content)} bytes)")

# Compile to PDF using Chrome headless
chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
temp_dir = r"c:\Users\hiten\AppData\Local\Temp\chrome_temp"

cmd = [
    chrome_exe,
    "--headless=new",
    f"--user-data-dir={temp_dir}",
    f"--print-to-pdf={pdf_path}",
    "--no-pdf-header-footer",
    html_path
]

print("Compiling HTML to PDF via Chrome headless...")
res = subprocess.run(cmd, capture_output=True, text=True)
if os.path.exists(pdf_path):
    size = os.path.getsize(pdf_path)
    print(f"[OK] PDF generated successfully: {pdf_path} ({size} bytes)")
else:
    print(f"PDF generation failed: {res.stderr}")

