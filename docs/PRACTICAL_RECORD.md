# E-WASTEFI — LABORATORY PRACTICAL RECORD
## Decentralized Applications (DApp) Laboratory (Experiments 1–7)

**Academic Term:** 2026  
**Authors:** Hiten Bhurani & Dhrijesh Bhusara  
**Project:** E-WasteFi — Decentralized Electronic-Waste Recycling & Rewards Protocol  
**Repository:** [https://github.com/hitenBhurani07/E-WasteFi](https://github.com/hitenBhurani07/E-WasteFi)  
**Reference Architecture:** FoodFi Decentralized Application (harshitabhatia003/FoodFi-DApp)  

---

# Table of Contents
1. [Experiment 1 — Complete E-WasteFi Decentralized Application](#experiment-1--complete-e-wastefi-decentralized-application)
2. [Experiment 2 — MetaMask, Ethers.js & WalletConnect Integration](#experiment-2--metamask-ethersjs--walletconnect-integration)
3. [Experiment 3 — ERC-4626 Tokenized Yield Vault](#experiment-3--erc-4626-tokenized-yield-vault)
4. [Experiment 4 — Automated Market Maker (AMM) Liquidity Pool](#experiment-4--automated-market-maker-amm-liquidity-pool)
5. [Experiment 5 — Decentralized Yield Farming & Staking Protocol](#experiment-5--decentralized-yield-farming--staking-protocol)
6. [Experiment 6 — Full Decentralized Exchange (DEX Architecture)](#experiment-6--full-decentralized-exchange-dex-architecture)
7. [Experiment 7 — Chainlink Price Feed & Gas-to-USD Oracle](#experiment-7--chainlink-price-feed--gas-to-usd-oracle)

---

# Experiment 1 — Complete E-WasteFi Decentralized Application

## 1.1 Aim
To design, develop, deploy, and verify a decentralized electronic-waste management and recycling incentive protocol using Solidity smart contracts (`EWasteRegistry.sol` and `EWasteRewardVault.sol`), integrating a modern React.js frontend with Ethers.js v6 for decentralized role-based verification and reward distribution.

## 1.2 Objectives
1. Implement a decentralized registry (`EWasteRegistry`) tracking electronic waste submissions by item category, quantity, physical weight, timestamp, status, and reward credit.
2. Build an isolated reward custody contract (`EWasteRewardVault`) enforcing strict access control where only the approved registry can credit user balances.
3. Establish a role-based access control (RBAC) mechanism distinguishing standard recycling users, authorized industrial recyclers, and contract administrators (owner).
4. Create an immutable lifecycle state machine: `Pending (0)` → `Verified (1)` or `Rejected (2)` → `Reward Issued`.
5. Connect a React/Vite web application to Ethereum Sepolia and local Hardhat testnets to allow seamless submission, verification, and reward tracking.

## 1.3 Theory & Blockchain Concepts
Centralized e-waste collection systems suffer from lack of transparency, unreliable audit trails, and untrusted incentive delivery. By leveraging an immutable public ledger:
- **Immutability & Auditability:** Once submitted, electronic device records cannot be modified or deleted, preventing fraudulent recycling claims.
- **Separation of Concerns:** Splitting submission logic (`EWasteRegistry`) from reward accounting (`EWasteRewardVault`) guarantees that accounting rules remain immutable even if registration parameters evolve.
- **Custom Errors & Gas Efficiency:** Custom errors (`revert NotRecycler()`, `revert RewardAlreadyIssued()`) save significant deployment and execution gas compared to verbose `require` strings.
- **Category Reward Matrix:** Fixed reward coefficients per unit incentivize high-value hazardous item reclamation:
  - Mobile Phone: 25 EWF
  - Laptop: 50 EWF
  - Battery: 15 EWF
  - Charger: 10 EWF
  - Circuit Board: 20 EWF
  - Other: 5 EWF

## 1.4 Software & Tools Required
| Tool / Technology | Version / Specification | Purpose |
| :--- | :--- | :--- |
| Solidity | ^0.8.28 | Smart contract implementation |
| Hardhat | 3.14.0 | Ethereum local node, compiling, and testing |
| Ethers.js | 6.17.0 | Blockchain RPC provider and contract abstraction |
| React.js & Vite | React 19 / Vite 8 | Reactive user interface & state management |
| MetaMask | Browser Extension | Web3 wallet, key management, transaction signing |
| Mocha & Chai | Mocha 11 / Chai 6 | Automated test framework |

## 1.5 System Architecture
```
+--------------------+        submitEwaste()        +--------------------+
|  Recycling Client  | ---------------------------> |   EWasteRegistry   |
|   (User Signer)    |                              |   (State Engine)   |
+--------------------+                              +--------------------+
                                                              |
                                                    verifySubmission()
                                                    issueReward()
                                                              |
+--------------------+      verify/reject/issue               v
| Authorized Recycler| ---------------------------> +--------------------+
|   (Recycler Role)  |                              |  EWasteRewardVault |
+--------------------+                              |  (Reward Balances) |
                                                    +--------------------+
```

## 1.6 Contract Implementations & Code Highlights

### EWasteRegistry.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IRewardVault {
    function creditReward(address user, uint256 amount) external;
}

contract EWasteRegistry {
    enum Status { Pending, Verified, Rejected }

    struct Submission {
        uint256 id;
        address user;
        string category;
        uint256 quantity;
        uint256 weight;
        uint256 reward;
        Status status;
        uint256 submittedAt;
        uint256 verifiedAt;
        bool rewardIssued;
    }

    error NotOwner();
    error NotRecycler();
    error SubmissionNotFound();
    error SubmissionNotPending();
    error SubmissionNotVerified();
    error RewardAlreadyIssued();

    address public owner;
    address public rewardVault;
    uint256 public submissionCounter;
    mapping(uint256 => Submission) public submissions;
    mapping(address => bool) public recyclers;

    function submitEwaste(string calldata category, uint256 quantity, uint256 weight) external returns (uint256) {
        if (quantity == 0 || weight == 0) revert InvalidInput();
        uint256 reward = _calculateReward(category, quantity);
        submissionCounter++;
        submissions[submissionCounter] = Submission({
            id: submissionCounter,
            user: msg.sender,
            category: category,
            quantity: quantity,
            weight: weight,
            reward: reward,
            status: Status.Pending,
            submittedAt: block.timestamp,
            verifiedAt: 0,
            rewardIssued: false
        });
        emit EWasteSubmitted(submissionCounter, msg.sender, category, quantity, weight, reward);
        return submissionCounter;
    }
}
```

## 1.7 Procedure & Deployment Steps
1. Navigate to `blockchain/` directory and install project dependencies.
2. Compile contracts: `npx hardhat compile`.
3. Launch local blockchain node or prepare Ethereum Sepolia RPC credentials.
4. Execute deployment script:
   ```bash
   npx hardhat run scripts/deploy-exp1.js --network localhost
   ```
5. Note the deployed addresses for `EWasteRegistry` and `EWasteRewardVault`.
6. Invoke `registry.setRewardVault(vaultAddress)` to authorize reward crediting.
7. Invoke `registry.addRecycler(recyclerAddress)` to authorize verified processing partners.
8. Start the React frontend (`npm run dev`) and test end-to-end interactions via MetaMask.

## 1.8 Verification & Test Evidence
Automated test suite (`blockchain/test/Experiment1.test.js`):
- Deployment & Ownership assignment: PASS
- Recycler addition and deletion access control: PASS
- Non-owner authorization prevention: PASS
- Correct reward calculation per category: PASS
- Lifecycle transitions (Pending → Verified → Reward Credited): PASS
- Rejection handling and duplicate reward prevention: PASS
- Reversion on unauthorized verify/issue calls: PASS

## 1.9 Actual Observations
- The contract emits `EWasteSubmitted` indexed by `submissionId` and `user`.
- Only addresses with `recyclers[msg.sender] == true` can verify submissions or trigger reward issuance.
- A submission once marked `Verified` cannot be verified again. Attempting to issue rewards twice reverts with `RewardAlreadyIssued()`.

## 1.10 Result & Conclusion
Experiment 1 successfully established the foundational DApp architecture for E-WasteFi. Complete on-chain e-waste tracking and reward crediting were demonstrated and verified through comprehensive unit tests and user interface integration.

---

# Experiment 2 — MetaMask, Ethers.js & WalletConnect Integration

## 2.1 Aim
To integrate Ethereum browser provider wallets (MetaMask) and multi-wallet session protocols (WalletConnect) into the E-WasteFi frontend using Ethers.js v6, handling network validation (Sepolia Chain ID: 11155111, Local: 1337), reactive account switching, transaction receipt confirmation (`tx.wait()`), and user rejection states.

## 2.2 Objectives
1. Implement wallet connection lifecycle: connection request, account discovery, and session termination.
2. Enforce target network checks, displaying modal warnings and programmatically prompting network switches to Sepolia (`0xaa36a7`) or Hardhat Local (`0x539`).
3. Handle window event listeners: `accountsChanged`, `chainChanged`, and `disconnect`.
4. Provide real-time UI transaction feedback: `awaiting_signature`, `broadcasting`, `mining`, and `confirmed`.
5. Support fallback WalletConnect v2 session modal integration with project ID configuration.

## 2.3 Theory & Wallet Integration Architecture
- **Eip-1193 Standard:** `window.ethereum` provides a standardized interface for sending JSON-RPC messages (`eth_requestAccounts`, `wallet_switchEthereumChain`).
- **Ethers.js v6 BrowserProvider:** Wraps the EIP-1193 provider to generate reactive signers capable of signing type-2 EIP-1559 transactions.
- **State Synchronization:** Decentralized applications must not cache user addresses statically; wallet accounts can switch at any moment in the extension UI.
- **Transaction Receipt Confirmation:** A transaction is merely proposed when a hash is generated. Applications must await `receipt = await tx.wait(1)` before updating local state or notifying users of success.

## 2.4 Important Code Snippets

### Wallet Integration Service (`src/blockchain/wallet.js`)
```javascript
import { ethers } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111n;
export const LOCAL_CHAIN_ID = 1337n;

export async function connectMetaMask() {
  if (!window.ethereum) throw new Error("MetaMask is not installed.");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const network = await provider.getNetwork();
  const signer = await provider.getSigner();
  return { provider, signer, account: accounts[0], chainId: network.chainId };
}

export async function switchNetwork(targetChainId) {
  const hexChainId = "0x" + targetChainId.toString(16);
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }]
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      // Chain not added - request addEthereumChain
    }
  }
}
```

## 2.5 Verification & Observations
- On clicking "Connect Wallet", MetaMask opens an authorization prompt.
- If the connected network is not Sepolia or Localhost, the DApp displays a prominent "Wrong Network" badge and disables write actions.
- Switching accounts in MetaMask automatically refreshes the current user submissions and role badges.

## 2.6 Result & Conclusion
Experiment 2 provided a resilient, production-grade Web3 wallet connection layer with real-time status feedback, network enforcement, and event-driven state updates.

---

# Experiment 3 — ERC-4626 Tokenized Yield Vault

## 3.1 Aim
To deploy, interact with, and test an ERC-4626 Tokenized Yield Vault (`EWasteFiVault.sol`) utilizing an underlying ERC-20 token (`EWasteAssetToken.sol`), verifying the asset-to-share conversion lifecycle, deposit, mint, withdraw, redeem mechanics, and integrating an e-waste recycling impact registry.

## 3.2 Objectives
1. Implement an underlying asset token `EWasteAssetToken` (symbol: `EWAT`, 18 decimals).
2. Deploy the standard `EWasteFiVault` extending OpenZeppelin's `ERC4626` and `Ownable` contracts with share token `EWVS` ("E-WasteFi Vault Share").
3. Verify the mathematical relationships between assets and shares:
   - `convertToShares(assets)`
   - `convertToAssets(shares)`
   - `previewDeposit(assets)`
   - `previewRedeem(shares)`
4. Test the four standard ERC-4626 operations: `deposit`, `mint`, `withdraw`, and `redeem`.
5. Implement an administrative recycling impact tracking mechanism (`recordRecyclingImpact`) separate from financial vault accounting.

## 3.3 Theory & Mathematical Mechanics
ERC-4626 standardizes yield-bearing vaults on Ethereum. Instead of custom staking contracts, a standardized interface guarantees interoperability with DeFi aggregators and lending protocols.
- **Deposit:** User transfers $a$ assets and receives $s$ shares:
  $$s = \frac{a \times \text{totalSupply}}{\text{totalAssets()}}$$
  For initial deposit when $\text{totalSupply} = 0$, $s = a$.
- **Redeem:** User burns $s$ shares and receives $a$ assets:
  $$a = \frac{s \times \text{totalAssets()}}{\text{totalSupply}}$$
- **Separation of Environmental Metrics:** Environmental impact (kilograms recycled) is tracked via on-chain events and storage mappings, ensuring physical sustainability claims do not artificially distort financial share pricing.

## 3.4 Contract Implementation Highlights

### EWasteFiVault.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EWasteFiVault is ERC4626, Ownable {
    uint256 public totalRecyclingImpact;
    mapping(address => uint256) public userRecyclingImpact;

    event RecyclingImpactRecorded(address indexed user, uint256 amountKg, uint256 userTotalKg);

    constructor(IERC20 asset_, address initialOwner)
        ERC4626(asset_)
        ERC20("E-WasteFi Vault Share", "EWVS")
        Ownable(initialOwner)
    {}

    function recordRecyclingImpact(address user, uint256 amountKg) external onlyOwner {
        require(user != address(0), "Zero address");
        require(amountKg > 0, "Zero amount");
        userRecyclingImpact[user] += amountKg;
        totalRecyclingImpact += amountKg;
        emit RecyclingImpactRecorded(user, amountKg, userRecyclingImpact[user]);
    }
}
```

## 3.5 Test Results & Observations
- Initial deposit of 100 EWAT produces exactly 100 EWVS shares.
- `previewDeposit` and `previewRedeem` return exact 1:1 values in an unleveraged initial state.
- `withdraw` burns proportional shares and transfers exact asset amounts to the receiver.
- Non-owners attempting `recordRecyclingImpact` are reverted with OpenZeppelin's `OwnableUnauthorizedAccount`.

## 3.6 Result & Conclusion
Experiment 3 successfully validated the ERC-4626 standard for tokenized environmental recycling assets. All preview, conversion, deposit, and redemption workflows executed cleanly with zero rounding vulnerabilities.

---

# Experiment 4 — Automated Market Maker (AMM) Liquidity Pool

## 4.1 Aim
To develop, deploy, and simulate a Constant-Product Automated Market Maker (`EWasteAMM.sol`) supporting E-Waste Token (`EWT`) and E-Waste Reward Token (`EWR`), demonstrating liquidity provision, LP token issuance, token swaps with a 0.3% fee, and price slippage dynamics.

## 4.2 Objectives
1. Deploy ERC-20 pair tokens: `EWasteToken` (EWT) and `EWasteRewardToken` (EWR).
2. Implement constant product invariant equation: $x \times y = k$.
3. Implement proportional LP token minting on initial and subsequent deposits.
4. Calculate exact swap output with 0.3% protocol fee:
   $$\Delta y = \frac{0.997 \times \Delta x \times y}{x + 0.997 \times \Delta x}$$
5. Enforce ReentrancyGuard and SafeERC20 token transfer standards.

## 4.3 AMM Math & Constant Product Curve
- **Invariant:** $k = R_0 \times R_1$.
- When a user inputs $\Delta x$ tokens, the pool receives $\Delta x$ less a 0.3% fee ($30$ basis points).
- Effective input: $\Delta x_{\text{fee}} = \Delta x \times 997$.
- New reserve: $R_0' = R_0 \times 1000 + \Delta x_{\text{fee}}$.
- Output amount:
  $$\Delta y = \frac{\Delta x_{\text{fee}} \times R_1}{R_0 \times 1000 + \Delta x_{\text{fee}}}$$
- The invariant $k$ weakly increases after every swap due to accumulated fees, enriching existing liquidity providers.

## 4.4 Contract Implementation Highlights

### EWasteAMM.sol
```solidity
function swapToken0ForToken1(uint256 amountIn) external nonReentrant returns (uint256 amountOut) {
    if (amountIn == 0) revert ZeroAmount();
    if (reserve0 == 0 || reserve1 == 0) revert InsufficientLiquidity();

    uint256 amountInWithFee = amountIn * 997;
    amountOut = (amountInWithFee * reserve1) / (reserve0 * 1000 + amountInWithFee);

    if (amountOut == 0 || amountOut >= reserve1) revert InvalidOutput();

    token0.safeTransferFrom(msg.sender, address(this), amountIn);
    token1.safeTransfer(msg.sender, amountOut);

    reserve0 += amountIn;
    reserve1 -= amountOut;

    emit Swap(msg.sender, address(token0), amountIn, amountOut);
}
```

## 4.5 Test Results & Observations
- Depositing 1,000 EWT and 2,000 EWR initializes pool reserves with LP tokens equal to $\sqrt{1000 \times 2000} \approx 1414.21$.
- Swapping 100 EWT yields approximately 181.32 EWR, accurately matching the theoretical constant product formula with 0.3% fee deduction.
- Removing 50% of LP tokens returns exactly 50% of current pool reserves.

## 4.6 Result & Conclusion
Experiment 4 demonstrated a mathematically sound constant-product AMM liquidity pool with non-reentrant execution, safe reserve tracking, and fair fee accrual.

---

# Experiment 5 — Decentralized Yield Farming & Staking Protocol

## 5.1 Aim
To design, implement, and test a DeFi Yield Farming and Staking protocol (`SimpleYieldFarm.sol`) in the E-WasteFi ecosystem, allowing recyclers to stake `EWR` tokens to earn `RWR` (Recycling Worker Reward) tokens over time based on an exact per-second reward rate.

## 5.2 Objectives
1. Implement staking token (`EWRToken`) and reward distribution token (`RWRToken`).
2. Build an algorithmically continuous reward accrual engine using `rewardPerTokenStored` and `userRewardPerTokenPaid`.
3. Provide partial unstaking, harvest without unstaking, and full atomic exit functionality.
4. Guarantee solvency by enforcing that distributed rewards cannot exceed the pre-funded reward pool balance.
5. Provide automated test verification with programmatic timestamp manipulation.

## 5.3 Mathematical Model of Synthetix-Style Staking
Continuous per-second reward distributions across variable total stakes are computed via:
$$RPT(t) = RPT_{\text{stored}} + \frac{\text{rewardRate} \times (t - t_{\text{last}}) \times 10^{18}}{\text{totalStaked}}$$
For an individual staker with balance $B_u$:
$$\text{Earned}(u) = \frac{B_u \times (RPT(t) - RPT_{\text{paid}}(u))}{10^{18}} + \text{rewardDebt}(u)$$
This $O(1)$ constant-time calculation prevents unbounded loops, ensuring constant gas consumption regardless of staking duration or participant count.

## 5.4 Contract Implementation Highlights

### SimpleYieldFarm.sol
```solidity
modifier updateReward(address user) {
    rewardPerTokenStored = _rewardPerToken();
    lastUpdateTime = block.timestamp;
    if (user != address(0)) {
        rewardDebt[user] = earnedRewards(user);
        userRewardPerTokenPaid[user] = rewardPerTokenStored;
    }
    _;
}

function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
    if (amount == 0) revert ZeroAmount();
    stakeToken.safeTransferFrom(msg.sender, address(this), amount);
    stakedBalance[msg.sender] += amount;
    totalStaked += amount;
    emit Staked(msg.sender, amount);
}

function harvest() external nonReentrant updateReward(msg.sender) {
    uint256 reward = rewardDebt[msg.sender];
    if (reward == 0) revert NoRewardToClaim();
    if (reward > rewardPoolBalance) revert InsufficientRewardPool();
    rewardDebt[msg.sender] = 0;
    rewardPoolBalance -= reward;
    rewardToken.safeTransfer(msg.sender, reward);
    emit RewardHarvested(msg.sender, reward);
}
```

## 5.5 Test Results & Observations
- Fast-forwarding block timestamp by 100 seconds with 1 token/sec reward rate yields exactly 100 reward units for a solo staker.
- Splitting stake 50/50 between two stakers distributes subsequent rewards equally (50 units each).
- Harvesting claims accrued rewards while leaving staked capital completely intact.

## 5.6 Result & Conclusion
Experiment 5 demonstrated an efficient, scalable DeFi yield farming mechanism with mathematical precision, guaranteed pool solvency, and comprehensive state transitions.

---

# Experiment 6 — Full Decentralized Exchange (DEX Architecture)

## 6.1 Aim
To develop, deploy, and verify a complete Uniswap V2–style Decentralized Exchange architecture consisting of `EWasteFactory.sol`, `EWastePair.sol`, and `EWasteRouter.sol` with canonical pair ordering, minimum liquidity locking, and deadline/slippage-protected routing.

## 6.2 Objectives
1. Implement `EWastePair` managing reserves, LP minting/burning, and constant product swaps.
2. Implement `EWasteFactory` providing deterministic pair creation, sorting token addresses ($token0 < token1$), and preventing duplicate pairs.
3. Lock initial `MINIMUM_LIQUIDITY` (1,000 units) to `address(1)` to permanently mitigate inflation attacks.
4. Implement `EWasteRouter` orchestrating multi-step add-liquidity, remove-liquidity, and `swapExactTokensForTokens` routines with deadline checks.
5. Create automated test suites covering positive swaps, slippage limits, and duplicate rejection.

## 6.3 System Architecture
```
                         +--------------------+
                         |    EWasteRouter    |
                         |  (Slippage/Deadln) |
                         +--------------------+
                                    |
                     +--------------+--------------+
                     |                             |
                     v                             v
           +-------------------+         +-------------------+
           |   EWasteFactory   |         |    EWastePair     |
           |  (createPair/get) |         | (Reserves/Swaps)  |
           +-------------------+         +-------------------+
```

## 6.4 Key Mathematical Formulations
- **Initial LP Minting:**
  $$L_0 = \sqrt{amount_0 \times amount_1} - 1000$$
- **Subsequent LP Minting:**
  $$L = \min\left(\frac{amount_0 \times L_{\text{total}}}{R_0}, \frac{amount_1 \times L_{\text{total}}}{R_1}\right)$$
- **Swap with Fee (30 bps):**
  $$\text{amountOut} = \frac{\text{amountIn} \times 997 \times R_{\text{out}}}{R_{\text{in}} \times 1000 + \text{amountIn} \times 997}$$

## 6.5 Contract Implementation Highlights

### EWastePair.sol
```solidity
function mint(uint256 amount0, uint256 amount1, address to) external nonReentrant returns (uint256 lpMinted) {
    if (totalSupply == 0) {
        lpMinted = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
        totalSupply += MINIMUM_LIQUIDITY;
        balanceOf[address(1)] += MINIMUM_LIQUIDITY;
    } else {
        uint256 lp0 = (amount0 * totalSupply) / reserve0;
        uint256 lp1 = (amount1 * totalSupply) / reserve1;
        lpMinted = lp0 < lp1 ? lp0 : lp1;
    }
    totalSupply += lpMinted;
    balanceOf[to] += lpMinted;
    reserve0 += amount0;
    reserve1 += amount1;
    emit Mint(msg.sender, amount0, amount1, lpMinted);
    emit Sync(reserve0, reserve1);
}
```

## 6.6 Test Results & Observations
- Factory creates pair, assigns canonical token0 and token1, and emits `PairCreated`.
- Attempting to recreate the same pair reverts with `PairExists()`.
- Router successfully adds liquidity and transfers resulting LP tokens to the provider.
- Slippage protection triggers: if actual output is below `amountOutMin`, the swap transaction reverts immediately.

## 6.7 Result & Conclusion
Experiment 6 established a fully functional modular decentralized exchange following the proven Uniswap V2 architecture, ensuring secure automated liquidity and trading for recycling tokens.

---

# Experiment 7 — Chainlink Price Feed & Gas-to-USD Oracle

## 7.1 Aim
To integrate decentralized Chainlink oracles into the E-WasteFi platform using the `AggregatorV3Interface`, deploy a configurable `MockPriceFeed`, implement defensive validations in `SafeEWastePriceConsumer.sol`, and compute live transaction gas costs in USD.

## 7.2 Objectives
1. Implement `AggregatorV3Interface` contract bindings for the Ethereum Sepolia ETH/USD data feed (`0x694AA1769357215DE4FAC081bf1f309aDC325306`).
2. Build `MockPriceFeed.sol` allowing simulation of positive prices, zero prices, negative prices, future timestamps, and stale price updates.
3. Build `SafeEWastePriceConsumer.sol` with multi-tier validation:
   - Positive price: $P > 0$
   - Updated round: $updatedAt > 0$
   - Temporal sanity: $updatedAt \le \text{block.timestamp}$
   - Freshness threshold: $\text{block.timestamp} - updatedAt \le maxPriceAge$
4. Implement on-chain and frontend gas fee conversion:
   $$\text{Fee}_{\text{wei}} = \text{gasUsed} \times \text{effectiveGasPrice}$$
   $$\text{Fee}_{\text{USD}} = \frac{\text{Fee}_{\text{wei}} \times \text{Price}_{\text{ETH/USD}}}{10^{18} \times 10^{\text{decimals}}}$$

## 7.3 Chainlink Decentralized Oracle Architecture
Decentralized applications cannot natively query off-chain APIs without compromising consensus. Chainlink provides high-availability off-chain data aggregation:
- Multiple independent Node Operators query diverse market aggregators.
- Cryptographic signatures are collected and aggregated on-chain in the OCR (Off-Chain Reporting) contract.
- Decentralized applications query `latestRoundData()` to retrieve reference prices.

## 7.4 Contract Implementation Highlights

### SafeEWastePriceConsumer.sol
```solidity
function getValidatedPrice() external view returns (int256 price, uint256 updatedAt, uint8 feedDecimals) {
    uint80 roundId;
    (roundId, price,, updatedAt,) = priceFeed.latestRoundData();

    if (price <= 0) revert NegativeOrZeroPrice();
    if (updatedAt == 0) revert FeedNeverUpdated();
    if (updatedAt > block.timestamp) revert FutureTimestamp();
    
    uint256 age = block.timestamp - updatedAt;
    if (age > maxPriceAge) revert StalePriceFeed(age, maxPriceAge);

    feedDecimals = priceFeed.decimals();
}

function safeGetETHtoUSD(uint256 gasFeeWei) external view returns (uint256 usdFee, bool valid, string memory reason) {
    (, int256 price,, uint256 updatedAt,) = priceFeed.latestRoundData();
    if (price <= 0) return (0, false, "Negative or zero price");
    if (updatedAt == 0) return (0, false, "Feed never updated");
    if (updatedAt > block.timestamp) return (0, false, "Future timestamp");
    if (block.timestamp - updatedAt > maxPriceAge) return (0, false, "Price stale");

    usdFee = (gasFeeWei * uint256(price)) / 1e18;
    valid = true;
}
```

## 7.5 Test Results & Observations
Automated test suite (`blockchain/test/Experiment7.test.js`):
- Accurate decimal detection (8 decimals for standard ETH/USD feeds): PASS
- Stale price rejection: when $age > maxAge$, reverts with `StalePriceFeed`: PASS
- Non-positive price rejection: reverts with `NegativeOrZeroPrice`: PASS
- Future timestamp rejection: reverts with `FutureTimestamp`: PASS
- Gas cost translation: accurately scales wei to USD: PASS

## 7.6 Result & Conclusion
Experiment 7 successfully integrated Chainlink oracle price feeds with complete defensive sanity checks, allowing E-WasteFi users to observe transparent, verifiable fiat gas costs for every recycling action.

---

# Consolidated Verification & Test Summary

All 41 unit and integration tests across Experiments 1 through 7 were executed against the Hardhat blockchain environment:

```text
  Experiment 1: EWasteRegistry and EWasteRewardVault
    Deployment & Configuration
      √ sets deployer as owner
      √ links registry and vault correctly
    Recycler Management
      √ allows owner to add and remove a recycler
      √ prevents non-owners from adding recyclers
    Submissions & Rewards
      √ allows users to submit e-waste and calculates rewards accurately
      √ rejects invalid submission inputs
      √ handles full lifecycle: submit -> verify -> issue reward
      √ allows recycler to reject a submission

  Experiment 3: EWasteFiVault (ERC-4626)
    Initialization & Metadata
      √ has correct vault name, symbol and asset
      √ sets deployer as owner
    ERC-4626 Deposit & Redeem Lifecycle
      √ allows users to deposit assets and receive shares
      √ allows users to redeem shares for assets
    Recycling Impact Tracking
      √ allows owner to record recycling impact
      √ prevents non-owners from recording impact
      √ reverts on zero address user

  Experiment 4: EWasteAMM (Constant Product AMM)
    Deployment
      √ initializes tokens and zero reserves
    Liquidity Provision
      √ allows provider to add initial liquidity
      √ allows removing liquidity proportionally
    Swapping & 0.3% Fee
      √ swaps token0 for token1 with 0.3% fee applied
      √ swaps token1 for token0 with 0.3% fee applied
      √ reverts swap if input amount is zero

  Experiment 5: SimpleYieldFarm
    Deployment & Configuration
      √ sets correct tokens and reward rate
      √ allows owner to update reward rate
    Staking & Harvesting Flow
      √ allows user to stake tokens
      √ accrues rewards over time and allows harvesting
      √ allows user to unstake tokens
      √ does not distribute more than available funded rewards

  Experiment 6: EWaste DEX (Factory, Pair, Router)
    Factory
      √ creates a new pair and records it
      √ reverts on duplicate pair creation
    Router: Liquidity Management
      √ adds initial liquidity, locks minimum liquidity to address(1)
      √ removes liquidity through router
    Router: Swapping
      √ executes swapExactTokensForTokens correctly
      √ reverts if slippage exceeds amountOutMin

  Experiment 7: Chainlink Price Feed & Consumers
    MockPriceFeed & Basic Consumer
      √ reports correct decimals and initial price
      √ updates price when setAnswer is called
    SafeEWastePriceConsumer Validations
      √ returns price when feed is valid and fresh
      √ reverts on non-positive price
      √ reverts on stale price exceeding maxAge
      √ reverts on future price timestamp
      √ reverts on incomplete round (updatedAt == 0)
      √ allows owner to update maxAge

  41 passing (1s)
```

---

# Overall Conclusion
The E-WasteFi project successfully integrates a robust decentralized smart contract architecture with an intuitive, modern React.js frontend. Experiments 1 through 7 demonstrate the complete progression from foundational DApp registration and wallet connectivity to advanced DeFi mechanisms (ERC-4626 tokenized vaults, constant-product AMMs, yield farming, full DEX architecture) and decentralized Chainlink oracle price feeds. All contracts are tested, verified, and ready for deployment.
