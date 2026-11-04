import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Experiment 5: SimpleYieldFarm", function () {
  async function deployFarmFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const stakeToken = await ethers.deployContract("EWRToken");
    const rewardToken = await ethers.deployContract("RWRToken");

    const rewardRate = ethers.parseEther("1"); // 1 RWR per second
    const farm = await ethers.deployContract("SimpleYieldFarm", [
      await stakeToken.getAddress(),
      await rewardToken.getAddress(),
      rewardRate,
    ]);

    const farmAddr = await farm.getAddress();

    // Fund farm with 10,000 RWR tokens
    const rewardFund = ethers.parseEther("10000");
    await rewardToken.connect(owner).approve(farmAddr, rewardFund);
    await farm.connect(owner).fundRewards(rewardFund);

    // Give user1 1,000 EWR tokens and approve farm
    const userStakeAmount = ethers.parseEther("100");
    await stakeToken.mint(user1.address, userStakeAmount);
    await stakeToken.connect(user1).approve(farmAddr, userStakeAmount);

    return { owner, user1, user2, stakeToken, rewardToken, farm, farmAddr, rewardRate, userStakeAmount };
  }

  describe("Deployment & Configuration", function () {
    it("sets correct tokens and reward rate", async function () {
      const { farm, stakeToken, rewardToken, rewardRate, owner } = await deployFarmFixture();
      expect(await farm.stakeToken()).to.equal(await stakeToken.getAddress());
      expect(await farm.rewardToken()).to.equal(await rewardToken.getAddress());
      expect(await farm.rewardRate()).to.equal(rewardRate);
      expect(await farm.owner()).to.equal(owner.address);
    });

    it("allows owner to update reward rate", async function () {
      const { farm, owner } = await deployFarmFixture();
      const newRate = ethers.parseEther("2");
      await expect(farm.connect(owner).setRewardRate(newRate))
        .to.emit(farm, "RewardRateUpdated")
        .withArgs(newRate);
      expect(await farm.rewardRate()).to.equal(newRate);
    });
  });

  describe("Staking & Harvesting Flow", function () {
    it("allows user to stake tokens", async function () {
      const { farm, user1, userStakeAmount } = await deployFarmFixture();

      await expect(farm.connect(user1).stake(userStakeAmount))
        .to.emit(farm, "Staked")
        .withArgs(user1.address, userStakeAmount);

      expect(await farm.balances(user1.address)).to.equal(userStakeAmount);
      expect(await farm.totalStaked()).to.equal(userStakeAmount);
    });

    it("accrues rewards over time and allows harvesting", async function () {
      const { farm, user1, rewardToken, userStakeAmount } = await deployFarmFixture();

      await farm.connect(user1).stake(userStakeAmount);

      // Advance time by 10 seconds
      await ethers.provider.send("evm_increaseTime", [10]);
      await ethers.provider.send("evm_mine");

      const earned = await farm.earnedRewards(user1.address);
      expect(earned).to.be.gte(ethers.parseEther("10"));

      const balanceBefore = await rewardToken.balanceOf(user1.address);
      await farm.connect(user1).harvest();
      const balanceAfter = await rewardToken.balanceOf(user1.address);

      expect(balanceAfter - balanceBefore).to.be.gte(ethers.parseEther("10"));
    });

    it("allows user to unstake tokens", async function () {
      const { farm, user1, stakeToken, userStakeAmount } = await deployFarmFixture();

      await farm.connect(user1).stake(userStakeAmount);
      await expect(farm.connect(user1).unstake(userStakeAmount))
        .to.emit(farm, "Unstaked")
        .withArgs(user1.address, userStakeAmount);

      expect(await farm.balances(user1.address)).to.equal(0n);
      expect(await farm.totalStaked()).to.equal(0n);
      expect(await stakeToken.balanceOf(user1.address)).to.equal(userStakeAmount);
    });

    it("does not distribute more than available funded rewards", async function () {
      const [owner, user] = await ethers.getSigners();
      const stakeToken = await ethers.deployContract("EWRToken");
      const rewardToken = await ethers.deployContract("RWRToken");

      // 10 RWR per second, only 5 RWR funded
      const farm = await ethers.deployContract("SimpleYieldFarm", [
        await stakeToken.getAddress(),
        await rewardToken.getAddress(),
        ethers.parseEther("10"),
      ]);
      const farmAddr = await farm.getAddress();

      const smallFund = ethers.parseEther("5");
      await rewardToken.connect(owner).approve(farmAddr, smallFund);
      await farm.connect(owner).fundRewards(smallFund);

      const stakeAmount = ethers.parseEther("10");
      await stakeToken.mint(user.address, stakeAmount);
      await stakeToken.connect(user).approve(farmAddr, stakeAmount);
      await farm.connect(user).stake(stakeAmount);

      await ethers.provider.send("evm_increaseTime", [10]);
      await ethers.provider.send("evm_mine");

      // Harvest should cap at contract's balance of 5 RWR
      await farm.connect(user).harvest();
      expect(await rewardToken.balanceOf(user.address)).to.equal(smallFund);
    });
  });
});
