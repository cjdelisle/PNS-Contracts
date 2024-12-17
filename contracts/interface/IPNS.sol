// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

import "../external/ILockBox.sol";

interface IPNS {

    // Events

    /// A pre-registration was created
    /// @param sender who did the preregistration
    /// @param nameHash The hash of the lockup ID, name, and initial records.
    /// @param lockupId The lockup ID that is included in the hash.
    event Preregister(address sender, bytes32 nameHash, uint64 lockupId);

    /// A preregistraton was deleted
    /// @param sender who destroyed the preregistration
    /// @param nameHash The hash of the lockup ID, name, and initial records.
    /// @param lockupId The lockup ID.
    event DestroyPrereg(address sender, bytes32 nameHash, uint64 lockupId);

    /// A domain was registered
    /// @param sender who registered the domain (not necessarily the owner)
    /// @param id The ID of the new domain
    /// @param lockupId The lockup ID of the lockbox that owns the domain
    /// @param name The domain name itself
    /// @param records Initial records that were associated with the domain
    event Register(address sender, uint64 id, uint64 lockupId, bytes name, bytes records);

    /// Domain records were updated
    /// @param sender who updated the records
    /// @param id The ID of the (sub)domain
    /// @param records The new records to enter
    event UpdateRecords(address sender, uint64 id, bytes records);

    /// A domain was taken over, this means either the owner is switching it to a different lockup
    /// or the owner unlocked the lockup and so now it is up for grabs and someone took it.
    /// @param sender who did the takeover
    /// @param id The domain ID
    /// @param oldLockupId The old lockup ID
    /// @param newLockupId The new lockup ID
    /// @param records new records that were assigned
    event Takeover(address sender, uint64 id, uint64 oldLockupId, uint64 newLockupId, bytes records);

    /// The owner of the domain has created a subdomain
    /// @param sender who made the subdomain
    /// @param id The ID of the subdomain
    /// @param parentId The ID of the domain
    /// @param name The fully qualified domain name of the subdomain
    /// @param records The initial DNS records to set for the subdomain
    event CreateSubdomain(address sender, uint64 id, uint64 parentId, bytes name, bytes records);

    /// A domain or subdomain has been deleted.
    /// This could be done by the owner of the domain, or in the case that the underlying lockup was
    /// unlocked, this could be done by anyone - the same as takeover.
    /// @param sender who did the operation.
    /// @param id the ID of the (sub)domain.
    event Destroy(address sender, uint64 id);

    /// A (sub)domain was blacklisted or unblacklisted.
    /// @param sender Who did the operation
    /// @param id The ID of the domain
    /// @param isBlacklisted True if the operation has made the domain blacklisted.
    event Blacklist(address sender, uint64 id, bool isBlacklisted);

    /// The stored representation of a domain or subdomain.
    struct Domain {
        /// If this is a top level domain, then this is the lockup id of the owner.
        /// If this is a subdomain, then this is the ID of the top level domain.
        uint64 owner;

        /// Number of subdomains, if 0xff then this IS a subdomain.
        uint8 subdomains;

        /// True if the admin has marked this domain as blacklisted for the purpose of public resolvers.
        bool blacklisted;

        /// The FQDN of this domain (excluding .pkt. at the end)
        bytes name;

        /// Binary encoded representation of the records as updated by the owner
        bytes records;
    }

    /// The lockbox of which the lockup holder is the owner and controller of the domain.
    function lockboxContract() external returns (ILockBox);

    /// The minimum amount of value that you must have locked in order to register / preregister
    /// a domain. This starts at double the amount of the previous registration, and it decays
    /// by 50% per halvingSeconds seconds.
    function currentMinLockup() external view returns (uint256 price);

    /// Get the value of assets in a given lockbox.
    /// This function does not care whether the lockbox is staked for a time period or is even matured,
    /// only that it is not withdrawn, because when it is withdrawn the lockup entry is deleted so
    /// the values becomes zero.
    function getLockupValuation(uint256 lockupId) external view returns (uint256);

