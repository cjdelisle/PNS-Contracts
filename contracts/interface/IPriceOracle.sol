// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

interface IPriceOracle {
    function getUpdatePriceUsd() external returns (uint256);
    function viewPriceUsd() external view returns (uint256);
}