module.exports.deployContracts = async function deployContracts () {
    const [owner, otherAccount] = await ethers.getSigners();

    const MockLockBox = await ethers.getContractFactory("MockLockBox");
    const mockLockBox = await MockLockBox.deploy();

    const PNS = await ethers.getContractFactory("PNS");
    const pns = await PNS.deploy(await mockLockBox.getAddress(), false);

    const Infra = await ethers.getContractFactory("Infra");
    const infra = await Infra.deploy(await pns.getAddress());

    // Deploy the MockLp contracts for PKT-WETH and USDC-WETH
    const MockLp = await ethers.getContractFactory("MockLp");
    const pktWethLp = await MockLp.deploy();
    const usdcWethLp = await MockLp.deploy();

    // Set some initial reserve values for the mock LPs
    await pktWethLp.setReserves(1, 1, 1); // PKT-WETH
    await usdcWethLp.setReserves(1, 1, 1); // USDC-WETH

    // Deploy the BadPriceOracle
    const BadPriceOracle = await ethers.getContractFactory("BadPriceOracle");
    const oracle = await BadPriceOracle.deploy(await pktWethLp.getAddress(), await usdcWethLp.getAddress());

    const Assign = await ethers.getContractFactory("Assign");
    const assign = await Assign.deploy(await infra.getAddress(), await oracle.getAddress());

    return { mockLockBox, pns, infra, assign, owner, otherAccount, pktWethLp, usdcWethLp, oracle };
  }