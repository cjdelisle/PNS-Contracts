// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

interface IYieldVault {
    function lpComputeYields(uint256 lockupId) external view returns (uint256);
}