    /// Compute the hash which must be passed to preregister as the nameHash.
    /// 
    /// @param lockupId The lockup which will become the owner of the domain.
    /// @param name The domain name, dots are forbidden in domain names because they would interfere
    ///             with other people creating subdomains. Other than that, no error checking is done
    ///             at the contract level, but capital letters or disallowed characters will result in
    ///             a domain that cannot be resolved.
    /// @param records A byte array which represents a packed list of DNS records which will be used.
    /// @return nameHash A hash that can be used for calling preregister()
    function computePreregHash(
        uint64 lockupId,
        bytes calldata name,
        bytes calldata records
    ) external pure returns (bytes32);

    /// In order to prevent malicious actors from watching for unconfirmed name registrations and
    /// frontrunning them with their own, you are required to pre-register before you register a name.
    /// You pre-register by passing in the nameHash (which you can compute with computePreregHash()) plus
    /// the lockup ID of the lockup that you plan to use for this name.
    /// Preregistrations are valid for 24 hours, or until the underlying lockup is unstaked. After either
    /// of these events, preregistrations are nolonger usable and can be removed by anyone by calling
    /// destroyPrereg().
    /// 
    /// @param nameHash The hash of the name, lockupId, and records you intend to insert. Can be computed
    ///                 using computePreregHash()
    /// @param lockupId The id of the lockup which should take ownership of this domain, you must own this
    ///                 lockup in order to pre-register. This lockup's value (i.e. getLockupValuation()) must
    ///                 be at least equal to currentMinLockup(). This lockup must not have been used to
    ///                 register any other currently active domain. Ownership of the domain can be switched
    ///                 to a different lockup using the takeover() function, but that lockup must have a
    ///                 value of at least currentMinLockup() AT THE TIME OF takeover().
    ///                 If the lockup is unstaked while the domain is active, anyone with a qualifying lockup
    ///                 will be able to takeover() the domain, and anyone at all will be able to destroy() it.
    ///                 This id MUST match the one passed to computePreregHash() or else register() will fail.
    function preregister(bytes32 nameHash, uint64 lockupId) external;

    /// A preregistration can be removed under one of the following three conditions:
    /// 1. It has expired (it is more than 24 hours old)
    /// 2. The lockup which owns it has been unstaked
    /// 3. You are authorized to administer the lockup (normally meaning, you're the owner)
    ///
    /// The arguments to this function are the same as those to preregister().
    function destroyPrereg(bytes32 nameHash, uint64 lockupId) external;

    /// After pre-registering, you can register your domain. You cannot register in the same block as
    /// pre-registering because that would enable front-running attacks. This function can be called by
    /// anyone, not only the person who pre-registered, but ownership will go to the person who
    /// pre-registered. The arguments to this function MUST be precisely the same as those passed to
    /// computePreregHash() when creating the pre-registration hash.
    function register(
        uint64 lockupId,
        bytes calldata name,
        bytes calldata records
    ) external;

    /// Get the lockup ID of the lockup that owns the domain.
    ///
    /// @param id The ID of the domain
    /// @return The lockbox ID of the owner lockup
    function ownerLockup(uint64 id) external view returns (uint64);

    /// Check if a given address is authorized to manipulate the lockup which underlies this domain.
    /// See: ERC-721 getApproved() and isApprovedForAll()
    /// 
    /// @param id The ID of the domain
    /// @param who The address to check
    /// @return true if the address is authorized
    function authorizedFor(uint64 id, address who) external view returns (bool);

    /// Update the DNS records for a domain or subdomain.
    /// This can only be called by an authorized party for the lockup that owns the domain.
    /// 
    /// @param id The id of the domain or subdomain, use getDomainIdByFQDN() to look it up.
    /// @param records A binary packed representation of the domain records.
    function updateRecords(
        uint64 id,
        bytes calldata records
    ) external;

