// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

import "../interface/IPriceOracle.sol";

contract MockPriceOracle is IPriceOracle {
    function getUpdatePriceUsd() override external pure returns (uint256) {
        return 1;
    }
    function viewPriceUsd() override external pure returns (uint256) {
        return 1;
    }
}