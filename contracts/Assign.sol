// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interface/IInfra.sol";
import "./interface/IAssign.sol";
import "./interface/IPriceOracle.sol";
import "./libraries/IdProvider.sol";

contract Assign is IAssign, Ownable {
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
     * @dev The source of price of the asset.
     */
    IPriceOracle private self_priceOracle;

    /**
     * @param infra The infra contract
     */
    constructor(address infra, address priceOracle) Ownable(msg.sender) {
        self_infra = IInfra(infra);
        self_ids.init();
        self_priceOracle = IPriceOracle(priceOracle);
    }

    function assignByOwnerUnit(address owner, uint unitId) public override view returns (uint) {
        return self_assignmentIdByOwnerUnit[abi.encode(owner, unitId)];
    }

    function assignYc(uint unitId, uint256 yieldCredits) public override
    {
        uint aid = assignByOwnerUnit(msg.sender, unitId);
        uint valueUsd = self_priceOracle.getUpdatePriceUsd();
        if (aid == 0) {
            if (yieldCredits == 0) {
                return;
            }
            aid = self_ids.take();
            Assignment storage ass = self_assignments[aid];
            ass.owner = msg.sender;
            ass.unitId = unitId;
            ass.yieldCredits = yieldCredits;
            ass.valueUsd = valueUsd;
            ass.timestamp = uint64(block.timestamp);
            self_assignmentIdByOwnerUnit[abi.encode(msg.sender, unitId)] = aid;
        } else if (yieldCredits == 0) {
            delete self_assignmentIdByOwnerUnit[abi.encode(msg.sender, unitId)];
            delete self_assignments[aid];
            self_ids.release(aid);
        } else {
            Assignment storage ass = self_assignments[aid];
            ass.yieldCredits = yieldCredits;
            ass.valueUsd = valueUsd;
            ass.timestamp = uint64(block.timestamp);
        }
        emit Assign(aid, msg.sender, unitId, yieldCredits, uint64(block.timestamp), valueUsd);
    }

    function getAssign(uint id) external override view returns (
        address owner,
        uint256 yieldCredits,
        uint unitId,
        uint64 timestamp,
        uint valueUsd
    ) {
        Assignment memory ass = self_assignments[id];
        owner = ass.owner;
        yieldCredits = ass.yieldCredits;
        unitId = ass.unitId;
        timestamp = ass.timestamp;
        valueUsd = ass.valueUsd;
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

    function deleteUnit(uint unitId) external override {
        self_infra.deleteUnit(unitId, msg.sender);
        assignYc(unitId, 0);
    }

    function nextId() external override view returns (uint) {
        return self_ids.nextId;
    }

    function idFreeList(uint64 last) external override view returns (uint) {
        return self_ids.freeList[last];
    }

    function setPriceOracle(address priceOracle) external onlyOwner {
        self_priceOracle = IPriceOracle(priceOracle);
    }
}