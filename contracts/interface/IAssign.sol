// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

import "./IInfra.sol";

interface IAssign {
    /// The Assignment structure that is used internally.
    struct Assignment {
        /// Number of yield credits assigned
        uint yieldCredits;
        /// The unit that the credits are assigned to
        uint unitId;
        /// Who assigned the credits
        address owner;
        /// The timestamp when the assignment was created or updated
        uint64 timestamp;
        /// The USD value of 1 credit at the time the assignment was created/updated (per the PriceOracle)
        uint valueUsd;
    }

    /// An assignment has been created/updated/deleted
    ///
    /// @param id The ID of the assignment
    /// @param owner Who created the assignment
    /// @param unitId The unit that the credits were assigned to
    /// @param yieldCredits The number of credits that were assigned, 0 means deleted.
    /// @param timestamp The block timestamp when the assignment was created/updated
    /// @param valueUsd The value of 1 credit at the time of the assignment
    event Assign(uint id, address owner, uint unitId, uint256 yieldCredits, uint64 timestamp, uint valueUsd);


    function assignByOwnerUnit(address owner, uint unitId) external view returns (uint);

    function assignYc(uint unitId, uint256 yieldCredits) external;

    function getAssign(uint id) external view returns (
        address owner,
        uint256 yieldCredits,
        uint unitId,
        uint64 timestamp,
        uint valueUsd
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