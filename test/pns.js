const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { deployContracts } = require('./helpers/deploy');

describe("PNS", function () {
    describe("Deployment", function () {
        it("Should deploy correctly", async function () {
          const { pns } = await loadFixture(deployContracts);
          expect(pns.address).to.not.be.null;
        });
    });

    describe("PNS Domain Registration with Events", function () {
        it("Should preregister and register a domain with relevant events emitted", async function () {
            const { mockLockBox, pns, owner } = await loadFixture(deployContracts);
    
            // Make a lockup
            await mockLockBox.setLockup(123, 100, 100);
    
            // Define the domain name and records
            const domainName = Buffer.from("cjd", "utf8");
            const records = "0x";
            const lockupId = 123;
    
            // Compute the preregistration hash
            const nameHash = await pns.computePreregHash(lockupId, domainName, records);
    
            // Preregister the domain and check for the Preregister event
            await expect(pns.preregister(nameHash, lockupId))
                .to.emit(pns, "Preregister")
                .withArgs(owner.address, nameHash, lockupId);
    
            // Wait for at least 1 block to pass before registering
            await ethers.provider.send("evm_mine");
    
            // Register the domain and check for the Register event
            await expect(pns.register(lockupId, domainName, records))
                .to.emit(pns, "Register")
                .withArgs(owner.address, 1, lockupId, domainName, records); // Assuming domain ID is 1 for this example
        });
    });
    
    describe("Domain Registration Failures", function () {
        it("Should fail to register a domain if preregistration was not made", async function () {
            const { mockLockBox, pns } = await loadFixture(deployContracts);
    
            // Make a lockup
            await mockLockBox.setLockup(123, 100, 100);
    
            // Attempt to register the domain without preregistering
            const lockupId = 123;
            const domainName = Buffer.from("cjd", "utf8");
            const emptyRecords = Buffer.from("");
    
            await expect(
                pns.register(lockupId, domainName, emptyRecords)
            ).to.be.reverted;
        });
    });

    describe("Domain Ownership, Authorization, and Record Update", function () {
        it("Should create a domain, check ownership, authorization, update records, and retrieve domain info", async function () {
            const { mockLockBox, pns, owner } = await loadFixture(deployContracts);
    
            // Make a lockup
            await mockLockBox.setLockup(123, 100, 100);
    
            // Compute the preregistration hash
            const lockupId = 123;
            const domainName = '0x636a64';
            const emptyRecords = Buffer.from("");
            const preregHash = await pns.computePreregHash(lockupId, domainName, emptyRecords);
    
            // Preregister the domain
            await pns.preregister(preregHash, lockupId);
    
            // Wait 1 block to avoid front-running protection
            await network.provider.send("evm_mine");
    
            // Register the domain
            await pns.register(lockupId, domainName, emptyRecords);
    
            const domainId = 1;
    
            // Check the lockup ownership using ownerLockup()
            const ownerLockupId = await pns.ownerLockup(domainId);
            expect(ownerLockupId).to.equal(lockupId);
    
            // Check if the owner is authorized for this domain using authorizedFor()
            const isAuthorized = await pns.authorizedFor(domainId, owner.address);
            expect(isAuthorized).to.be.true;
    
            // Update the DNS records for the domain
            const newRecords = Buffer.from("new records", "utf8");
            await pns.updateRecords(domainId, newRecords);
    
            // Retrieve the domain details using getDomain()
            const [domainOwner, subdomains, blacklisted, retrievedName, retrievedRecords] = await pns.getDomain(domainId);
    
            // Check the retrieved domain details
            expect(domainOwner).to.equal(lockupId); // Owner should match the lockupId
            expect(subdomains).to.equal(0); // This domain should not have subdomains yet
            expect(blacklisted).to.be.false; // Domain should not be blacklisted
            expect(retrievedName).to.equal(domainName); // Domain name should match
            expect(retrievedRecords).to.equal('0x' + newRecords.toString('hex')); // Records should match the updated value
        });
    });

    describe("Subdomain Creation", function () {
        it("Should create a subdomain and verify details", async function () {
            const { mockLockBox, pns, owner } = await loadFixture(deployContracts);
    
            // Step 1: Set up the lockup
            await mockLockBox.setLockup(123, 100, 100);
    
            // Step 2: Preregister and register a parent domain
            const lockupId = 123;
            const parentDomainName = Buffer.from("cjd", "utf8");
            const emptyRecords = Buffer.from("");
            const preregHash = await pns.computePreregHash(lockupId, parentDomainName, emptyRecords);
    
            await pns.preregister(preregHash, lockupId);
            await network.provider.send("evm_mine"); // Move to next block
    
            await pns.register(lockupId, parentDomainName, emptyRecords);
    
            const parentId = 1; // Assuming this is the ID for the parent domain
    
            // Step 3: Create a subdomain under the parent domain
            const subdomainLabel = Buffer.from("the.coolest.subdomain", "utf8");
            const subdomainRecords = Buffer.from("subdomain records", "utf8");
    
            await pns.createSubdomain(parentId, subdomainLabel, subdomainRecords);
    
            // Step 4: Verify subdomain details using getDomain()
            const subdomainId = 2; // Assuming subdomain gets the next ID
            const [ownerOfSubdomain, subdomains, blacklisted, name, records] = await pns.getDomain(subdomainId);
    
            // Check the retrieved subdomain details
            expect(ownerOfSubdomain).to.equal(parentId); // Subdomain should be owned by the parent domain
            expect(subdomains).to.equal(0xff); // Indicates this is a subdomain
            expect(blacklisted).to.be.false; // Subdomain should not be blacklisted
            expect(name).to.equal('0x' +
                subdomainLabel.toString('hex') +
                '.'.charCodeAt(0).toString(16) +
                parentDomainName.toString('hex')); // Name should match the subdomain label
            expect(records).to.equal('0x' + subdomainRecords.toString('hex')); // Records should match the initial subdomain records
    
            // Step 5: Ensure the parent domain shows one subdomain
            const [, parentSubdomains] = await pns.getDomain(parentId);
            expect(parentSubdomains).to.equal(1); // Parent should have 1 subdomain
        });
    });      
});