# E-WasteFi — System Architecture Documentation

---

## 1. High-Level Overview

```
╔══════════════════════════════════════════════════════════════╗
║                     USER'S BROWSER                          ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │               React 19 Frontend (Vite 8)              │  ║
║  │   Pages: Home / Submit / Verify / Vault / AMM /       │  ║
║  │          Farm / DEX / Oracle                           │  ║
║  └──────────────────┬─────────────────────────────────────┘  ║
║                     │  window.ethereum (EIP-1193)            ║
║  ┌──────────────────▼──────────────────────────────────────┐  ║
║  │       MetaMask Extension / WalletConnect                │  ║
║  └──────────────────┬──────────────────────────────────────┘  ║
╚═════════════════════╪════════════════════════════════════════╝
                      │  JSON-RPC over HTTPS / WSS
          ┌───────────▼────────────┐
          │    Ethereum Network     │
          │  Sepolia (chain 11155111) │
          │  or Hardhat (chain 1337)  │
          └───────────┬────────────┘
                      │
     ┌────────────────┼────────────────┐
     │                │                │
     ▼                ▼                ▼
EWasteRegistry  EWasteRewardVault  DeFi Contracts
 (Exp 1)         (Exp 1)          (Exp 3, 4, 5, 6, 7)
```

---

## 2. Frontend Architecture

### 2.1 Component Tree

```
App.jsx
├── WalletContext.jsx          (React Context — global wallet state)
├── BrowserRouter
│   ├── Navbar.jsx
│   │   ├── WalletButton.jsx  (Connect / disconnect / address display)
│   │   └── NetworkBadge.jsx  (Sepolia / Localhost indicator)
│   └── Routes
│       ├── /               → Home.jsx
│       ├── /submit         → Submit.jsx      (Exp 1)
│       ├── /verify         → Verify.jsx      (Exp 1)
│       ├── /vault          → Vault.jsx       (Exp 3)
│       ├── /amm            → AMM.jsx         (Exp 4)
│       ├── /farm           → Farm.jsx        (Exp 5)
│       ├── /dex            → DEX.jsx         (Exp 6)
│       └── /oracle         → Oracle.jsx      (Exp 7)
```

### 2.2 Wallet Context State

```javascript
WalletContext = {
  provider: BrowserProvider | null,     // Ethers.js provider
  signer: JsonRpcSigner | null,         // Connected signer
  account: string | null,              // "0xAbCd..."
  chainId: bigint | null,              // 11155111n or 1337n
  isConnected: boolean,
  connectWallet: async () => void,
  disconnectWallet: () => void,
}
```

### 2.3 Provider / Signer Flow

```
window.ethereum (injected by MetaMask)
        │
        ▼
new BrowserProvider(window.ethereum)    ← ethers.js v6
        │
        ├─── provider.getNetwork()       → { chainId, name }
        ├─── provider.getBalance(addr)   → BigInt (wei)
        │
        ▼
provider.getSigner()                    → JsonRpcSigner
        │
        ▼
new ethers.Contract(address, abi, signer)  → ContractInstance
        │
        ├─── contract.readFunction()     → data (no tx, no gas)
        └─── contract.writeFunction()    → TransactionResponse
                  │
                  ▼
             tx.wait()                  → TransactionReceipt
```

### 2.4 Event Listeners (MetaMask)

```javascript
// Account changed
window.ethereum.on("accountsChanged", (accounts) => {
  if (accounts.length === 0) disconnectWallet();
  else setAccount(accounts[0]);
});

// Network / chain changed
window.ethereum.on("chainChanged", (chainId) => {
  setChainId(BigInt(chainId));
  // Optionally reload: window.location.reload()
});
```

---

## 3. Smart Contract Architecture

### 3.1 Experiment 1 — Core DApp

