# PNS Contracts

These are the contracts used for PKT Naming Service, as well as for PKT Infra and assignment of yield credits.

Each contract is documented in it's own interface file.

## Currently deployed
* PNS: https://basescan.org/address/0xDd0c3FE1a3cac20209e808FB2dB61D15ABB5b6dD#code
* Infra: https://basescan.org/address/0xFDc0c296A6DafBA5D43af49ffC08741d197B7485#code
* Assign: https://basescan.org/address/0xdC7632FcE40bd0738d7b1C1c94589A7c88beC369#code

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run ./scripts/deploy.js --network base
```
