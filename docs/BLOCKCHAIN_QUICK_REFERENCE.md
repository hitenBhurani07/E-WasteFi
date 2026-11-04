# E-WasteFi — Blockchain Developer Quick Reference

> Fast lookup for common commands, addresses, troubleshooting, and patterns.

---

## 1. MetaMask — Local Hardhat Network Setup

| Field | Value |
|---|---|
| Network Name | `Hardhat Local` |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `1337` |
| Currency Symbol | `ETH` |

**Steps:**
1. Open MetaMask → Settings → Networks → Add Network → Add a network manually
2. Enter the values above and click **Save**
3. Import a Hardhat test account: copy a private key from the `npx hardhat node` terminal output

---

## 2. MetaMask — Sepolia Testnet Setup

| Field | Value |
|---|---|
| Network Name | `Sepolia` |
| RPC URL | `https://sepolia.infura.io/v3/<YOUR_INFURA_KEY>` |
| Chain ID | `11155111` |
| Currency Symbol | `ETH` |
| Block Explorer | `https://sepolia.etherscan.io` |

> [!TIP]
> MetaMask often has Sepolia pre-configured under **Settings → Networks → Show test networks**.

---

## 3. Getting Sepolia ETH (Faucets)

| Faucet | URL | Notes |
|---|---|---|
| Sepolia Faucet | https://sepoliafaucet.com/ | Requires Alchemy login |
| Infura Faucet | https://www.infura.io/faucet/sepolia | Requires Infura login |
| Chainlink Faucet | https://faucets.chain.link/sepolia | Also gives testnet LINK |
| PoW Faucet | https://sepolia-faucet.pk910.de/ | No login required |

---

## 4. Contract Compilation

```bash
cd blockchain

# Compile all contracts
npx hardhat compile

# Clean artifacts and recompile
npx hardhat clean && npx hardhat compile

# Check Solidity version in use
cat hardhat.config.js | grep solidity
```

**Output locations:**
- `blockchain/artifacts/contracts/<Name>.sol/<Name>.json` — full artifact (ABI + bytecode)
- `blockchain/cache/` — compilation cache

---

## 5. Contract Deployment Commands

### Local (Hardhat Node)

```bash
# Start local node first (keep this terminal open)
npx hardhat node

# In a second terminal, deploy:
npx hardhat run scripts/deploy-exp1.js --network localhost
npx hardhat run scripts/deploy-exp3.js --network localhost
npx hardhat run scripts/deploy-exp4.js --network localhost
npx hardhat run scripts/deploy-exp5.js --network localhost
npx hardhat run scripts/deploy-exp6.js --network localhost
npx hardhat run scripts/deploy-exp7.js --network localhost
```

### Sepolia Testnet

```bash
# Requires PRIVATE_KEY and VITE_SEPOLIA_RPC in .env
npx hardhat run scripts/deploy-exp1.js --network sepolia
npx hardhat run scripts/deploy-exp3.js --network sepolia
# ... etc.
```

> [!IMPORTANT]
> After each Sepolia deployment, copy the printed contract address(es) into your `.env` file.

---

## 6. ABI Export (for Frontend)

```bash
# After compiling, copy ABIs to src/abis/
cd blockchain
cp artifacts/contracts/EWasteRegistry.sol/EWasteRegistry.json ../src/abis/
cp artifacts/contracts/EWasteRewardVault.sol/EWasteRewardVault.json ../src/abis/
# Repeat for each contract
```

**Or use a script:**
```bash
node scripts/copy-abis.js
```

---

## 7. Frontend Launch

```bash
# From project root
npm run dev
# → http://localhost:5173

# Production build
npm run build
npm run preview
```

---

## 8. Contract Address Verification (Etherscan)

| Contract | Sepolia Etherscan |
|---|---|
| EWasteRegistry | https://sepolia.etherscan.io/address/0x7CC2B7Cd0cDfB3D29f562c6a63821A812CF1ccf2 |
| EWasteRewardVault | https://sepolia.etherscan.io/address/0x4C8027D4fE6339FA9B764cA100af0cD7e20A032c |
| Chainlink ETH/USD | https://sepolia.etherscan.io/address/0x694AA1769357215DE4FAC081bf1f309aDC325306 |

**To verify your deployed contract:**
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## 9. Running Tests

```bash
cd blockchain

# All tests
npx hardhat test

# Specific file
npx hardhat test test/EWasteRegistry.test.js

# With gas report
REPORT_GAS=true npx hardhat test

# With coverage
npx hardhat coverage
```

---

## 10. Hardhat Console (Interactive)

```bash
cd blockchain

# Local node
npx hardhat console --network localhost

# Sepolia
npx hardhat console --network sepolia
```

