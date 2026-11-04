// Experiment 1 ABIs
export const REGISTRY_ABI = [
  // Custom Errors
  "error NotOwner()",
  "error NotRecycler()",
  "error InvalidAddress()",
  "error InvalidQuantity()",
  "error InvalidWeight()",
  "error UnsupportedCategory()",
  "error SubmissionNotFound()",
  "error SubmissionNotPending()",
  "error SubmissionNotVerified()",
  "error RewardAlreadyIssued()",
  "error RecyclerAlreadyExists()",
  "error RecyclerNotFound()",
  "error RewardVaultNotSet()",

  // Events
  "event EWasteSubmitted(uint256 indexed submissionId, address indexed user, string category, uint256 quantity, uint256 weight, uint256 reward)",
  "event SubmissionVerified(uint256 indexed submissionId, address indexed recycler)",
  "event SubmissionRejected(uint256 indexed submissionId, address indexed recycler)",
  "event RewardIssued(uint256 indexed submissionId, address indexed user, uint256 reward)",

  // View Functions
  "function owner() view returns (address)",
  "function rewardVault() view returns (address)",
  "function submissionCounter() view returns (uint256)",
  "function recyclers(address) view returns (bool)",
  "function submissions(uint256) view returns (uint256 id, address user, string category, uint256 quantity, uint256 weight, uint256 reward, uint8 status, uint256 submittedAt, uint256 verifiedAt, bool rewardIssued)",
  "function getSubmission(uint256 submissionId) view returns (tuple(uint256 id, address user, string category, uint256 quantity, uint256 weight, uint256 reward, uint8 status, uint256 submittedAt, uint256 verifiedAt, bool rewardIssued))",
  "function getUserSubmissionIds(address user) view returns (uint256[])",
  "function getSubmissionCount() view returns (uint256)",

  // State Mutating Functions
  "function submitEwaste(string category, uint256 quantity, uint256 weight) returns (uint256)",
  "function verifySubmission(uint256 submissionId)",
  "function rejectSubmission(uint256 submissionId)",
  "function issueReward(uint256 submissionId)"
];

export const VAULT_ABI = [
  "error NotOwner()",
  "error NotRegistry()",
  "error InvalidAddress()",
  "function owner() view returns (address)",
  "function registry() view returns (address)",
  "function rewardBalances(address) view returns (uint256)",
  "function getRewardBalance(address user) view returns (uint256)"
];

// Experiment 3: ERC-20 & ERC-4626 Tokenized Vault
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const ERC4626_ABI = [
  "function asset() view returns (address)",
  "function totalAssets() view returns (uint256)",
  "function convertToShares(uint256 assets) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function maxDeposit(address receiver) view returns (uint256)",
  "function previewDeposit(uint256 assets) view returns (uint256)",
  "function deposit(uint256 assets, address receiver) returns (uint256)",
  "function maxMint(address receiver) view returns (uint256)",
  "function previewMint(uint256 shares) view returns (uint256)",
  "function mint(uint256 shares, address receiver) returns (uint256)",
  "function maxWithdraw(address owner) view returns (uint256)",
  "function previewWithdraw(uint256 assets) view returns (uint256)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256)",
  "function maxRedeem(address owner) view returns (uint256)",
  "function previewRedeem(uint256 shares) view returns (uint256)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

// Experiment 4: AMM Liquidity Pool
export const AMM_ABI = [
  "function getReserves() view returns (uint256, uint256)",
  "function lpBalances(address account) view returns (uint256)",
  "function totalLPSupply() view returns (uint256)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function addLiquidity(uint256 amount0, uint256 amount1) returns (uint256)",
  "function removeLiquidity(uint256 lpAmount) returns (uint256, uint256)",
  "function swapToken0ForToken1(uint256 amount0In) returns (uint256)",
  "function swapToken1ForToken0(uint256 amount1In) returns (uint256)"
];

// Experiment 5: Yield Farming / Staking
export const FARM_ABI = [
  "function earnedRewards(address account) view returns (uint256)",
  "function stakedBalance(address account) view returns (uint256)",
  "function rewardRate() view returns (uint256)",
  "function stakeToken() view returns (address)",
  "function rewardToken() view returns (address)",
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function harvest()"
];

// Experiment 6: DEX Factory, Router, Pair
export const DEX_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) view returns (address pair)",
  "function createPair(address tokenA, address tokenB) returns (address pair)",
  "function allPairs(uint256 index) view returns (address pair)",
  "function allPairsLength() view returns (uint256)"
];

export const DEX_ROUTER_ABI = [
  "function factory() view returns (address)",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)",
  "function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB)",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) returns (uint256[] amounts)",
  "function getAmountsOut(uint256 amountIn, address[] calldata path) view returns (uint256[] amounts)"
];

export const DEX_PAIR_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function price0CumulativeLast() view returns (uint256)",
  "function price1CumulativeLast() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)"
];

// Experiment 7: Chainlink Price Feed Consumer
export const PRICE_CONSUMER_ABI = [
  "function getLatestPrice() view returns (int256)",
  "function getDecimals() view returns (uint8)",
  "function getLastUpdatedAt() view returns (uint256)",
  "function isPriceStale() view returns (bool)",
  "function getETHtoUSD(uint256 ethAmount) view returns (uint256)",
  "function description() view returns (string)"
];
