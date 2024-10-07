// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ILockBox is IERC721 {
    function lockups(
        uint256 lockupId
    )
        external
        view
        returns (
            uint256 amountAsset,
            uint256 amountLpToken,
            uint256 lpTokenValuation,
            uint256 assetSecondsLocked,
            uint256 lpSecondsLocked,
            uint64 createTime,
            uint64 lastDepositTime,
            uint64 durationSeconds,
            bool autoRelock
        );
}
