// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

import "./IInfra.sol";

interface IAssign {
    struct Assignment {
        address owner;
        uint yieldCredits;
        uint unitId;
    }

    event Assign(address owner, uint unitId, uint256 yieldCredits);

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
}