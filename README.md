# PNS Contracts

These are the contracts used for PKT Naming Service, as well as for PKT Infra and assignment of yield credits.

Each contract is documented in it's own interface file.

## Currently deployed
* DomainPricer: https://basescan.org/address/0x20Da522a85a9d8Be8815C2d3fe03a01F70cd9961#code
* PNS: https://basescan.org/address/0xDc8eb1D1052a2078B33dd188201eAf3F080E0258#code
* Infra: https://basescan.org/address/0xFDc0c296A6DafBA5D43af49ffC08741d197B7485#code
* BadPriceOracle: https://basescan.org/address/0x7D02D9791a8436481F35C078249Fc9DBfde6021c#code
* Assign: https://basescan.org/address/0x79B322f41A4A262f06cEE3d6a581574fF4F5322c#code
* Multipay: https://basescan.org/address/0x731d54713e91234B9ac8005AB6Eed53F554B0c78#code

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run ./scripts/deploy.js --network base
```
