// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EWasteFiVault is ERC4626 {
    address public owner;

    mapping(address => uint256) public totalRecyclingImpact;

    event RecyclingImpactRecorded(address indexed user, uint256 amountKg, uint256 totalImpact);

    error NotOwner();
    error InvalidAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(IERC20 asset_)
        ERC4626(asset_)
        ERC20("E-WasteFi Vault Share", "EWVS")
    {
        owner = msg.sender;
    }

    function recordRecyclingImpact(address user, uint256 amountKg) external onlyOwner {
        if (user == address(0)) revert InvalidAddress();
        totalRecyclingImpact[user] += amountKg;
        emit RecyclingImpactRecorded(user, amountKg, totalRecyclingImpact[user]);
    }
}
