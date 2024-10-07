require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');
require('@nomicfoundation/hardhat-chai-matchers');
require('@nomicfoundation/hardhat-ethers');
require('@nomiclabs/hardhat-web3');
require('hardhat-contract-sizer');
require('hardhat-gas-reporter');
require('@nomicfoundation/hardhat-verify');

const config = require('./config.js');

module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.24',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ]
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      chains: {
        8453: {
          hardforkHistory: {
            cancun: 16519236,
          },
        },
      },
    },
    base: {
      url: 'https://mainnet.base.org',
      accounts: [config.deploy.privateKey],
    },
    baseSepolia: {
      url: 'https://sepolia.base.org',
      accounts: [config.deploy.privateKey],
    },
  },
  etherscan: {
    apiKey: {
      base: config.deploy.basescanApiKey,
      baseSepolia: config.deploy.basescanApiKey,
    }
  },
  sourcify: {
    enabled: false,
  },
};