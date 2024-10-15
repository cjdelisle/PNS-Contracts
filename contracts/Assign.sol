// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

import "./interface/IInfra.sol";
import "./interface/IAssign.sol";
import "./libraries/IdProvider.sol";

contract Assign is IAssign {
    using IdProvider for IdProvider.Ids;

    /**
     * @dev The infra contract, for combined create/assign and update/assign.
     */
    IInfra immutable self_infra;

    /**
     * @dev An ID provider which reuses IDs when possible
     */
    IdProvider.Ids private self_ids;

    /**
     * @dev All assignments
     */
    mapping(uint => Assignment) self_assignments;
    
    /**
     * @dev Assignment ID by hash(owner + unit)
     */
    mapping(bytes => uint) self_assignmentIdByOwnerUnit;

    /**
     * @param infra The infra contract
     */
    constructor(address infra) {
        self_infra = IInfra(infra);
        self_ids.init();
    }

    function assignByOwnerUnit(address owner, uint unitId) public override view returns (uint) {
        return self_assignmentIdByOwnerUnit[abi.encode(owner, unitId)];
    }

    function assignYc(uint unitId, uint256 yieldCredits) public override
    {
        uint aid = assignByOwnerUnit(msg.sender, unitId);
        if (aid == 0) {
            if (yieldCredits == 0) {
                return;
            }
            aid = self_ids.take();
            Assignment storage ass = self_assignments[aid];
            ass.owner = msg.sender;
            ass.unitId = unitId;
            ass.yieldCredits = yieldCredits;
            self_assignmentIdByOwnerUnit[abi.encode(msg.sender, unitId)] = aid;
        } else if (yieldCredits == 0) {
            delete self_assignmentIdByOwnerUnit[abi.encode(msg.sender, unitId)];
            delete self_assignments[aid];
            self_ids.release(aid);
        } else {
            self_assignments[aid].yieldCredits = yieldCredits;
        }
        emit Assign(aid, msg.sender, unitId, yieldCredits);
    }

    function getAssign(uint id) external override view returns (
        address owner,
        uint256 yieldCredits,
        uint unitId
    ) {
        Assignment memory ass = self_assignments[id];
        owner = ass.owner;
        yieldCredits = ass.yieldCredits;
        unitId = ass.unitId;
    }

    function getAssigns(uint[] calldata ids) external override view returns (Assignment[] memory out) {
        out = new Assignment[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
           out[i] = self_assignments[ids[i]];
        }
    }

    function registerAndAssign(
        IInfra.UnitType t,
        uint64 parentDomain,
        string calldata name,
        uint yieldCredits,
        address to
    ) external override returns (uint) {
        uint unitId = self_infra.registerUnit(t, parentDomain, name, to);
        assignYc(unitId, yieldCredits);
        return unitId;
    }

    function updateAndAssign(
        uint unitId,
        uint8 update,
        IInfra.UnitType t,
        uint64 parentDomain,
        string calldata name,
        uint yieldCredits
    ) external override {
        self_infra.updateUnit(unitId, update, t, parentDomain, name, msg.sender);
        assignYc(unitId, yieldCredits);
    }

    function nextId() external override view returns (uint) {
        return self_ids.nextId;
    }

    function idFreeList(uint64 last) external override view returns (uint) {
        return self_ids.freeList[last];
    }
}