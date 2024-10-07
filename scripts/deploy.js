/*@flow*/

const { ethers, web3, run } = require('hardhat');

const LOCKBOX_CONTRACT = '0x14D15765c66e8f0C7f8757d1D19137B714dfCC60';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  // Check balance first
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer has ${web3.utils.fromWei(deployerBalance.toString())} ETH`)

  // PNS
  const pns = await ethers.deployContract('PNS', [LOCKBOX_CONTRACT, true]);
  await pns.waitForDeployment();

  console.log("Uploading PNS for verification");
  const pnsAddress = await pns.getAddress();
  await run('verify', {
    address: pnsAddress,
    constructorArgsParams: [LOCKBOX_CONTRACT, 'true'],
  });
  console.log(`PNS address : ${pnsAddress}`);

  // Infra
  const infra = await ethers.deployContract('Infra', [pnsAddress]);
  await infra.waitForDeployment();
  const infraAddress = await infra.getAddress();
  await run('verify', {
    address: infraAddress,
    constructorArgsParams: [pnsAddress],
  });
  console.log(`Infra address : ${infraAddress}`);

  // Assign
  const assign = await ethers.deployContract('Assign', [infraAddress]);
  await assign.waitForDeployment();
  const assignAddress = await assign.getAddress();
  await run('verify', {
    address: assignAddress,
    constructorArgsParams: [infraAddress],
  });
  console.log(`Assign address : ${assignAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
