# PNS Contracts

These are the contracts used for PKT Naming Service, as well as for PKT Infra and assignment of yield credits.

Each contract is documented in it's own interface file.

## Currently deployed
* DomainPricer: https://basescan.org/address/0x55C306c98F5577e093A93CaE8E3A9f9b07A52B16#code
* PNS: https://basescan.org/address/0xDc8eb1D1052a2078B33dd188201eAf3F080E0258#code
* Infra: https://basescan.org/address/0xFDc0c296A6DafBA5D43af49ffC08741d197B7485#code
* BadPriceOracle: https://basescan.org/address/0x7D02D9791a8436481F35C078249Fc9DBfde6021c#code
* Assign: https://basescan.org/address/0x79B322f41A4A262f06cEE3d6a581574fF4F5322c#code
* Multipay: https://basescan.org/address/0xCB1a92D92F5186361D7554dea3815d7aE1583699#code

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run ./scripts/deploy.js --network base
```
