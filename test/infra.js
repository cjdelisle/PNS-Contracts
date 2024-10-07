const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { deployContracts } = require('./helpers/deploy');

describe("Infra", function () {
  
  describe("Deployment", function () {
    it("Should deploy correctly", async function () {
      const { infra } = await loadFixture(deployContracts);
      expect(infra.address).to.not.be.null;
    });
  });

  describe("Unit Registration", function () {
    it("Should allow registering a new unit", async function () {
      const { infra, owner } = await loadFixture(deployContracts);

      const unitType = 2; // Example: CjdnsVpn
      const parentDomain = 0; // No parent domain
      const name = "unitName";
      const recipient = owner.address;

      await expect(
        infra.registerUnit(unitType, parentDomain, name, recipient)
      )
      .to.emit(infra, "RegisterUnit")
      .withArgs(recipient, 1, owner.address, recipient, unitType, parentDomain, name);

      const [ _unitType, _parentDomain, _name, _owner ] = await infra.getUnit(1);
      expect(_unitType).to.equal(unitType);
      expect(_parentDomain).to.equal(parentDomain);
      expect(_name).to.equal(name);
      expect(_owner).to.equal(recipient);
    });
  });

  describe("Unit Update", function () {
    it("Should allow updating a unit's details", async function () {
      const { infra, owner } = await loadFixture(deployContracts);

      // Register the unit first
      const unitType = 2; // CjdnsVpn
      const parentDomain = 0;
      const name = "unitName";
      const recipient = owner.address;

      await infra.registerUnit(unitType, parentDomain, name, recipient);

      // Update the unit
      const newUnitType = 3; // PrivateCjdns
      const newName = "newUnitName";
      const updateMask = 0b101; // Example mask (for type and name)

      await expect(
        infra.updateUnit(1, updateMask, newUnitType, parentDomain, newName, owner.address)
      )
      .to.emit(infra, "UpdateUnit")
      .withArgs(recipient, 1, updateMask, newUnitType, parentDomain, newName);

      const [_unitType, _parentDomain, _name, _owner] = await infra.getUnit(1);
      expect(_unitType).to.equal(newUnitType);
      expect(_parentDomain).to.equal(parentDomain);
      expect(_name).to.equal(newName);
      expect(_owner).to.equal(recipient);
    });
  });

  describe("Unit Deletion", function () {
    it("Should allow deleting a unit", async function () {
      const { infra, owner } = await loadFixture(deployContracts);

      // Register the unit first
      const unitType = 2;
      const parentDomain = 0;
      const name = "unitToDelete";
      const recipient = owner.address;

      await infra.registerUnit(unitType, parentDomain, name, recipient);

      // Delete the unit
      await expect(infra.deleteUnit(1, owner.address))
        .to.emit(infra, "DeleteUnit")
        .withArgs(recipient, 1);

      const unitAfterDeletion = await infra.getUnit(1);
      expect(unitAfterDeletion.owner).to.equal('0x0000000000000000000000000000000000000000');
    });
  });

  describe("Trusted Contracts", function () {
    it("Should set and check trusted contracts correctly", async function () {
      const { infra, owner, otherAccount } = await loadFixture(deployContracts);

      // Set otherAccount as a trusted contract
      await infra.trustContract(otherAccount.address, true);
      const isTrusted = await infra.isTrustedContract(otherAccount.address);
      expect(isTrusted).to.be.true;

      // Remove trust
      await infra.trustContract(otherAccount.address, false);
      const isNoLongerTrusted = await infra.isTrustedContract(otherAccount.address);
      expect(isNoLongerTrusted).to.be.false;
    });
  });

  describe("Domain Eviction", function () {
    it("Should allow a domain to evict a unit", async function () {
      const { mockLockBox, pns, infra, owner } = await loadFixture(deployContracts);
  
      // Step 1: Make a lockup
      const lockupId = 123;
      const lockupAmount = 100;
      const lockupValuation = 100;
      await mockLockBox.setLockup(lockupId, lockupAmount, lockupValuation);
  
      // Step 2: Pre-register the domain
      const domainName = Buffer.from("cjd", 'utf8');
      const emptyRecords = "0x"; // No records passed as placeholder
      const preregHash = await pns.computePreregHash(lockupId, domainName, emptyRecords);
  
      // Call preregister function
      await pns.preregister(preregHash, lockupId);
  
      // Step 3: Wait for 1 block to pass
      await ethers.provider.send("evm_mine", []);
  
      // Step 4: Register the domain
      await pns.register(lockupId, domainName, emptyRecords);
  
      // Step 5: Register a unit associated with the domain
      const unitType = 2; // Assuming unit type 2 is valid (as per your example)
      const parentDomain = 1; // Assuming domain ID starts at 1
      const unitName = "evictableUnit";
      const recipient = owner.address;
  
      await infra.registerUnit(unitType, parentDomain, unitName, recipient);
  
      // Step 6: Domain eviction of the unit
      await expect(infra.domainEviction(1))
        .to.emit(infra, "DomainEvict")
        .withArgs(recipient, 1);
  
      // Step 7: Verify that the unit was evicted
      const [_unitType, _parentDomain, _name, _owner] = await infra.getUnit(1);
      expect(_parentDomain).to.equal(0); // The unit should no longer have a parent domain
    });
  });
});
