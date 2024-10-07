const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { deployContracts } = require('./helpers/deploy');

describe("Assign", function () {

  describe("Deployment", function () {
    it("Should deploy correctly", async function () {
      const { assign } = await loadFixture(deployContracts);
      expect(assign.address).to.not.be.null;
    });
  });

  describe("Assigning yield credits", function () {
    it("Should allow creating an assignment with yield credits", async function () {
      const { assign, owner } = await loadFixture(deployContracts);
      
      const unitId = 1;
      const yieldCredits = 100;
      
      await expect(assign.assignYc(unitId, yieldCredits))
        .to.emit(assign, "Assign")
        .withArgs(owner.address, unitId, yieldCredits);
      
      const assignment = await assign.getAssign(1);
      expect(assignment.owner).to.equal(owner.address);
      expect(assignment.yieldCredits).to.equal(yieldCredits);
    });

    it("Should allow updating yield credits", async function () {
      const { assign, owner } = await loadFixture(deployContracts);
      
      const unitId = 1;
      const initialCredits = 100;
      const updatedCredits = 200;

      await assign.assignYc(unitId, initialCredits);
      await assign.assignYc(unitId, updatedCredits);

      const assignment = await assign.getAssign(1);
      expect(assignment.yieldCredits).to.equal(updatedCredits);
    });

    it("Should delete assignment if yield credits is set to 0", async function () {
      const { assign, owner } = await loadFixture(deployContracts);

      const unitId = 1;
      const yieldCredits = 100;
      await assign.assignYc(unitId, yieldCredits);

      await assign.assignYc(unitId, 0); // Delete assignment by setting yield credits to 0

      const assignment = await assign.getAssign(1);
      expect(assignment.owner).to.equal('0x0000000000000000000000000000000000000000');
      expect(assignment.yieldCredits).to.equal(0);
    });
  });

});
