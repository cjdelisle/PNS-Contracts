/*@flow*/

const { ethers, web3, run } = require('hardhat');

const LOCKBOX_CONTRACT = '0x14D15765c66e8f0C7f8757d1D19137B714dfCC60';
const LP_PKT_WETH = '0x6183e613dda1fa146c90be6e1757aef15bacad9d';
const LP_USDC_WETH = '0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C';

let pnsAddress = '0xDd0c3FE1a3cac20209e808FB2dB61D15ABB5b6dD';
let infraAddress = '0xFDc0c296A6DafBA5D43af49ffC08741d197B7485';
let oracleAddress = '0x7D02D9791a8436481F35C078249Fc9DBfde6021c';
let assignAddress = '0x79B322f41A4A262f06cEE3d6a581574fF4F5322c';
let multipayAddress = '0x17023a397E995a3535808c9dbddD8A22d791a090';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  // Check balance first
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer has ${web3.utils.fromWei(deployerBalance.toString())} ETH`)

  // PNS
  if (!pnsAddress) {
    const pns = await ethers.deployContract('PNS', [LOCKBOX_CONTRACT, true]);
    await pns.waitForDeployment();
    console.log("Uploading PNS for verification");
    pnsAddress = await pns.getAddress();
    await run('verify', {
      address: pnsAddress,
      constructorArgsParams: [LOCKBOX_CONTRACT, 'true'],
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
