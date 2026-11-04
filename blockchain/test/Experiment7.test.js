import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Experiment 7: Chainlink Price Feed & Consumers", function () {
  const INITIAL_PRICE = 250000000000n; // $2500.00 with 8 decimals
  const DECIMALS = 8;
  const MAX_AGE = 3600; // 1 hour

  async function deployFeedsFixture() {
    const [owner, user] = await ethers.getSigners();

    const mockFeed = await ethers.deployContract("MockPriceFeed", [DECIMALS, INITIAL_PRICE]);
    const mockFeedAddr = await mockFeed.getAddress();

    const consumer = await ethers.deployContract("EWastePriceConsumer", [mockFeedAddr]);
    const safeConsumer = await ethers.deployContract("SafeEWastePriceConsumer", [
      mockFeedAddr,
      MAX_AGE,
    ]);

    return { owner, user, mockFeed, mockFeedAddr, consumer, safeConsumer };
  }

  describe("MockPriceFeed & Basic Consumer", function () {
    it("reports correct decimals and initial price", async function () {
      const { mockFeed, consumer } = await deployFeedsFixture();
      expect(await mockFeed.decimals()).to.equal(DECIMALS);
      expect(await consumer.getLatestPrice()).to.equal(INITIAL_PRICE);
      expect(await consumer.getDecimals()).to.equal(DECIMALS);
    });

    it("updates price when setAnswer is called", async function () {
      const { mockFeed, consumer } = await deployFeedsFixture();
      const newPrice = 280000000000n;
      await mockFeed.setAnswer(newPrice);
      expect(await consumer.getLatestPrice()).to.equal(newPrice);
    });
  });

  describe("SafeEWastePriceConsumer Validations", function () {
    it("returns price when feed is valid and fresh", async function () {
      const { safeConsumer } = await deployFeedsFixture();
      expect(await safeConsumer.getLatestPrice()).to.equal(INITIAL_PRICE);
      expect(await safeConsumer.getDecimals()).to.equal(DECIMALS);
    });

    it("reverts on non-positive price", async function () {
      const { mockFeed, safeConsumer } = await deployFeedsFixture();
      await mockFeed.setAnswer(0);
      await expect(safeConsumer.getLatestPrice()).to.be.revertedWithCustomError(
        safeConsumer,
        "InvalidPrice"
      );

      await mockFeed.setAnswer(-100);
      await expect(safeConsumer.getLatestPrice()).to.be.revertedWithCustomError(
        safeConsumer,
        "InvalidPrice"
      );
    });

    it("reverts on stale price exceeding maxAge", async function () {
      const { safeConsumer } = await deployFeedsFixture();

      // Advance time beyond MAX_AGE (3600 seconds)
      await ethers.provider.send("evm_increaseTime", [MAX_AGE + 10]);
      await ethers.provider.send("evm_mine");

      await expect(safeConsumer.getLatestPrice()).to.be.revertedWithCustomError(
        safeConsumer,
        "StalePrice"
      );
    });

    it("reverts on future price timestamp", async function () {
      const { mockFeed, safeConsumer } = await deployFeedsFixture();
      const currentBlock = await ethers.provider.getBlock("latest");
      const futureTime = currentBlock.timestamp + 5000;

      await mockFeed.setRoundData(1, INITIAL_PRICE, futureTime);

      await expect(safeConsumer.getLatestPrice()).to.be.revertedWithCustomError(
        safeConsumer,
        "FuturePrice"
      );
    });

    it("reverts on incomplete round (updatedAt == 0)", async function () {
      const { mockFeed, safeConsumer } = await deployFeedsFixture();
      await mockFeed.setRoundData(1, INITIAL_PRICE, 0);

      await expect(safeConsumer.getLatestPrice()).to.be.revertedWithCustomError(
        safeConsumer,
        "IncompleteRound"
      );
    });

    it("allows owner to update maxAge", async function () {
      const { owner, safeConsumer } = await deployFeedsFixture();
      await expect(safeConsumer.connect(owner).setMaxAge(7200))
        .to.emit(safeConsumer, "MaxAgeUpdated")
        .withArgs(7200);

      expect(await safeConsumer.maxAge()).to.equal(7200n);
    });
  });
});
