import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Experiment 3: EWasteFiVault (ERC-4626)", function () {
  async function deployVaultFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const asset = await ethers.deployContract("EWasteAssetToken");
    const assetAddress = await asset.getAddress();

    const vault = await ethers.deployContract("EWasteFiVault", [assetAddress]);

    // Give user1 some asset tokens
    const depositAmount = ethers.parseEther("1000");
    await asset.mint(user1.address, depositAmount);
    await asset.connect(user1).approve(await vault.getAddress(), depositAmount);

    return { owner, user1, user2, asset, vault, depositAmount };
  }

  describe("Initialization & Metadata", function () {
    it("has correct vault name, symbol and asset", async function () {
      const { asset, vault } = await deployVaultFixture();
      expect(await vault.name()).to.equal("E-WasteFi Vault Share");
      expect(await vault.symbol()).to.equal("EWVS");
      expect(await vault.asset()).to.equal(await asset.getAddress());
    });

    it("sets deployer as owner", async function () {
      const { owner, vault } = await deployVaultFixture();
      expect(await vault.owner()).to.equal(owner.address);
    });
  });

  describe("ERC-4626 Deposit & Redeem Lifecycle", function () {
    it("allows users to deposit assets and receive shares", async function () {
      const { user1, asset, vault, depositAmount } = await deployVaultFixture();

      const expectedShares = await vault.previewDeposit(depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      expect(await vault.balanceOf(user1.address)).to.equal(expectedShares);
      expect(await vault.totalAssets()).to.equal(depositAmount);
      expect(await asset.balanceOf(user1.address)).to.equal(0n);
    });

    it("allows users to redeem shares for assets", async function () {
      const { user1, asset, vault, depositAmount } = await deployVaultFixture();

      await vault.connect(user1).deposit(depositAmount, user1.address);
      const userShares = await vault.balanceOf(user1.address);

      await vault.connect(user1).redeem(userShares, user1.address, user1.address);

      expect(await vault.balanceOf(user1.address)).to.equal(0n);
      expect(await asset.balanceOf(user1.address)).to.equal(depositAmount);
    });
  });

  describe("Recycling Impact Tracking", function () {
    it("allows owner to record recycling impact", async function () {
      const { owner, user1, vault } = await deployVaultFixture();

      await expect(vault.connect(owner).recordRecyclingImpact(user1.address, 150))
        .to.emit(vault, "RecyclingImpactRecorded")
        .withArgs(user1.address, 150, 150);

      expect(await vault.totalRecyclingImpact(user1.address)).to.equal(150n);

      // Subsequent recording accumulates impact
      await vault.connect(owner).recordRecyclingImpact(user1.address, 50);
      expect(await vault.totalRecyclingImpact(user1.address)).to.equal(200n);
    });

    it("prevents non-owners from recording impact", async function () {
      const { user1, vault } = await deployVaultFixture();

      await expect(
        vault.connect(user1).recordRecyclingImpact(user1.address, 100)
      ).to.be.revertedWithCustomError(vault, "NotOwner");
    });

    it("reverts on zero address user", async function () {
      const { owner, vault } = await deployVaultFixture();

      await expect(
        vault.connect(owner).recordRecyclingImpact(ethers.ZeroAddress, 100)
      ).to.be.revertedWithCustomError(vault, "InvalidAddress");
    });
  });
});