    /// Take over a domain which is either your own, and you are switching which lockup is
    /// associated with the domain, or it is somebody elses and they have unstaked their lockup.
    /// In order to takeover a domain, you must have the same lockup valuation that you would need to
    /// preregister.
    /// You cannot takeover a subdomain, but after you have taken over the parent domain, you can then
    /// updateRecords() and/or destroy() any of it's subdomains as you are now the owner.
    /// 
    /// @param id The ID of the domain.
    /// @param newLockupId The lockup ID that you wish to associate to this domain.
    /// @param records New domain records which you wish to set to this domain. If this is an empty array
    ///                then the domain's records will remain unchanged.
    function takeover(
        uint64 id,
        uint64 newLockupId,
        bytes calldata records
    ) external;

    /// Create a subdomain of your domain.
    /// To create a subdomain, you must own the parent domain. You cannot create a subdomain of a subdomain
    /// but you can create a subdomain with a subdomainLabel that has dots in it, for example
    /// "the.coolest.subdomain" under domain "cjd" will resolve as "the.coolest.subdomain.cjd(.pkt)".
    /// Subdomains cannot be sold off to anyone else, you, the lockbox owner, always own all subdomains
    /// because you are uniquely able to unstake and cause the domain and all of it's subdomains to be lost.
    /// Each domain can have a maximum of 254 subdomains.
    /// 
    /// @param parentId The ID of the domain underwhich to create a subdomain, use getDomainIdByFQDN() to get
    ///                 the id of your domain.
    /// @param subdomainLabel The name of the subdomain. Dots are legal in subdomain names.
    ///                       Normal DNS rules apply to naming but are not checked at the contract level.
    /// @param records A binary packed representation of the DNS records which should apply to this subdomain.
    function createSubdomain(
        uint64 parentId,
        bytes calldata subdomainLabel,
        bytes calldata records
    ) external;

    /// Destroy a domain or subdomain. A domain cannot be destroyed until after ALL of it's subdomains have
    /// been destroyed. You may destroy a domain or subdomain if you are authorized (see authorizedFor()), or
    /// if the owner has  unstaked the lockbox which controls it.
    /// 
    /// @param id The ID of the domain or subdomain to destroy, see getDomainIdByFQDN()
    function destroy(uint64 id) external;

    /// A structure allowing you to create multiple new subdomains in the same transaction.
    struct NewSubdomain {
        /// ID of the parent domain for the new subdomain.
        uint64 parentId;
        /// The subdomain label
        bytes subdomainLabel;
        /// Binary packed representation of domain records
        bytes records;
    }

    /// A structure allowing for multiple DNS record updates in a single transaction.
    struct RecordUpdate {
        /// The ID of the domain whose records should be updated.
        uint64 id;
        /// A binary packed representation of the records to update.
        bytes records;
    }

    /// Perform multiple updates in a single transaction.
    /// 
    /// @param newSubdomains New subdomains to create
    /// @param recordUpdates DNS records to update
    /// @param destroyDomains Domains / subdomains to destroy
    function updateMultiple(
        NewSubdomain[] calldata newSubdomains,
        RecordUpdate[] calldata recordUpdates,
        uint64[] calldata destroyDomains
    ) external;

    // View functions

    /// Get the next domain ID.
    /// Any ID greater than or equal to this is guaranteed not to corrispond to an existing domain.
    function nextDomainId() external view returns (uint);

    /// Observe the ID free list. Calling this with last = 0 will give you the head of the list, call with the
    /// value given to walk the list.
    function domainIdFreeList(uint64 last) external view returns (uint);

