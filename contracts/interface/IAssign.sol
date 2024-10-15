// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

import "./IInfra.sol";

interface IAssign {
    struct Assignment {
        address owner;
        uint yieldCredits;
        uint unitId;
    }

    event Assign(uint id, address owner, uint unitId, uint256 yieldCredits);

    function assignByOwnerUnit(address owner, uint unitId) external view returns (uint);

    function assignYc(uint unitId, uint256 yieldCredits) external;

    function getAssign(uint id) external view returns (
        address owner,
        uint256 yieldCredits,
        uint unitId
    );

    function getAssigns(uint[] calldata ids) external view returns (Assignment[] memory out);

    function registerAndAssign(
        IInfra.UnitType t,
        uint64 parentDomain,
        string calldata name,
        uint yieldCredits,
        address to
    ) external returns (uint);

    function updateAndAssign(
        uint unitId,
        uint8 update,
        IInfra.UnitType t,
        uint64 parentDomain,
        string calldata name,
        uint yieldCredits
    ) external;

    /// @return The next higher Assign id to issue
    function nextId() external view returns (uint);

    /// Access the free list of unit IDs.
    ///
    /// @param last The last ID, if zero then this gives the list head
    /// @return id The next ID in the list
    function idFreeList(uint64 last) external view returns (uint id);
}