module.exports.deployContracts = async function deployContracts () {
    const [owner, otherAccount] = await ethers.getSigners();

    const MockLockBox = await ethers.getContractFactory("MockLockBox");
    const mockLockBox = await MockLockBox.deploy();

    const PNS = await ethers.getContractFactory("PNS");
    const pns = await PNS.deploy(await mockLockBox.getAddress(), false);

    const Infra = await ethers.getContractFactory("Infra");
    const infra = await Infra.deploy(await pns.getAddress());

    const Assign = await ethers.getContractFactory("Assign");
    const assign = await Assign.deploy(await infra.getAddress());

    return { mockLockBox, pns, infra, assign, owner, otherAccount };
  }