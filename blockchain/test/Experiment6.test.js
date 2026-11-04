import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Experiment 6: EWaste DEX (Factory, Pair, Router)", function () {
  async function deployDEXFixture() {
    const [owner, provider, trader] = await ethers.getSigners();

    const tokenA = await ethers.deployContract("EWASTEToken");
    const tokenB = await ethers.deployContract("EREWARDToken");

    const factory = await ethers.deployContract("EWasteFactory");
    const router = await ethers.deployContract("EWasteRouter", [await factory.getAddress()]);

    const routerAddr = await router.getAddress();
    const tokenAAddr = await tokenA.getAddress();
    const tokenBAddr = await tokenB.getAddress();

    // Order tokens
    const [token0, token1] = tokenAAddr.toLowerCase() < tokenBAddr.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

    // Mint tokens for provider & trader
    const providerSupply = ethers.parseEther("10000");
    await token0.mint(provider.address, providerSupply);
    await token1.mint(provider.address, providerSupply);
    await token0.connect(provider).approve(routerAddr, providerSupply);
    await token1.connect(provider).approve(routerAddr, providerSupply);

    const traderSupply = ethers.parseEther("1000");
    await token0.mint(trader.address, traderSupply);
    await token1.mint(trader.address, traderSupply);
    await token0.connect(trader).approve(routerAddr, traderSupply);
    await token1.connect(trader).approve(routerAddr, traderSupply);

    return {
      owner,
      provider,
      trader,
      token0,
      token1,
      factory,
      router,
      routerAddr,
      providerSupply,
      traderSupply,
    };
  }

  describe("Factory", function () {
    it("creates a new pair and records it", async function () {
      const { factory, token0, token1 } = await deployDEXFixture();
      const addr0 = await token0.getAddress();
      const addr1 = await token1.getAddress();

      await expect(factory.createPair(addr0, addr1)).to.emit(factory, "PairCreated");

      const pairAddr = await factory.getPair(addr0, addr1);
      expect(pairAddr).to.not.equal(ethers.ZeroAddress);
      expect(await factory.allPairsLength()).to.equal(1n);
      expect(await factory.allPairs(0)).to.equal(pairAddr);
    });

    it("reverts on duplicate pair creation", async function () {
      const { factory, token0, token1 } = await deployDEXFixture();
      const addr0 = await token0.getAddress();
      const addr1 = await token1.getAddress();

      await factory.createPair(addr0, addr1);
      await expect(factory.createPair(addr0, addr1)).to.be.revertedWithCustomError(
        factory,
        "PairExists"
      );
    });
  });

  describe("Router: Liquidity Management", function () {
    it("adds initial liquidity, locks minimum liquidity to address(1)", async function () {
      const { router, factory, provider, token0, token1 } = await deployDEXFixture();
      const addr0 = await token0.getAddress();
      const addr1 = await token1.getAddress();

      const amount0 = ethers.parseEther("1000");
      const amount1 = ethers.parseEther("1000");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await router.connect(provider).addLiquidity(
        addr0,
        addr1,
        amount0,
        amount1,
        0,
        0,
        provider.address,
        deadline
      );

      const pairAddr = await factory.getPair(addr0, addr1);
      const pair = await ethers.getContractAt("EWastePair", pairAddr);

      // 1000 units permanently locked
      expect(await pair.balanceOf("0x0000000000000000000000000000000000000001")).to.equal(1000n);
      expect(await pair.balanceOf(provider.address)).to.equal(amount0 - 1000n);
    });

    it("removes liquidity through router", async function () {
      const { router, factory, provider, token0, token1 } = await deployDEXFixture();
      const addr0 = await token0.getAddress();
      const addr1 = await token1.getAddress();
      const routerAddr = await router.getAddress();

      const amount = ethers.parseEther("1000");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await router.connect(provider).addLiquidity(
        addr0,
        addr1,
        amount,
        amount,
        0,
        0,
        provider.address,
        deadline
      );

      const pairAddr = await factory.getPair(addr0, addr1);
      const pair = await ethers.getContractAt("EWastePair", pairAddr);
      const lpBalance = await pair.balanceOf(provider.address);

      await pair.connect(provider).approve(routerAddr, lpBalance);

      await router.connect(provider).removeLiquidity(
        addr0,
        addr1,
        lpBalance,
        0,
        0,
        provider.address,
        deadline
      );

      expect(await pair.balanceOf(provider.address)).to.equal(0n);
    });
  });

  describe("Router: Swapping", function () {
    it("executes swapExactTokensForTokens correctly", async function () {
      const { router, provider, trader, token0, token1 } = await deployDEXFixture();
      const addr0 = await token0.getAddress();
      const addr1 = await token1.getAddress();
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // Add pool liquidity 1000 : 1000
      await router.connect(provider).addLiquidity(
        addr0,
        addr1,
        ethers.parseEther("1000"),
        ethers.parseEther("1000"),
        0,
        0,
        provider.address,
        deadline
      );

      const swapIn = ethers.parseEther("10");
      const path = [addr0, addr1];

      const expectedAmounts = await router.getAmountsOut(swapIn, path);
      const balanceBefore = await token1.balanceOf(trader.address);

      await router.connect(trader).swapExactTokensForTokens(
        swapIn,
        expectedAmounts[1],
        path,
        trader.address,
        deadline
      );

      const balanceAfter = await token1.balanceOf(trader.address);
      expect(balanceAfter - balanceBefore).to.equal(expectedAmounts[1]);
    });

    it("reverts if slippage exceeds amountOutMin", async function () {
      const { router, provider, trader, token0, token1 } = await deployDEXFixture();
      const addr0 = await token0.getAddress();
      const addr1 = await token1.getAddress();
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await router.connect(provider).addLiquidity(
        addr0,
        addr1,
        ethers.parseEther("1000"),
        ethers.parseEther("1000"),
        0,
        0,
        provider.address,
        deadline
      );

      const swapIn = ethers.parseEther("10");
      const path = [addr0, addr1];
      const unreasonableMinOut = ethers.parseEther("20"); // Expecting more than in pool

      await expect(
        router.connect(trader).swapExactTokensForTokens(
          swapIn,
          unreasonableMinOut,
          path,
          trader.address,
          deadline
        )
      ).to.be.revertedWithCustomError(router, "InsufficientOutputAmount");
    });
  });
});
