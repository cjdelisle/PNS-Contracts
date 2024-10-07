// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./interface/IPNS.sol";
import "./interface/IInfra.sol";
import "./libraries/IdProvider.sol";

contract Infra is ERC721Enumerable, Ownable, IInfra {
    using IdProvider for IdProvider.Ids;

    uint8 constant UPDATE_TYPE = 1;
    uint8 constant UPDATE_DOMAIN = 2;
    uint8 constant UPDATE_NAME = 4;

    // The name service
    IPNS public self_ipns;

    // An ID provider which reuses IDs when possible
    IdProvider.Ids private self_ids;

    // For displaying imagines on the NFTs
    string private self_baseURI;

    // All units
    mapping(uint => Unit) self_unitById;

    mapping(address => bool) self_trusted;

    //--//

    constructor(address pnsAddress) ERC721("PKTInfra", "PKTI") Ownable(msg.sender) {
        self_ipns = IPNS(pnsAddress);
        self_ids.init();
    }

    // Update

    function registerUnit(
        UnitType t,
        uint64 parentDomain,
        string calldata name,
        address to
    ) external override returns (uint) {
        {
            address es = _effectiveSender(to);
            _checkDomainAuthorized(parentDomain, es);
        }
        require(t > UnitType.Invalid && t < UnitType.InvalidTooHigh, "Invalid type");
        uint newTokenId = self_ids.take();
        Unit storage unit = self_unitById[newTokenId];
        unit.unitType = t;
        unit.parentDomain = parentDomain;
        unit.name = name;
        _safeMint(to, newTokenId);
        emit RegisterUnit(msg.sender, newTokenId, msg.sender, to, t, parentDomain, name);
        return newTokenId;
    }

    function updateUnit(
        uint id,
        uint8 update,
        UnitType t,
        uint64 parentDomain,
        string calldata name,
        address onBehalfOf
    ) external override {
        onBehalfOf = _effectiveSender(onBehalfOf);
        _checkAuthorized(id, onBehalfOf);
        Unit storage unit = self_unitById[id];
        if ((update & UPDATE_TYPE) > 0) {
            require(t > UnitType.Invalid && t < UnitType.InvalidTooHigh, "Invalid type");
            unit.unitType = t;
        }
        if ((update & UPDATE_DOMAIN) > 0) {
            _checkDomainAuthorized(parentDomain, onBehalfOf);
            unit.parentDomain = parentDomain;
        }
        if ((update & UPDATE_NAME) > 0) {
            unit.name = name;
        }
        emit UpdateUnit(msg.sender, id, update, t, parentDomain, name);
    }

    function deleteUnit(uint id, address onBehalfOf) external override {
        onBehalfOf = _effectiveSender(onBehalfOf);
        _checkAuthorized(id, onBehalfOf);
        delete self_unitById[id];
        _burn(id);
        self_ids.release(id);
        emit DeleteUnit(msg.sender, id);
    }

    function domainEviction(uint id) external override {
        Unit storage unit = self_unitById[id];
        uint64 parentDomain = unit.parentDomain;
        _checkDomainAuthorized(parentDomain, msg.sender);
        unit.parentDomain = 0;
        emit DomainEvict(msg.sender, id);
    }

    // View

    function getUnit(uint id) external override view returns (
        UnitType t,
        uint64 parentDomain,
        string memory name,
        address owner
    ) {
        owner = _ownerOf(id);
        Unit storage unit = self_unitById[id];
        t = unit.unitType;
        parentDomain = unit.parentDomain;
        name = unit.name;
    }

    function getUnits(
        uint[] calldata ids
    ) external override view returns (
        Unit[] memory out,
        address[] memory owners
    ) {
        out = new Unit[](ids.length);
        owners = new address[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            out[i] = self_unitById[ids[i]];
            owners[i] = _ownerOf(ids[i]);
        }
    }

    function isTrustedContract(address c) external override view returns (bool trusted) {
        return self_trusted[c];
    }

    function nextId() external override view returns (uint) {
        return self_ids.nextId;
    }

    function idFreeList(uint64 last) external override view returns (uint) {
        return self_ids.freeList[last];
    }

    // Admin

    function trustContract(address c, bool trusted) external override onlyOwner {
        if (trusted) {
            self_trusted[c] = true;
        } else {
            delete self_trusted[c];
        }
    }

    function setUriPrefix(string calldata pfx) external override onlyOwner {
        self_baseURI = pfx;
    }

    function setPns(address pns) external override onlyOwner {
        self_ipns = IPNS(pns);
    }

    // Internal

    function _baseURI() internal view override returns (string memory) {
        return self_baseURI;
    }

    function _effectiveSender(address to) private view returns (address) {
        if (self_trusted[msg.sender]) {
            return to;
        }
        return msg.sender;
    }

    function _checkDomainAuthorized(uint64 parentDomain, address addr) private view {
        if (parentDomain > 0) {
            require(self_ipns.authorizedFor(parentDomain, addr), "Not the owner of parentDomain");
        }
    }

    function _checkAuthorized(uint id, address who) private view {
        address owner = _ownerOf(id);
        require(owner != address(0), "Unit not registered");
        require(_isAuthorized(owner, who, id), "Not authorized to update unit");
    }
}