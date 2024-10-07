// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../external/ILockBox.sol";

contract MockLockBox is ERC721, ILockBox {
    struct Lockup {
        uint256 amountAsset;
        uint256 lpTokenValuation;
    }

    mapping(uint256 => Lockup) private lockupsData;

    constructor() ERC721("MockLockBox", "MLB") {}

    // Mock the lockups function to return the relevant fields
    function lockups(uint256 lockupId)
        external
        view
        override
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
        )
    {
        Lockup storage lockup = lockupsData[lockupId];
        return (
            lockup.amountAsset,
            0,
            lockup.lpTokenValuation,
            0,
            0,
            0,
            0,
            0,
            false
        );
    }

    // Add function to allow setting lockup data in tests
    function setLockup(
        uint256 lockupId,
        uint256 amountAsset,
        uint256 lpTokenValuation
    ) external {
        _safeMint(msg.sender, lockupId);
        lockupsData[lockupId] = Lockup(
            amountAsset,
            lpTokenValuation
        );
    }
}
