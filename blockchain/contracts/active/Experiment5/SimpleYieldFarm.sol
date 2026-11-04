// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleYieldFarm {
    IERC20 public immutable stakeToken;
    IERC20 public immutable rewardToken;
    address public owner;

    uint256 public rewardRate; // reward tokens per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public totalStaked;

    mapping(address => uint256) public balances;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _unlocked = 1;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);
    event RewardsFunded(address indexed funder, uint256 amount);

    error NotOwner();
    error ZeroAmount();
    error InsufficientBalance();
    error TransferFailed();
    error Reentrancy();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (_unlocked != 1) revert Reentrancy();
        _unlocked = 0;
        _;
        _unlocked = 1;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earnedRewards(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    constructor(address _stakeToken, address _rewardToken, uint256 _rewardRate) {
        require(_stakeToken != address(0) && _rewardToken != address(0), "Invalid tokens");
        stakeToken = IERC20(_stakeToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        owner = msg.sender;
        lastUpdateTime = block.timestamp;
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner updateReward(address(0)) {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked);
    }

    function earnedRewards(address account) public view returns (uint256) {
        return ((balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) + rewards[account];
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();

        totalStaked += amount;
        balances[msg.sender] += amount;

        bool success = stakeToken.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        if (balances[msg.sender] < amount) revert InsufficientBalance();

        totalStaked -= amount;
        balances[msg.sender] -= amount;

        bool success = stakeToken.transfer(msg.sender, amount);
        if (!success) revert TransferFailed();

        emit Unstaked(msg.sender, amount);
    }

    function harvest() external nonReentrant updateReward(msg.sender) returns (uint256) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            uint256 balance = rewardToken.balanceOf(address(this));
            if (reward > balance) {
                reward = balance; // Never distribute more than funded rewards
            }
            rewards[msg.sender] -= reward;
            bool success = rewardToken.transfer(msg.sender, reward);
            if (!success) revert TransferFailed();

            emit RewardPaid(msg.sender, reward);
        }
        return reward;
    }

    function fundRewards(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        bool success = rewardToken.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        emit RewardsFunded(msg.sender, amount);
    }
}
