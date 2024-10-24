// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockLp {
    uint112 self_reserve0;
    uint112 self_reserve1;
    uint32 self_blockTimestampLast;

    function setReserves(uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast) external {
        self_reserve0 = reserve0;
        self_reserve1 = reserve1;
        self_blockTimestampLast = blockTimestampLast;
    }

    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast) {
        reserve0 = self_reserve0;
        reserve1 = self_reserve1;
        blockTimestampLast = self_blockTimestampLast;
    }
}