    /// Get the details of a domain by its ID.
    /// 
    /// @param id The id of the domain or subdomain to get information for, see getDomainIdByFQDN()
    /// @return owner The owner of the domain, if this is a subdomain then this is the domain ID of the parent,
    ///               otherwise it is the lockup ID of the lockup that owns the domain.
    /// @return subdomains The number of subdomains, if this is 0xff then this IS a subdomain.
    /// @return blacklisted True if the domain has been blacklisted
    /// @return name The name of the domain, if this is empty then it means the domain does not exist.
    /// @return records A binary packed representation of the domain records.
    function getDomain(uint64 id) external view returns (
        uint64 owner,
        uint8 subdomains,
        bool blacklisted,
        bytes memory name,
        bytes memory records
    );

    /// Get multiple domains in one RPC call.
    /// 
    /// @param ids The list of IDs of domains to get.
    /// @return out The domains that have been accessed. If an ID in the list doesn't exist, the resulting
    ///             Domain's `name` field will be empty.
    function getDomains(uint64[] calldata ids) external view returns (Domain[] memory out);

    /// Get the domain ID of a domain by the lockup ID of the lock box.
    /// 
    /// @param lockupId The lockup id
    /// @return The domain ID, or zero if there is no domain for this lock box.
    function getDomainIdByLockupId(uint64 lockupId) external view returns (uint64);

    /// Get the domain ID of a domain by the full domain name (except the ".pkt." suffix).
    /// 
    /// @param fqdn The domain name, for example "the.coolest.is.cjd" will get the subdomain
    ///             the.coolest.is.cjd.pkt
    /// @return The domain ID, or zero if there is no domain for this name.
    function getDomainIdByFQDN(bytes calldata fqdn) external view returns (uint64);

    /// Get the internal info about the minimum lockup value needed for registering a domain.
    /// Normally you should use currentMinLockup() but this will give you the internal state.
    /// 
    /// @return pricer The tool for determining the current cost (min lockup) of a domain
    /// @return lastRegTime Time of last domain registration (seconds since the epoch)
    /// @return lastRegPrice The lockup value from the most recently registered domain.
    function getPricingInfo() external view returns (
        address pricer,
        uint64 lastRegTime,
        uint256 lastRegPrice
    );

    /// Get the internal state of the pre-registration table. Normally you should not need this.
    /// 
    /// @param nameHash The pre-registration hash as computed by computePreregHash()
    /// @return timestamp The timestamp of the pre-registration entry.
    /// @return lockupId The lockup ID that is associated with the pre-registration.
    function getPrereg(bytes32 nameHash) external view returns (
        uint64 timestamp,
        uint64 lockupId
    );

    /// Check if a given address is whitelisted for registration right now.
    /// 
    /// @param addr The address to check.
    /// @return Whether or not the address is whitelisted.
    function isAddressWhitelisted(address addr) external view returns (bool);

    /// Check whether the address whitelist is currently active
    function isRegistrationWhitelistActive() external view returns (bool);

    /// Get the address which is currently delegated as the admin.
    function getAdmin() external view returns (address);

    // Administrative functions

    /// Set the administrator address (owner only)
    function setAdmin(address admin) external;

    /// Set the price halving time (admin only)
    function setPricer(address pricer) external;

    /// Change the effective lockbox (for upgradability)
    function setLockbox(address lbox) external;

    /// A struct for adding and removing addresses from the whitelist
    struct AllowedAddress {
        /// The relevant address
        address addr;
        /// True if the address is being added, false if removed
        bool allowed;
    }

    /// Update the list of addresses which are allowed to register domains (admin only).
    /// @param allowed The list of addresses to add/remove
    /// @param activate If true, the whitelist begins enforcing, if false, then it stops enforcing.
    function updateRegistrationWhitelist(AllowedAddress[] calldata allowed, bool activate) external;

    /// Blacklist or unblacklist a domain (admin only)
    /// 
    /// @param id The ID of the domain or subdomain
    /// @param blacklisted True to blacklist, false to unblacklist
    function setDomainBlacklisted(uint64 id, bool blacklisted) external;
}