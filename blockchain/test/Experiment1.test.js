import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Experiment 1: EWasteRegistry and EWasteRewardVault", function () {
  async function deployContracts() {
    const [owner, recycler, user1, user2] = await ethers.getSigners();

    const registry = await ethers.deployContract("contracts/active/Experiment1/EWasteRegistry.sol:EWasteRegistry");
    const vault = await ethers.deployContract("contracts/active/Experiment1/EWasteRewardVault.sol:EWasteRewardVault");

    await registry.connect(owner).setRewardVault(await vault.getAddress());
    await vault.connect(owner).setRegistry(await registry.getAddress());

    return { owner, recycler, user1, user2, registry, vault };
  }

  describe("Deployment & Configuration", function () {
    it("sets deployer as owner", async function () {
      const { owner, registry, vault } = await deployContracts();
      expect(await registry.owner()).to.equal(owner.address);
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("links registry and vault correctly", async function () {
      const { registry, vault } = await deployContracts();
      expect(await registry.rewardVault()).to.equal(await vault.getAddress());
      expect(await vault.registry()).to.equal(await registry.getAddress());
    });
  });

  describe("Recycler Management", function () {
    it("allows owner to add and remove a recycler", async function () {
      const { owner, recycler, registry } = await deployContracts();

      await expect(registry.connect(owner).addRecycler(recycler.address))
        .to.emit(registry, "RecyclerAdded")
        .withArgs(recycler.address);

      expect(await registry.recyclers(recycler.address)).to.equal(true);

      await expect(registry.connect(owner).removeRecycler(recycler.address))
        .to.emit(registry, "RecyclerRemoved")
        .withArgs(recycler.address);

      expect(await registry.recyclers(recycler.address)).to.equal(false);
    });

    it("prevents non-owners from adding recyclers", async function () {
      const { user1, recycler, registry } = await deployContracts();
      await expect(
        registry.connect(user1).addRecycler(recycler.address)
      ).to.be.revertedWithCustomError(registry, "NotOwner");
    });
  });

  describe("Submissions & Rewards", function () {
    it("allows users to submit e-waste and calculates rewards accurately", async function () {
      const { user1, registry } = await deployContracts();

      // Mobile Phone reward is 25 * quantity
      await expect(registry.connect(user1).submitEwaste("Mobile Phone", 2, 400))
        .to.emit(registry, "EWasteSubmitted")
        .withArgs(1, user1.address, "Mobile Phone", 2, 400, 50);

      const submission = await registry.getSubmission(1);
      expect(submission.user).to.equal(user1.address);
      expect(submission.category).to.equal("Mobile Phone");
      expect(submission.quantity).to.equal(2n);
      expect(submission.weight).to.equal(400n);
      expect(submission.reward).to.equal(50n);
      expect(submission.status).to.equal(0n); // Pending
    });

    it("rejects invalid submission inputs", async function () {
      const { user1, registry } = await deployContracts();

      await expect(
        registry.connect(user1).submitEwaste("Mobile Phone", 0, 100)
      ).to.be.revertedWithCustomError(registry, "InvalidQuantity");

      await expect(
        registry.connect(user1).submitEwaste("Mobile Phone", 1, 0)
      ).to.be.revertedWithCustomError(registry, "InvalidWeight");

      await expect(
        registry.connect(user1).submitEwaste("InvalidCategory", 1, 100)
      ).to.be.revertedWithCustomError(registry, "UnsupportedCategory");
    });

    it("handles full lifecycle: submit -> verify -> issue reward", async function () {
      const { owner, recycler, user1, registry, vault } = await deployContracts();

      await registry.connect(owner).addRecycler(recycler.address);
      await registry.connect(user1).submitEwaste("Laptop", 1, 2000); // reward: 50

      // Verify
      await expect(registry.connect(recycler).verifySubmission(1))
        .to.emit(registry, "SubmissionVerified")
        .withArgs(1, recycler.address);

      const verified = await registry.getSubmission(1);
      expect(verified.status).to.equal(1n); // Verified

      // Issue Reward
      await expect(registry.connect(recycler).issueReward(1))
        .to.emit(registry, "RewardIssued")
        .withArgs(1, user1.address, 50)
        .and.to.emit(vault, "RewardCredited")
        .withArgs(user1.address, 50);

      expect(await vault.getRewardBalance(user1.address)).to.equal(50n);

      // Cannot issue twice
      await expect(
        registry.connect(recycler).issueReward(1)
      ).to.be.revertedWithCustomError(registry, "RewardAlreadyIssued");
    });

    it("allows recycler to reject a submission", async function () {
      const { owner, recycler, user1, registry } = await deployContracts();
      await registry.connect(owner).addRecycler(recycler.address);
      await registry.connect(user1).submitEwaste("Battery", 3, 300);

      await expect(registry.connect(recycler).rejectSubmission(1))
        .to.emit(registry, "SubmissionRejected")
        .withArgs(1, recycler.address);

      const rejected = await registry.getSubmission(1);
      expect(rejected.status).to.equal(2n); // Rejected
    });
  });
});
