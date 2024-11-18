# PNS Contracts

These are the contracts used for PKT Naming Service, as well as for PKT Infra and assignment of yield credits.

Each contract is documented in it's own interface file.

## Currently deployed
* PNS: https://basescan.org/address/0xDd0c3FE1a3cac20209e808FB2dB61D15ABB5b6dD#code
* Infra: https://basescan.org/address/0xFDc0c296A6DafBA5D43af49ffC08741d197B7485#code
* BadPriceOracle: https://basescan.org/address/0x7D02D9791a8436481F35C078249Fc9DBfde6021c#code
* Assign: https://basescan.org/address/0x79B322f41A4A262f06cEE3d6a581574fF4F5322c#code
* Multipay: https://basescan.org/address/0x17023a397E995a3535808c9dbddD8A22d791a090

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run ./scripts/deploy.js --network base
```