```
        Owner (EOA)
           │
           │ addRecycler()
           ▼
    EWasteRegistry.sol
    ───────────────────
    + submitEWaste(category, qty, weight)
    + verifySubmission(id)
    + rejectSubmission(id)
    + setRewardVault(address)
    + addRecycler(address)
    ─────────────────────────
    Submission {
      id, submitter, category,
      quantity, weight,
      status: Pending | Verified | Rejected,
      timestamp
    }
           │
           │ issueReward(submitter, amount)
           ▼
    EWasteRewardVault.sol
    ──────────────────────
    ERC-20: EWF token
    + issueReward(to, amount)   ← only callable by Registry
    + mint(to, amount)          ← owner only (initial supply)
    + balanceOf(address)
    + transfer(to, amount)

Reward Table:
  Mobile Phone  → 25 EWF
  Laptop        → 50 EWF
  Battery       → 15 EWF
  Charger       → 10 EWF
  Circuit Board → 20 EWF
  Other         →  5 EWF
```

### 3.2 Submission State Machine

```
              submitEWaste()
                   │
                   ▼
             ┌─────────┐
             │ PENDING  │
             └────┬─────┘
                  │
         ┌────────┴────────┐
         │                 │
   verifySubmission()  rejectSubmission()
         │                 │
         ▼                 ▼
    ┌──────────┐      ┌──────────┐
    │ VERIFIED │      │ REJECTED │
    └──────────┘      └──────────┘
         │
         ▼
   issueReward() called on Vault
   → EWF minted to submitter
```

---

## 4. ERC-4626 Tokenized Vault (Experiment 3)

```
User (EOA)
    │
    │  approve(vault, amount)
    ▼
EWasteAssetToken (ERC-20)
    │
    │  deposit(assets, receiver)
    ▼
EWasteFiVault (ERC-4626)
─────────────────────────
  Underlying: EWasteAssetToken
  Share Token: EWVS (ERC-20)

  Deposit Flow:
    1. User approves vault to spend asset tokens
    2. vault.deposit(assets, receiver):
       - Calculates shares = assets * totalShares / totalAssets
       - Transfers assets FROM user TO vault
       - Mints EWVS shares TO receiver
  
  Withdraw Flow:
    1. vault.withdraw(assets, receiver, owner):
       - Calculates shares needed = assets * totalShares / totalAssets
       - Burns EWVS shares FROM owner
       - Transfers assets FROM vault TO receiver

  Key functions:
    totalAssets()         → uint256 (assets held)
    convertToShares()     → preview asset→share conversion
    convertToAssets()     → preview share→asset conversion
    previewDeposit()      → shares returned for asset amount
    previewRedeem()       → assets returned for share amount
```

---

## 5. AMM Liquidity Pool (Experiment 4)

```
                x * y = k  (constant product)

  EWT reserve ──────────────── EWR reserve
       │                             │
       └──────── EWasteAMM ──────────┘
                 ──────────
                 reserves0  (EWT)
                 reserves1  (EWR)
                 totalLPSupply

  Add Liquidity:
    lpTokens = min(
      amount0 * totalLP / reserve0,
      amount1 * totalLP / reserve1
    )
    (For first deposit: lpTokens = sqrt(amount0 * amount1))

  Swap (token0 → token1):
    amountIn_fee = amountIn * 997 / 1000       (0.3% fee)
    amountOut = reserve1 * amountIn_fee /
                (reserve0 * 1000 + amountIn_fee)
    
    New reserve0 = reserve0 + amountIn
    New reserve1 = reserve1 - amountOut
    
    Invariant check: newReserve0 * newReserve1 >= k

  Price Impact:
    spotPrice   = reserve1 / reserve0
    effectivePrice = amountOut / amountIn
    impact% = (spotPrice - effectivePrice) / spotPrice * 100
```

---

## 6. DEX Architecture (Experiment 6)

### 6.1 Contract Relationships (Uniswap V2 Style)

