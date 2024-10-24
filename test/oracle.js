const {
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { expect } = require("chai");
  const { deployContracts } = require('./helpers/deploy');
  
  describe("BadPriceOracle", function () {

    describe("Deployment", function () {
        it("Should deploy correctly", async function () {
          const { oracle } = await loadFixture(deployContracts);
          expect(oracle.address).to.not.be.null;
        });
      });
  
      describe("Price calculation", function () {
        it("Should correctly calculate the price of PKT in USDC after updating reserves twice", async function () {
          const { oracle, pktWethLp, usdcWethLp } = await loadFixture(deployContracts);
      
          // First set of reserves and expected price
          const expectedPriceUsdc1 = 1000n * (10n**30n) / 500n * 1000n / 2000n; // First calculation
      
          // Set the initial reserve values for the mock LPs
          await pktWethLp.setReserves(1000, 500, 0); // PKT-WETH
          await usdcWethLp.setReserves(2000, 1000, 0); // USDC-WETH
      
          // Trigger price update in the oracle
          await oracle.getUpdatePrice();
      
          // Assert the initial price calculation is correct
          expect(await oracle.viewPriceUsd()).to.equal(expectedPriceUsdc1);
      
          // Assert that lastPrice is correctly updated (priceUsdc is at index priceUsdc)
          const lastPrice1 = await oracle.lastPrice();
          expect(lastPrice1.priceUsdc).to.equal(expectedPriceUsdc1);
      
          // Second set of reserves and expected price
          const expectedPriceUsdc2 = 1500n * (10n**30n) / 600n * 1200n / 2500n; // Second calculation
      
          // Update the reserve values for the mock LPs
          await pktWethLp.setReserves(1500, 600, 0); // New PKT-WETH
          await usdcWethLp.setReserves(2500, 1200, 0); // New USDC-WETH
      
          // Trigger the second price update in the oracle
          await oracle.getUpdatePrice();
      
          // Assert the new price calculation is correct
          expect(await oracle.viewPriceUsd()).to.equal(expectedPriceUsdc2);
      
          // Assert that lastPrice is updated again to reflect the new price
          const lastPrice2 = await oracle.lastPrice();
          expect(lastPrice2.priceUsdc).to.equal(expectedPriceUsdc2);
        });
      });
      
  });
  