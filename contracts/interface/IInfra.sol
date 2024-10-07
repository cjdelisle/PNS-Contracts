// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/interfaces/IERC721Metadata.sol";
import "@openzeppelin/contracts/interfaces/IERC721Enumerable.sol";

// The contract for representing Infrastructure Units
// (cjdns nodes, domains VPNs, nameservers, and route servers)
// This contract is essentially declarative. You can enter anything you want and
// it will only really have effect after it's checked if the unit is actually operational.
// Each Unit is an NFT so once you create one, you can administer it.
// The contract is also Ownable and the owner can:
// 1. Nominate "trusted" contracts which can act on others' behalf.
// 2. Set the base URI for the NFT images.
//
interface IInfra is IERC721Metadata, IERC721Enumerable {
    // The type of the infra unit
    enum UnitType {

        // Unit type zero is not valid
        Invalid,

        // Cjdns public peer with VPN disabled
        Cjdns,

        // Cjdns VPN with public peering disabled
        Vpn,

        // Cjdns public peer with VPN enabled
        CjdnsVpn,

        // Cjdns private node with VPN disabled (does not yield)
        PrivateCjdns,

        // Public domain name (e.g. pkt.wiki)
        Domain,

        // Domain name which is willing to resolve blacklisted domains
        DomainDangerous,

        // Nameserver
        Nameserver,

        // Route Server
        RouteServer,

        // Invalid item
        InvalidTooHigh
    }

    // The structure which represents an infra unit
    struct Unit {
        // For cjdns/vpn/nameserver/routeserver
        //     * Non-zero = the domain to hang this node off of
        //     * Zero = .no-name.pkt special domain
        // For domains -> Always zero
        uint64 parentDomain;

        // The type of the unit
        UnitType unitType;

        // For cjdns/vpn/nameserver/routeserver -> The hostname/subdomain
        // For domains -> The FQDN
        string name;
    }

    /**
     * Emitted when a new unit is registered, anyone can cause this to be emitted
     * it does NOT mean any infrastructure actually exists.
     * @param sender The address which make the call
     * @param newId The ID of the new unit
     * @param creator Who invoked the function
     * @param recipient Who will receive the NFT of the unit and therefore yield on it
     * @param t The type of the unit
     * @param parentDomain The ID of the domain which the unit is associated with (0 = none)
     * @param name The name of the unit
     */
    event RegisterUnit(address sender, uint newId, address creator, address recipient, UnitType t,
        uint64 parentDomain, string name);

    /**
     * Emitted when someone updates some data about their infra unit.
     * @param sender The address which make the call
     * @param id The ID of the updated unit
     * @param updateMask A bitmask of items which are being updated,
     *                   see: Infra.UPDATE_TYPE, Infra.UPDATE_DOMAIN, Infra.UPDATE_NAME
     * @param t The unit type to change to, if applicable
     * @param parentDomain The new parent domain, if applicable
     * @param name The name to change to, if applicable
     */
    event UpdateUnit(address sender, uint id, uint8 updateMask, UnitType t, uint64 parentDomain, string name);

    /// Emitted when a unit is deleted
    /// 
    /// @param sender The address which make the call
    /// @param id The ID of the unit to be deleted
    event DeleteUnit(address sender, uint id);

    /// The unit got evicted by the domain holder.
    /// 
    /// @param sender The address which made the call
    /// @param id The ID of the unit that was evicted
    event DomainEvict(address sender, uint id);

    // Create/Update/Delete

    /**
     * Register a new unit.
     * Anyone can call this, it does not imply that the underlying infrastructure actually exists.
     *
     * @param t The type of the unit to register.
     * @param parentDomain The parent domain (0 = none), the caller must have authorization to
     *                     manipulate this domain, or if the caller is a trusted contract, the
     *                     recipient (to) must have same authority instead.
     * @param name The name / subdomain of the unit.
     * @param to Who will receive the resulting NFT and begin yielding on the infra unit.
     * @return The ID of the unit.
     */
    function registerUnit(
        UnitType t,
        uint64 parentDomain,
        string calldata name,
        address to
    ) external returns (uint);

