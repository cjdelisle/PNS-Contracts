// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interface/IDomainPricer.sol";

contract DomainPricer is IDomainPricer {
    uint64 public constant PRICE_HALVING_SECONDS = 60 * 60;
    uint256 public constant MIN_PRICE = 1000 * 1e18; // Set your minimum price
    uint256 public constant MAX_PRICE = 50000 * 1e18; // Set your maximum price
    uint256 public lastPrice = MIN_PRICE;

    function getPrice(uint256, uint256 lastRegTimeSec) public view returns (uint256 value) {
        value = lastPrice;
        if (value < MAX_PRICE) {
            // Price grows by either doubling or halving the difference between itself and MAX_PRICE
            // whichever is less. This creates an asymptotic growth trending toward MAX_PRICE.
            uint256 valuePlusHalfDiff = value + (MAX_PRICE - value) / 2;
            if (value * 2 > valuePlusHalfDiff) {
                value = valuePlusHalfDiff;
            } else {
                value *= 2;
            }
        }

        value -= MIN_PRICE;

        // Price falls by halving the difference between itself and MIN_PRICE each hour.
        uint64 partialTime;
        {
            uint64 secondsSinceLast = uint64(block.timestamp) - uint64(lastRegTimeSec);
            partialTime = secondsSinceLast % PRICE_HALVING_SECONDS;
            value >>= (secondsSinceLast / PRICE_HALVING_SECONDS);
        }
        if (partialTime > 0) {
            // Price ranges from 1/2 to 1 linearly with the ratio of partialTime : PRICE_HALVING_SECONDS
            value = value / 2 + value * (PRICE_HALVING_SECONDS - partialTime) / PRICE_HALVING_SECONDS / 2;
        }
        if (value == 0) {
            value = 1;
        }

        value += MIN_PRICE;
    }

    function getUpdatePrice(uint256, uint256 lastRegTimeSec) public override returns (uint256 value) {
        value = getPrice(0, lastRegTimeSec);
        lastPrice = value;
    }
}
