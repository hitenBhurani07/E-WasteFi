// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MockPriceFeed.sol";

contract EWastePriceConsumer {
    AggregatorV3Interface public priceFeed;

    constructor(address _priceFeed) {
        require(_priceFeed != address(0), "Invalid feed address");
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function getDecimals() external view returns (uint8) {
        return priceFeed.decimals();
    }
}
