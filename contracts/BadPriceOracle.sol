// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

import "./interface/IPriceOracle.sol";

/// This is a "bad" price oracle.
/// It's bad in the sense that it doesn't use a rolling average, it just takes
/// a snapshot sample of the price from the reserves, it will not update if the
/// last change to the was in the same block as the query - because this can be
/// trivially abused with flash swaps. But other than this, it is not secure against
/// manipulation, so it should not be used in sensitive applications.
contract BadPriceOracle is IPriceOracle {
    IUniswapV2Pair public lp;         // PKT-WETH liquidity pair
    IUniswapV2Pair public lpUsdc;     // USDC-WETH liquidity pair
    uint256 public constant TEN_TO_THE_EIGHTEEN = 10**18;

    struct Price {
        uint256 priceEth;        // Price of PKT in ETH
        uint256 priceEthUsdc;    // Price of ETH in USDC
        uint256 priceUsdc;       // Price of PKT in USDC
        uint64 timestamp;
    }
    Price public lastPrice;

    constructor(address _lp, address _lpUsdc) {
        lp = IUniswapV2Pair(_lp);
        lpUsdc = IUniswapV2Pair(_lpUsdc);
        getUpdatePrice();
    }

    function getUpdatePriceUsd() external returns (uint256) {
        Price memory p = getUpdatePrice();
        return p.priceUsdc;
    }
 
    function viewPriceUsd() external view returns (uint256) {
        (Price memory p, ) = viewPrice();
        return p.priceUsdc;
    }

    function viewPrice() public view returns (Price memory, bool) {

        // Fetch reserves from PKT-WETH and USDC-WETH pairs
        (uint112 pktReserve0, uint112 pktReserve1, uint64 pktTs) = lp.getReserves();       // PKT-WETH reserves
        (uint112 usdcReserve0, uint112 usdcReserve1, uint64 usdTs) = lpUsdc.getReserves(); // USDC-WETH reserves

        if (usdTs == block.timestamp || pktTs == block.timestamp) {
            return (lastPrice, false);
        }

        // Calculate price of ETH in USDC: (reserve1 / reserve0) * 10^30
        uint256 priceEthUsdc = uint256(usdcReserve1) * (10**30) / uint256(usdcReserve0);

        // Calculate price of PKT in ETH: (reserve0 / reserve1) * 10^18
        uint256 priceEth = uint256(pktReserve0) * TEN_TO_THE_EIGHTEEN / uint256(pktReserve1);

        // Calculate price of PKT in USDC: priceEth * priceEthUsdc / 10^18
        uint256 priceUsdc = priceEth * priceEthUsdc / TEN_TO_THE_EIGHTEEN;

        // Return the price struct
        return (Price({
            priceEth: priceEth,
            priceEthUsdc: priceEthUsdc,
            priceUsdc: priceUsdc,
            timestamp: uint64(block.timestamp)
        }), true);
    }

    function getUpdatePrice() public returns (Price memory) {
        (
            Price memory p,
            bool isUpdate
        ) = viewPrice();
        if (isUpdate) {
            lastPrice = p;
        }
        return p;
    }
}
