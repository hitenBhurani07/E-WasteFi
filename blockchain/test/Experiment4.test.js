import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Experiment 4: EWasteAMM (Constant Product AMM)", function () {
  async function deployAMMFixture() {
    const [owner, provider, trader] = await ethers.getSigners();

    const token0 = await ethers.deployContract("EWasteToken");
    const token1 = await ethers.deployContract("EWasteRewardToken");

    const token0Addr = await token0.getAddress();
    const token1Addr = await token1.getAddress();

    const amm = await ethers.deployContract("EWasteAMM", [token0Addr, token1Addr]);
    const ammAddr = await amm.getAddress();

    // Fund provider with 100,000 tokens each
    const initialLiquidity = ethers.parseEther("10000");
    await token0.mint(provider.address, initialLiquidity);
    await token1.mint(provider.address, initialLiquidity);

    await token0.connect(provider).approve(ammAddr, initialLiquidity);
    await token1.connect(provider).approve(ammAddr, initialLiquidity);

    // Fund trader with 1,000 token0 and token1
    const traderFunds = ethers.parseEther("1000");
    await token0.mint(trader.address, traderFunds);
    await token1.mint(trader.address, traderFunds);

    await token0.connect(trader).approve(ammAddr, traderFunds);
    await token1.connect(trader).approve(ammAddr, traderFunds);

    return { owner, provider, trader, token0, token1, amm, ammAddr, initialLiquidity };
  }

  describe("Deployment", function () {
    it("initializes tokens and zero reserves", async function () {
      const { amm, token0, token1 } = await deployAMMFixture();
      expect(await amm.token0()).to.equal(await token0.getAddress());
      expect(await amm.token1()).to.equal(await token1.getAddress());
      const [r0, r1] = await amm.getReserves();
      expect(r0).to.equal(0n);
      expect(r1).to.equal(0n);
    });
  });

  describe("Liquidity Provision", function () {
    it("allows provider to add initial liquidity", async function () {
      const { amm, provider, initialLiquidity } = await deployAMMFixture();

      await expect(amm.connect(provider).addLiquidity(initialLiquidity, initialLiquidity))
        .to.emit(amm, "LiquidityAdded")
        .withArgs(provider.address, initialLiquidity, initialLiquidity, initialLiquidity);

      const [r0, r1] = await amm.getReserves();
      expect(r0).to.equal(initialLiquidity);
      expect(r1).to.equal(initialLiquidity);
      expect(await amm.lpBalances(provider.address)).to.equal(initialLiquidity);
      expect(await amm.totalLPSupply()).to.equal(initialLiquidity);
    });

    it("allows removing liquidity proportionally", async function () {
      const { amm, provider, initialLiquidity } = await deployAMMFixture();

      await amm.connect(provider).addLiquidity(initialLiquidity, initialLiquidity);

      const lpToRemove = ethers.parseEther("5000");
      await expect(amm.connect(provider).removeLiquidity(lpToRemove))
        .to.emit(amm, "LiquidityRemoved")
        .withArgs(provider.address, lpToRemove, lpToRemove, lpToRemove);

      const [r0, r1] = await amm.getReserves();
      expect(r0).to.equal(initialLiquidity - lpToRemove);
      expect(r1).to.equal(initialLiquidity - lpToRemove);
      expect(await amm.lpBalances(provider.address)).to.equal(initialLiquidity - lpToRemove);
    });
  });

  describe("Swapping & 0.3% Fee", function () {
    beforeEach(async function () {
      // Add initial liquidity
    });

    it("swaps token0 for token1 with 0.3% fee applied", async function () {
      const { amm, provider, trader, token1, initialLiquidity } = await deployAMMFixture();
      await amm.connect(provider).addLiquidity(initialLiquidity, initialLiquidity);

      const swapIn = ethers.parseEther("100");
      // amountInWithFee = 100 * 997 = 99700
      // numerator = 99700 * 10000 = 997000000
      // denominator = (10000 * 1000) + 99700 = 10099700
      // amountOut = 997000000 / 10099700 ~ 98.715793...
      const balanceBefore = await token1.balanceOf(trader.address);
      await amm.connect(trader).swapToken0ForToken1(swapIn);
      const balanceAfter = await token1.balanceOf(trader.address);

      const amountOut = balanceAfter - balanceBefore;
      expect(amountOut).to.be.gt(0n);
      expect(amountOut).to.be.lt(swapIn); // less than 100 due to slippage + fee

      const [r0, r1] = await amm.getReserves();
      expect(r0).to.equal(initialLiquidity + swapIn);
      expect(r1).to.equal(initialLiquidity - amountOut);
    });

    it("swaps token1 for token0 with 0.3% fee applied", async function () {
      const { amm, provider, trader, token0, initialLiquidity } = await deployAMMFixture();
      await amm.connect(provider).addLiquidity(initialLiquidity, initialLiquidity);

      const swapIn = ethers.parseEther("100");
      const balanceBefore = await token0.balanceOf(trader.address);
      await amm.connect(trader).swapToken1ForToken0(swapIn);
      const balanceAfter = await token0.balanceOf(trader.address);

      const amountOut = balanceAfter - balanceBefore;
      expect(amountOut).to.be.gt(0n);
      expect(amountOut).to.be.lt(swapIn);
    });

    it("reverts swap if input amount is zero", async function () {
      const { amm, trader } = await deployAMMFixture();
      await expect(
        amm.connect(trader).swapToken0ForToken1(0)
      ).to.be.revertedWithCustomError(amm, "InvalidAmount");
    });
  });
});
