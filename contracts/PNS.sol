// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./external/ILockBox.sol";
import "./interface/IPNS.sol";
import "./libraries/IdProvider.sol";

import "hardhat/console.sol";

contract PNS is Ownable, IPNS {
    using IdProvider for IdProvider.Ids;

    // Constants

    /// How long a preregistration survives for, before it is invalidated
    uint64 public constant PREREG_LIFETIME_SECONDS = 60*60*24;

    // Public fields

    /// The lockbox of which the lockup holder is the owner and controller of the domain.
    ILockBox public immutable lockboxContract;

    // Private fields

    /// An ID provider which reuses IDs when possible
    IdProvider.Ids private self_ids;

    /// Time of the last domain preregistration
    uint64 private self_lastRegTimeSec;

    /// Halving period of the domain price
    uint64 private self_priceHalvingPeriodSeconds = 60*60;

    /// Price of the next registration (if registered at exactly the same time as the last)
    uint256 private self_nextRegPrice = 1;

    /// A mapping of domains by ID
    mapping(uint64 => Domain) private self_domainById;

    /// Mapping of domain ID by lockup ID, subdomains are excluded
    mapping(uint64 => uint64) private self_domainByLockupId;

    /// Mapping of domain ID by fully qualified domain name (excluding .pkt. suffix)
    mapping(bytes => uint64) private self_domainByFQDN;

    /// The pre-registration structure
    struct Prereg {
        /// The time when the pre-registration took place.
        uint64 timestamp;

        /// The lockup ID which pre-registered.
        uint64 lockupId;
    }

    /// Pre-registration (to avoid getting front-run by someone else during registration)
    /// The key is the keccak256 hash of abi.encode(name,lockupId,records) where records
    /// are the initial records to store when registering.
    mapping(bytes32 => Prereg) private self_preregs;

    /// A list of addresses that are authorized to register domains at this time
    mapping(address => bool) private self_registrationWhitelist;

    /// If true, the registration whitelist is currently active
    bool private self_registrationWhitelistActive;

    /// The administrator address, this address can be configured by the owner.
    address private self_admin;

    /// @param _lockboxContract The contract of the PKT LockBox
    /// @param _whitelistActive True if a registration whitelist should be set as active now.
    constructor(ILockBox _lockboxContract, bool _whitelistActive) Ownable(msg.sender) {
        lockboxContract = _lockboxContract;
        self_registrationWhitelistActive = _whitelistActive;
        self_admin = msg.sender;
        self_ids.init();
    }

    function currentMinLockup() public override view returns (uint256 price) {
        uint64 partialTime;
        uint64 halvingSeconds = self_priceHalvingPeriodSeconds;
        {
            uint64 secondsSinceLast = uint64(block.timestamp) - self_lastRegTimeSec;
            partialTime = secondsSinceLast % halvingSeconds;
            price = self_nextRegPrice >> (secondsSinceLast / halvingSeconds);
        }
        if (partialTime > 0) {
            // Price ranges from 1/2 to 1 linearly with the ratio of partialTime : halvingSeconds
            price = price / 2 + price * partialTime / halvingSeconds / 2;
        }
        if (price == 0) {
            price = 1;
        }
    }

    function getLockupValuation(uint256 lockupId) public override view returns (uint256) {
        (
            uint256 amountAsset,
            ,
            uint256 lpTokenValuation,
            ,
            ,
            ,
            ,
            ,
        ) = lockboxContract.lockups(lockupId);
        return amountAsset + lpTokenValuation;
    }

    function computePreregHash(
        uint64 lockupId,
        bytes calldata name,
        bytes calldata records
    ) public override pure returns (bytes32) {
        return keccak256(abi.encode(name,lockupId,records));
    }

    function preregister(bytes32 nameHash, uint64 lockupId) external override {
        _checkAuthorizedForLockup(msg.sender, lockupId);
        require(self_domainByLockupId[lockupId] == 0, "Lockup already used for another domain");
        if (self_registrationWhitelistActive) {
            require(self_registrationWhitelist[msg.sender], "Only whitelisted addresses can register at this time");
        }
        {
            uint256 value = getLockupValuation(lockupId);
            require(value >= currentMinLockup(), "Lockup does not have enough value of assets");
            self_lastRegTimeSec = uint64(block.timestamp);
            self_nextRegPrice = value * 2;
        }
        {
            Prereg storage pr = self_preregs[nameHash];
            pr.lockupId = lockupId;
            pr.timestamp = uint64(block.timestamp);
        }
        emit Preregister(msg.sender, nameHash, lockupId);
    }

    function destroyPrereg(bytes32 nameHash, uint64 lockupId) external override {
        Prereg storage pr = self_preregs[nameHash];
        require(pr.lockupId == lockupId, "Mismatching lockup id");
        if (uint64(block.timestamp) < pr.timestamp + PREREG_LIFETIME_SECONDS) {
            uint256 value = getLockupValuation(lockupId);
            if (value > 0) {
                _checkAuthorizedForLockup(msg.sender, lockupId);
            }
        }
        delete self_preregs[nameHash];
        emit DestroyPrereg(msg.sender, nameHash, lockupId);
    }

    function register(
        uint64 lockupId,
        bytes calldata name,
        bytes calldata records
    ) external override {
        require(name.length > 0, "Name cannot be empty");
        for (uint i = 0; i < name.length; i++) {
            // This is the only restriction we actually enforce at the contract level
            // because a name registered with dots in it will interfere with someone
            // else creating a subdomain.
            // All other restrictions are handled by the resolver.
            // for example: a domain with a \0 in it could be registered but the resolvers will ignore it.
            require(name[i] != '.', "Names cannot have dots in them");
        }
        {
            bytes32 nameHash = computePreregHash(lockupId, name, records);
            Prereg memory pr = self_preregs[nameHash];
            require(pr.lockupId == lockupId, "Must use same lockup when registering as preregistering");
            require(block.timestamp > pr.timestamp && block.timestamp < pr.timestamp + PREREG_LIFETIME_SECONDS,
                "Domain must be pre-registered first");
            delete self_preregs[nameHash];
        }
        {
            uint256 value = getLockupValuation(lockupId);
            require(value > 0, "Cannot register a domain with a lockup which has been released");
        }
        require(self_domainByLockupId[lockupId] == 0, "Lockbox already used for another domain");
        require(self_domainByFQDN[name] == 0, "Domain already registered");
        {
            uint64 id = uint64(self_ids.take());
            Domain storage dom = self_domainById[id];
            dom.name = name;
            dom.owner = lockupId;
            dom.records = records;
            dom.subdomains = 0;
            dom.blacklisted = false;
            self_domainByLockupId[lockupId] = id;
            self_domainByFQDN[name] = id;
            emit Register(msg.sender, id, lockupId, name, records);
        }
    }

    function ownerLockup(uint64 id) public view override returns (uint64) {
        Domain memory dom = self_domainById[id];
        require(self_domainByFQDN[dom.name] == id, "Domain does not exist");
        uint64 owner = dom.owner;
        if (dom.subdomains == 0xff) {
            owner = self_domainById[dom.owner].owner;
        }
        return owner;
    }

    function authorizedFor(uint64 id, address who) public view override returns (bool) {
        uint64 lockupId = ownerLockup(id);
        return _isAuthorizedForLockup(who, lockupId);
    }

    function updateRecords(
        uint64 id,
        bytes calldata records
    ) public override {
        Domain storage dom = self_domainById[id];
        require(self_domainByFQDN[dom.name] == id, "Domain does not exist");
        uint64 owner = dom.owner;
        if (dom.subdomains == 0xff) {
            owner = self_domainById[dom.owner].owner;
        }
        _checkAuthorizedForLockup(msg.sender, owner);
        dom.records = records;
        emit UpdateRecords(msg.sender, id, records);
    }

    function takeover(
        uint64 id,
        uint64 newLockupId,
        bytes calldata records
    ) external override {
        {
            uint256 value = getLockupValuation(newLockupId);
            require(value >= currentMinLockup(), "Lockup does not have enough value of assets");
            self_lastRegTimeSec = uint64(block.timestamp);
            self_nextRegPrice = value * 2;
        }
        {
            Domain storage dom = self_domainById[id];
            require(self_domainByFQDN[dom.name] == id, "Domain does not exist");
            require(dom.subdomains < 0xff, "Can't takeover a subdomain");
            uint64 oldLockupId = dom.owner;
            require(getLockupValuation(oldLockupId) == 0 || _isAuthorizedForLockup(msg.sender, oldLockupId),
                "Can only takeover a domain if the lockup was released or you're authorized by the owner");
            dom.owner = newLockupId;
            if (records.length > 0) {
                dom.records = records;
            }
            emit Takeover(msg.sender, id, oldLockupId, newLockupId, records);
        }
    }

    function createSubdomain(
        uint64 parentId,
        bytes calldata subdomainLabel,
        bytes calldata records
    ) public override {
        bytes memory fqdn;
        bool blacklisted;
        {
            Domain storage dom = self_domainById[parentId];
            require(self_domainByFQDN[dom.name] == parentId, "Parent domain does not exist");
            // This also triggers is someone tries to make 255 subdomains
            require(dom.subdomains < 0xfe, "Can't make a subdomain of a subdomain");
            _checkAuthorizedForLockup(msg.sender, dom.owner);
            dom.subdomains++;
            fqdn = bytes.concat(subdomainLabel, bytes("."), dom.name);
            blacklisted = dom.blacklisted;
            require(self_domainByFQDN[fqdn] == 0, "Subdomain already exists");
        }
        {
            uint64 id = uint64(self_ids.take());
            self_domainByFQDN[fqdn] = id;
            Domain storage dom = self_domainById[id];
            dom.subdomains = 0xff;
            dom.name = fqdn;
            dom.owner = parentId;
            dom.records = records;
            dom.blacklisted = blacklisted;
            emit CreateSubdomain(msg.sender, id, parentId, fqdn, records);
        }
    }

    function destroy(uint64 id) public override {
        Domain storage dom = self_domainById[id];
        require(self_domainByFQDN[dom.name] == id, "Domain does not exist");
        uint64 lockup;
        if (dom.subdomains == 0xff) {
            Domain storage parent = self_domainById[dom.owner];
            lockup = parent.owner;
            parent.subdomains--;
        } else {
            require(dom.subdomains == 0, "Can't destroy a domain which still has subdomains");
            lockup = dom.owner;
            delete self_domainByLockupId[lockup];
        }
        if (!_isAuthorizedForLockup(msg.sender, lockup)) {
            uint256 value = getLockupValuation(lockup);
            require(value == 0, "Cannot destroy someone else's domain unless their lockup is released");
        }
        delete self_domainByFQDN[dom.name];
        delete self_domainById[id];
        self_ids.release(id);
        emit Destroy(msg.sender, id);
    }

    function updateMultiple(
        NewSubdomain[] calldata newSubdomains,
        RecordUpdate[] calldata recordUpdates,
        uint64[] calldata destroyDomains
    ) external override {
        for (uint8 i = 0; i < newSubdomains.length; i++) {
            NewSubdomain calldata ns = newSubdomains[i];
            createSubdomain(ns.parentId, ns.subdomainLabel, ns.records);
        }
        for (uint8 i = 0; i < recordUpdates.length; i++) {
            RecordUpdate calldata ru = recordUpdates[i];
            updateRecords(ru.id, ru.records);
        }
        for (uint8 i = 0; i < destroyDomains.length; i++) {
            destroy(destroyDomains[i]);
        }
    }

    // View functions

    function nextDomainId() external override view returns (uint) {
        return self_ids.nextId;
    }

    function domainIdFreeList(uint64 last) external override view returns (uint) {
        return self_ids.freeList[last];
    }

    function getDomain(uint64 id) external override view returns (
        uint64 owner,
        uint8 subdomains,
        bool blacklisted,
        bytes memory name,
        bytes memory records
    ) {
        Domain memory dom = self_domainById[id];
        owner = dom.owner;
        name = dom.name;
        records = dom.records;
        subdomains = dom.subdomains;
        blacklisted = dom.blacklisted;
    }

    function getDomains(uint64[] calldata ids) external override view returns (Domain[] memory out) {
        out = new Domain[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            out[i] = self_domainById[ids[i]];
        }
    }

    function getDomainIdByLockupId(uint64 lockupId) external override view returns (uint64) {
        return self_domainByLockupId[lockupId];
    }

    function getDomainIdByFQDN(bytes calldata fqdn) external override view returns (uint64) {
        return self_domainByFQDN[fqdn];
    }

    function getMinLockupInfo() external override view returns (
        uint64 lastRegTime,
        uint64 priceHalvingPeriodSeconds,
        uint256 nextMinLockup
    ) {
        lastRegTime = self_lastRegTimeSec;
        priceHalvingPeriodSeconds = self_priceHalvingPeriodSeconds;
        nextMinLockup = self_nextRegPrice;
    }

    function getPrereg(bytes32 nameHash) external override view returns (
        uint64 timestamp,
        uint64 lockupId
    ) {
        Prereg memory pr = self_preregs[nameHash];
        lockupId = pr.lockupId;
        timestamp = pr.timestamp;
    }

    function isAddressWhitelisted(address addr) external override view returns (bool) {
        return self_registrationWhitelist[addr];
    }

    function isRegistrationWhitelistActive() external override view returns (bool) {
        return self_registrationWhitelistActive;
    }

    function getAdmin() external override view returns (address) {
        return self_admin;
    }

    // Administrative functions

    function setAdmin(address admin) external override onlyOwner {
        self_admin = admin;
    }

    function setPriceHalvingSeconds(uint64 halvingSeconds) external override {
        require(msg.sender == self_admin, "Admin only");
        self_priceHalvingPeriodSeconds = halvingSeconds;
    }

    function updateRegistrationWhitelist(AllowedAddress[] calldata allowed, bool activate) external override {
        require(msg.sender == self_admin, "Admin only");
        for (uint8 i = 0; i < allowed.length; i++) {
            if (allowed[i].allowed) {
                self_registrationWhitelist[allowed[i].addr] = true;
            } else {
                delete self_registrationWhitelist[allowed[i].addr];
            }
        }
        self_registrationWhitelistActive = activate;
    }

    function setDomainBlacklisted(uint64 id, bool blacklisted) external override {
        require(msg.sender == self_admin, "Admin only");
        Domain storage dom = self_domainById[id];
        require(self_domainByFQDN[dom.name] == id, "Domain does not exist");
        dom.blacklisted = blacklisted;
        emit Blacklist(msg.sender, id, blacklisted);
    }

    // Private

    function _isAuthorizedForLockup(address who, uint64 lockupId) private view returns (bool) {
        address owner = lockboxContract.ownerOf(lockupId);
        if (owner == who) {
            return true;
        }
        if (lockboxContract.getApproved(lockupId) == who) {
            return true;
        }
        return lockboxContract.isApprovedForAll(owner, who);
    }

    function _checkAuthorizedForLockup(address who, uint64 lockupId) private view {
        require(_isAuthorizedForLockup(who, lockupId), "Unauthorized");
    }
}