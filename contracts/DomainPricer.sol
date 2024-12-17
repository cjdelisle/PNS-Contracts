// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

import "./interface/IDomainPricer.sol";

contract DomainPricer is IDomainPricer {
    uint64 public constant PRICE_HALVING_SECONDS = 60*60;
    function getPrice(
        uint256 lastRegPrice,
        uint256 lastRegTimeSec
    ) public view override returns (uint256 value) {
        uint64 partialTime;
        {
            uint64 secondsSinceLast = uint64(block.timestamp) - uint64(lastRegTimeSec);
            partialTime = secondsSinceLast % PRICE_HALVING_SECONDS;
            value = lastRegPrice << 1 >> (secondsSinceLast / PRICE_HALVING_SECONDS);
        }
        if (partialTime > 0) {
            // Price ranges from 1/2 to 1 linearly with the ratio of partialTime : PRICE_HALVING_SECONDS
            value = value / 2 + value * (PRICE_HALVING_SECONDS - partialTime) / PRICE_HALVING_SECONDS / 2;
        }
        if (value == 0) {
            value = 1;
        }
    }
    function getUpdatePrice(
        uint256 lastRegPrice,
        uint256 lastRegTimeSec
    ) public view override returns (uint256 value) {
        return getPrice(lastRegPrice, lastRegTimeSec);
    }
}