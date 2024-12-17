// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

interface IDomainPricer {
    function getUpdatePrice(
        uint256 lastRegPrice,
        uint256 lastRegTimeSec
    ) external returns (uint256 value);

    function getPrice(
        uint256 lastRegPrice,
        uint256 lastRegTimeSec
    ) external view returns (uint256 value);
}