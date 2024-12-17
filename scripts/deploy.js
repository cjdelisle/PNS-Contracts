/*@flow*/

const { ethers, web3, run } = require('hardhat');

const LOCKBOX_CONTRACT = '0x14D15765c66e8f0C7f8757d1D19137B714dfCC60';
const LP_PKT_WETH = '0x6183e613dda1fa146c90be6e1757aef15bacad9d';
const LP_USDC_WETH = '0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C';

let dpAddress = '0xf7e40e5740B8F42f5d8f8EB18D8B0d526E5e83BB';
let pnsAddress = '0xDc8eb1D1052a2078B33dd188201eAf3F080E0258';
let infraAddress = '0xFDc0c296A6DafBA5D43af49ffC08741d197B7485';
let oracleAddress = '0x7D02D9791a8436481F35C078249Fc9DBfde6021c';
let assignAddress = '0x79B322f41A4A262f06cEE3d6a581574fF4F5322c';
let multipayAddress = '0xCB1a92D92F5186361D7554dea3815d7aE1583699';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  // Check balance first
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer has ${web3.utils.fromWei(deployerBalance.toString())} ETH`);

  // Domain Pricer
  if (!dpAddress) {
    const dp = await ethers.deployContract('DomainPricer', []);
    await dp.waitForDeployment();
    console.log("Uploading DomainPricer for verification");
    dpAddress = await dp.getAddress();
    await run('verify', {
      address: dpAddress,
      constructorArgsParams: [],
    });
  }
  console.log(`DP address : ${dpAddress}`);

  // PNS
  if (!pnsAddress) {
    const pns = await ethers.deployContract('PNS', [LOCKBOX_CONTRACT, true, dpAddress]);
    await pns.waitForDeployment();
    pnsAddress = await pns.getAddress();
    console.log(`Uploading PNS ${pnsAddress} for verification`);
    await run('verify', {
      address: pnsAddress,
      constructorArgsParams: [LOCKBOX_CONTRACT, 'true', dpAddress],
    });
  }
  console.log(`PNS address : ${pnsAddress}`);

  // Infra
  if (!infraAddress) {
    const infra = await ethers.deployContract('Infra', [pnsAddress]);
    await infra.waitForDeployment();
    infraAddress = await infra.getAddress();
    await run('verify', {
      address: infraAddress,
      constructorArgsParams: [pnsAddress],
    });
  }
  console.log(`Infra address : ${infraAddress}`);

  // Oracle
  if (!oracleAddress) {
    const oracle = await ethers.deployContract('BadPriceOracle', [LP_PKT_WETH,LP_USDC_WETH]);
    await oracle.waitForDeployment();
    oracleAddress = await oracle.getAddress();
    await run('verify', {
      address: oracleAddress,
      constructorArgsParams: [LP_PKT_WETH,LP_USDC_WETH],
    });
  }
  console.log(`Oracle address : ${oracleAddress}`);

  // Assign
  if (!assignAddress) {
    const assign = await ethers.deployContract('Assign', [infraAddress, oracleAddress]);
    await assign.waitForDeployment();
    assignAddress = await assign.getAddress();
    await run('verify', {
      address: assignAddress,
      constructorArgsParams: [infraAddress, oracleAddress],
    });
  }
  console.log(`Assign address : ${assignAddress}`);

  if (!multipayAddress) {
    const multipay = await ethers.deployContract('Multipay', []);
    await multipay.waitForDeployment();
    multipayAddress = await multipay.getAddress();
    await run('verify', {
      address: multipayAddress,
      constructorArgsParams: [],
    });
  }
  console.log(`Multipay address : ${multipayAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