```
EWasteFactory
─────────────
+ createPair(tokenA, tokenB) → address
+ getPair(tokenA, tokenB)    → address
+ allPairs(index)            → address
Mapping: token0+token1 → pair address

        │  deploys
        ▼
EWastePair (one per token pair)
────────────────────────────────
ERC-20: LP token
+ mint(to)         → LP tokens issued
+ burn(to)         → LP tokens redeemed
+ swap(amount0Out, amount1Out, to)
+ getReserves()    → (reserve0, reserve1, blockTimestamp)
Events: Mint, Burn, Swap, Sync

EWasteRouter
─────────────
(Calls Factory and Pairs)
+ addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, ...)
+ removeLiquidity(tokenA, tokenB, liquidity, ...)
+ swapExactTokensForTokens(amountIn, amountOutMin, path[], to, deadline)
+ getAmountsOut(amountIn, path[])
```

### 6.2 First Liquidity Deposit (MINIMUM_LIQUIDITY)

```
First deposit of (amount0, amount1):
  lpMinted = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY
  MINIMUM_LIQUIDITY (= 1000) burned to address(0) permanently

  Purpose: Prevents the LP token price from becoming
           astronomically large due to rounding errors.
```

### 6.3 Swap Path

```
User → Router.swapExactTokensForTokens([EWASTE, EREWARD])
                │
                ▼
         Router calculates amountOut via getAmountsOut()
                │
                ▼
     Transfers EWASTE to Pair contract
                │
                ▼
     Calls Pair.swap(0, amountOut, userAddress)
                │
                ▼
         User receives EREWARD
```

---

## 7. Yield Farming Architecture (Experiment 5)

```
SimpleYieldFarm.sol
─────────────────────────────────────────────
stakeToken:   EWR (ERC-20)
rewardToken:  RWR (ERC-20)
rewardRate:   tokens per second (set by owner)

State per user:
  stakedBalance[user]
  rewardDebt[user]
  lastUpdateTime[user]

Reward Calculation:
  pendingReward = stakedBalance[user]
                  * rewardRate
                  * (block.timestamp - lastUpdateTime[user])
                  / totalStaked

Operations:
  stake(amount)    → transfers EWR from user; updates state
  harvest()        → mints/transfers pending RWR to user
  unstake(amount)  → returns EWR; triggers harvest
  exit()           → unstake all + harvest

Invariant:
  Total RWR distributed ≤ RWR minted to farm contract
```

---

## 8. Chainlink Oracle Integration (Experiment 7)

```
Chainlink Network (off-chain)
        │
        │  pushes signed price data on-chain
        ▼
AggregatorV3Proxy (Chainlink, Sepolia)
0x694AA1769357215DE4FAC081bf1f309aDC325306
        │
        │  latestRoundData()
        ▼
EWastePriceConsumer.sol
  + getLatestPrice() → int256   (raw, 8 decimals)
  + getFormattedPrice() → uint256 (scaled to 18 decimals)

SafeEWastePriceConsumer.sol
  + getLatestPrice() with staleness check:
    require(updatedAt >= block.timestamp - MAX_STALENESS, "Stale price");
    require(answeredInRound >= roundId, "Incomplete round");

MockPriceFeed.sol (local testing)
  + setPrice(int256)   → simulate price changes
  + latestRoundData()  → returns mock data
  Implements AggregatorV3Interface

Gas Fee USD Conversion:
  gasFeeWei = gasUsed × effectiveGasPrice
  gasFeeETH = gasFeeWei / 1e18
  gasFeeUSD = gasFeeETH × (ethUsdPrice / 10^8)
```

---

## 9. Deployment Flow

### 9.1 Local Deployment Sequence

