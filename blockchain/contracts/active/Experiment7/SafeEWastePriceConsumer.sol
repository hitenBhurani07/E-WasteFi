// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MockPriceFeed.sol";

contract SafeEWastePriceConsumer {
    AggregatorV3Interface public priceFeed;
    uint256 public maxAge; // in seconds
    address public owner;

    error NotOwner();
    error InvalidFeed();
    error InvalidPrice();
    error IncompleteRound();
    error StalePrice();
    error FuturePrice();

    event MaxAgeUpdated(uint256 newMaxAge);
    event PriceFeedUpdated(address newPriceFeed);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _priceFeed, uint256 _maxAge) {
        if (_priceFeed == address(0)) revert InvalidFeed();
        priceFeed = AggregatorV3Interface(_priceFeed);
        maxAge = _maxAge;
        owner = msg.sender;
    }

    function setMaxAge(uint256 _maxAge) external onlyOwner {
        maxAge = _maxAge;
        emit MaxAgeUpdated(_maxAge);
    }

    function setPriceFeed(address _priceFeed) external onlyOwner {
        if (_priceFeed == address(0)) revert InvalidFeed();
        priceFeed = AggregatorV3Interface(_priceFeed);
        emit PriceFeedUpdated(_priceFeed);
    }

    function getLatestPrice() external view returns (int256) {
        (uint80 roundId, int256 price, , uint256 updatedAt, uint80 answeredInRound) = priceFeed.latestRoundData();

        if (price <= 0) revert InvalidPrice();
        if (updatedAt == 0) revert IncompleteRound();
        if (answeredInRound < roundId) revert IncompleteRound();
        if (updatedAt > block.timestamp) revert FuturePrice();
        if (block.timestamp - updatedAt > maxAge) revert StalePrice();

        return price;
    }

    function getDecimals() external view returns (uint8) {
        return priceFeed.decimals();
    }
}
