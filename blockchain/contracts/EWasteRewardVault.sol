// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EWasteRewardVault {
    address public owner;
    address public registry;

    mapping(address => uint256) public rewardBalances;

    error NotOwner();
    error NotRegistry();
    error InvalidAddress();

    event RegistryUpdated(address indexed registry);
    event RewardCredited(
        address indexed user,
        uint256 amount
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyRegistry() {
        if (msg.sender != registry) revert NotRegistry();
        _;
    }

    function setRegistry(address registryAddress)
        external
        onlyOwner
    {
        if (registryAddress == address(0)) {
            revert InvalidAddress();
        }

        registry = registryAddress;

        emit RegistryUpdated(registryAddress);
    }

    function creditReward(
        address user,
        uint256 amount
    ) external onlyRegistry {
        if (user == address(0)) {
            revert InvalidAddress();
        }

        rewardBalances[user] += amount;

        emit RewardCredited(user, amount);
    }

    function getRewardBalance(address user)
        external
        view
        returns (uint256)
    {
        return rewardBalances[user];
    }
}