```
1. npx hardhat node          → Starts local chain (1337)
                               Prints 20 funded accounts
                               
2. deploy-exp1.js:
   a. Deploy EWasteRewardVault()
   b. Deploy EWasteRegistry(vaultAddress)
   c. registry.setRewardVault(vaultAddress)
   d. vault.transferOwnership(registry.address)  ← so registry can mint

3. deploy-exp3.js:
   a. Deploy EWasteAssetToken("EWaste Asset", "EWA")
   b. Deploy EWasteFiVault(assetToken.address, "EWasteFi Vault", "EWVS")

4. deploy-exp4.js:
   a. Deploy EWT token
   b. Deploy EWR token
   c. Deploy EWasteAMM(ewt.address, ewr.address)

5. deploy-exp5.js:
   a. Deploy EWR (stake token) [or reuse from Exp 4]
   b. Deploy RWR (reward token)
   c. Deploy SimpleYieldFarm(ewr.address, rwr.address, rewardRate)
   d. rwr.mint(farm.address, REWARD_POOL_AMOUNT)

6. deploy-exp6.js:
   a. Deploy EWasteFactory()
   b. Deploy EWasteRouter(factory.address)
   c. Deploy EWASTE and EREWARD tokens

7. deploy-exp7.js:
   a. Deploy MockPriceFeed(8, initialPrice)   ← for local testing
   b. Deploy EWastePriceConsumer(mockFeed.address)
   c. Deploy SafeEWastePriceConsumer(mockFeed.address, maxStaleness)
```

### 9.2 Sepolia Deployment

Same sequence, but:
- Use `--network sepolia`
- Experiment 7 uses the **real** Chainlink feed address instead of MockPriceFeed:
  `0x694AA1769357215DE4FAC081bf1f309aDC325306`

---

## 10. Local vs Sepolia Environment Comparison

| Aspect | Local (Hardhat) | Sepolia |
|---|---|---|
| Chain ID | 1337 | 11155111 |
| Block time | Instant (on-demand) | ~12 seconds |
| ETH cost | Free | Free (faucet) |
| Tx finality | Immediate | ~1–3 blocks |
| Etherscan | Not available | sepolia.etherscan.io |
| Chainlink feed | MockPriceFeed | Real AggregatorV3 |
| Reset | `npx hardhat node` restart | Permanent |
| Accounts | 20 pre-funded accounts | Your MetaMask wallet |
| Private keys | Hardhat defaults (public) | Your own (keep secret) |
| State persistence | Lost on node restart | Permanent |

---

## 11. Data Flow: E-Waste Submission to Reward

```
  User (Browser)                Registry Contract          Vault Contract
       │                              │                          │
       │── submitEWaste(cat,qty,wt) ─►│                          │
       │                              │  emit SubmissionCreated  │
       │◄── tx confirmed ─────────────│                          │
       │                              │                          │
  Recycler (Browser)                  │                          │
       │── verifySubmission(id) ─────►│                          │
       │                              │── issueReward(user, amt)►│
       │                              │                          │── mint(user, amt)
       │                              │                          │── emit Transfer
       │                              │  emit SubmissionVerified │
       │◄── tx confirmed ─────────────│                          │
       │                                                         │
       │── balanceOf(user) ──────────────────────────────────────►│
       │◄── EWF balance ─────────────────────────────────────────│
```

---

## 12. Security Architecture Notes

> [!WARNING]
> This is an educational project. The following considerations apply to production use:

| Concern | Current Implementation | Production Recommendation |
|---|---|---|
| Access Control | Simple `onlyOwner` / `onlyRecycler` modifiers | OpenZeppelin `AccessControl` with roles |
| Upgradeability | Not upgradeable | Proxy pattern (Transparent or UUPS) |
| Oracle Staleness | SafeEWastePriceConsumer (basic check) | Full Chainlink circuit breaker |
| Reentrancy | State updates before external calls | Add `ReentrancyGuard` |
| Audit | Not audited | Professional smart contract audit |
| Key Management | Private key in `.env` | Hardware wallet + multi-sig |
| Front-running | Not protected | Commit-reveal or slippage limits |