    /**
     * Update data about an infra unit.
     *
     * @param id The ID of the unit to update, the caller must be authoritative over the unit.
     *           If the caller is a trusted contract (see trustContract()) then onBehalfOf may
     *           be substituted.
     * @param update The bitmask of fields to update
     *               see: Infra.UPDATE_TYPE, Infra.UPDATE_DOMAIN, Infra.UPDATE_NAME
     * @param t The type to change the item to, if applicable
     * @param parentDomain The parent domain to set, if applicable. The caller (or onBehalfOf) must
     *                     be authoritative over the domain in order to set it.
     * @param name The subdomain / name of the unit.
     * @param onBehalfOf If called from a trusted contract, authority to alter the Unit and associate
     *                   with the parentDomain will be based on this address, otherwise it is based on
     *                   the caller. If you're not a trusted contract, just pass zero.
     */
    function updateUnit(
        uint id,
        uint8 update,
        UnitType t,
        uint64 parentDomain,
        string calldata name,
        address onBehalfOf
    ) external;

    /**
     * Delete a unit.
     *
     * @param id The ID of the unit to delete.
     * @param onBehalfOf If this is being called by a trusted contract, this is the address to
     *                   impersonate, otherwise you may ignore it and pass address(0).
     */
    function deleteUnit(uint id, address onBehalfOf) external;

    /**
     * Evict a unit from being associated with your parentDomain.
     * This can be called by the owner of the domain, even if they do not have authority over the unit.
     * A possible reason why a domain holder would not have authority over the unit is because either
     * the domain, or the unit, was transferred. This allows the domain holder to evict the unit so it
     * will not affect their domain.
     *
     * @param id The ID of the unit to evict.
     */
    function domainEviction(uint id) external;

    // Read

    /**
     * Get a single unit by ID.
     *
     * @param id The ID of the unit to get.
     * @return t The type of the unit, if zero then this unit does not exist.
     * @return parentDomain The parent domain of the unit.
     * @return name The name of the unit.
     * @return owner The owner of the unit.
     */
    function getUnit(uint id) external view returns (
        UnitType t,
        uint64 parentDomain,
        string memory name,
        address owner
    );

    /**
     * Get multiple units by ID.
     *
     * @param ids An array of the IDs of units to get.
     * @return out An array of the resulting units.
     * @return owners An array of the owners of units, address(0) means there is a unit that was deleted.
     */
    function getUnits(
        uint[] calldata ids
    ) external view returns (
        Unit[] memory out,
        address[] memory owners
    );

    /**
     * Check whether an address is considered a trusted contract.
     * Trusted addresses can impersonate other addresses for the purpose of the
     * registerUnit() updateUnit() and deleteUnit() functions.
     * 
     * @param c The address to check
     * @return trusted whether or not the address is trusted to impersonate others
     */
    function isTrustedContract(address c) external view returns (bool trusted);

    /**
     * @return The next higher Unit id to issue
     */
    function nextId() external view returns (uint);

    /**
     * Access the free list of unit IDs.
     *
     * @param last The last ID, if zero then this gives the list head
     * @return id The next ID in the list
     */
    function idFreeList(uint64 last) external view returns (uint id);

    // Administrative

    /**
     * Update the URI prefix for rendering of NFT images.
     * Can only be called by the owner of the contract.
     *
     * @param pfx New URI prefix.
     */
    function setUriPrefix(string calldata pfx) external;

    /**
     * Set the trusted status of an address. Trusted addresses (contracts) can impersonate other
     * addresses for the purpose of the registerUnit() updateUnit() and deleteUnit() functions.
     *
     * @param c The address
     * @param trusted True if the address should be trusted.
     */
    function trustContract(address c, bool trusted) external;

    /**
     * Change the DNS contract, in case it needs to be upgraded.
     *
     * @param pns The new PNS contract address.
     */
    function setPns(address pns) external;
}