**Useful console commands:**
```javascript
// Get contract factory
const Registry = await ethers.getContractFactory("EWasteRegistry");

// Attach to deployed address
const registry = Registry.attach("0x...");

// Call a function
await registry.submitEWaste(1, 2, 500);  // category, qty, weight

// Get signers
const [owner, addr1] = await ethers.getSigners();
```

---

## 11. Reward Rate Reference

| Category ID | Category | Reward (EWF) |
|---|---|---|
| 0 | Mobile Phone | 25 |
| 1 | Laptop | 50 |
| 2 | Battery | 15 |
| 3 | Charger | 10 |
| 4 | Circuit Board | 20 |
| 5 | Other | 5 |

---

## 12. Common Errors & Fixes

### "Wrong network" / Network mismatch
- **Cause:** MetaMask is on a different network than the deployed contracts
- **Fix:** Switch MetaMask to Sepolia (chain ID 11155111) or Localhost 1337

### "Not a recycler" / Access control error
- **Cause:** The connected wallet is not authorized as a recycler
- **Fix:** Call `addRecycler(address)` from the contract owner wallet

### "Reward vault not set"
- **Cause:** `EWasteRegistry` does not know the vault address
- **Fix:** After deploying both contracts, call `registry.setRewardVault(vaultAddress)` from the owner

### MetaMask popup rejected / User denied transaction
- **Cause:** User clicked "Reject" in MetaMask
- **Fix:** Re-initiate the transaction and click "Confirm"

### "Insufficient funds for gas"
- **Cause:** Wallet has no (or insufficient) Sepolia ETH
- **Fix:** Get testnet ETH from a faucet (see Section 3)

### "Nonce too high"
- **Cause:** MetaMask nonce out of sync with local Hardhat node (happens after restarting the node)
- **Fix:** MetaMask → Settings → Advanced → Clear activity and nonce data

### Contract not found / "contract runner does not support sending transactions"
- **Cause:** No signer attached — read-only provider used
- **Fix:** Use `provider.getSigner()` and attach to contract: `contract.connect(signer)`

### CORS error on RPC call
- **Cause:** Browser blocking cross-origin request to local node
- **Fix:** Hardhat node accepts all origins by default; ensure `http://` not `https://` for localhost

### "execution reverted: ERC20: insufficient allowance"
- **Cause:** Token `approve()` not called before `transferFrom`
- **Fix:** Call `token.approve(spenderAddress, amount)` first, then proceed with the main transaction

---

## 13. Ethers.js v6 Cheat Sheet

```javascript
import { ethers, BrowserProvider, parseEther, formatEther } from "ethers";

// Connect to MetaMask
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const address = await signer.getAddress();

// Get network
const network = await provider.getNetwork();
const chainId = network.chainId;  // BigInt in v6

// Attach contract
const contract = new ethers.Contract(ADDRESS, ABI, signer);

// Call read function
const result = await contract.someView();

// Send transaction
const tx = await contract.someFunction(arg1, arg2);
await tx.wait();  // Wait for 1 confirmation

// Parse / format ETH
const wei = parseEther("1.0");      // "1.0 ETH" → BigInt wei
const eth = formatEther(wei);       // BigInt wei → "1.0"

// Parse / format tokens (e.g., 18 decimals)
const amount = ethers.parseUnits("100", 18);
const display = ethers.formatUnits(amount, 18);

// Listen to events
contract.on("SubmissionCreated", (id, submitter, category) => {
  console.log("New submission:", id, submitter, category);
});
```

---

## 14. Chainlink Price Feed Reference

| Network | Feed | Address | Decimals |
|---|---|---|---|
| Sepolia | ETH / USD | `0x694AA1769357215DE4FAC081bf1f309aDC325306` | 8 |

```javascript
// AggregatorV3Interface ABI (minimal)
const FEED_ABI = [
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() view returns (uint8)"
];

const feed = new ethers.Contract(FEED_ADDRESS, FEED_ABI, provider);
const { answer, updatedAt } = await feed.latestRoundData();
const decimals = await feed.decimals();  // 8

const priceUSD = Number(answer) / 10 ** Number(decimals);
console.log(`ETH/USD: $${priceUSD.toFixed(2)}`);
```

---

## 15. Useful npm Scripts

```bash
# From project root
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check

# From blockchain/
npx hardhat compile      # Compile contracts
npx hardhat test         # Run tests
npx hardhat node         # Start local node
npx hardhat clean        # Remove artifacts
```

---

## 16. Git Safety Checklist

```bash
# Before every commit — verify .env is NOT staged
git status

# Should NOT appear in staged files:
# .env
# blockchain/.env

# If accidentally staged:
git reset HEAD .env

# Verify .gitignore contains:
cat .gitignore | grep ".env"
```

> [!CAUTION]
> If you accidentally commit a private key, consider it compromised immediately.
> Rotate the key and transfer any funds out of the exposed wallet.
