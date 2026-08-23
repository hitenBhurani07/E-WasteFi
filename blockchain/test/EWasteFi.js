import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("EWasteFi", function () {
  async function deployContract() {
    const [owner, recycler, , userOne, userTwo] = await ethers.getSigners();
    const contract = await ethers.deployContract("EWasteFi");

    return { owner, recycler, userOne, userTwo, contract };
  }

  it("deploys and sets deployer as owner", async function () {
    const { owner, contract } = await deployContract();

    expect(await contract.owner()).to.equal(owner.address);
  });

  it("owner can add recycler", async function () {
    const { owner, recycler, contract } = await deployContract();

    await expect(contract.connect(owner).addRecycler(recycler.address))
      .to.emit(contract, "RecyclerAdded")
      .withArgs(recycler.address);

    expect(await contract.recyclers(recycler.address)).to.equal(true);
  });

  it("owner can remove recycler", async function () {
    const { owner, recycler, contract } = await deployContract();

    await contract.connect(owner).addRecycler(recycler.address);

    await expect(contract.connect(owner).removeRecycler(recycler.address))
      .to.emit(contract, "RecyclerRemoved")
      .withArgs(recycler.address);

    expect(await contract.recyclers(recycler.address)).to.equal(false);
  });

  it("non-owner cannot manage recyclers", async function () {
    const { userOne, recycler, contract } = await deployContract();

    await expect(contract.connect(userOne).addRecycler(recycler.address)).to.be.revertedWithCustomError(
      contract,
      "NotOwner",
    );

    await expect(contract.connect(userOne).removeRecycler(recycler.address)).to.be.revertedWithCustomError(
      contract,
      "NotOwner",
    );
  });

  it("user can submit valid Mobile Phone e-waste", async function () {
    const { userOne, contract } = await deployContract();

    await expect(contract.connect(userOne).submitEwaste("Mobile Phone", 2, 500))
      .to.emit(contract, "EWasteSubmitted")
      .withArgs(1n, userOne.address, "Mobile Phone", 2n, 500n, 50n);

    const submission = await contract.getSubmission(1);
    expect(submission.category).to.equal("Mobile Phone");
    expect(submission.quantity).to.equal(2n);
    expect(submission.weight).to.equal(500n);
    expect(submission.reward).to.equal(50n);
    expect(Number(submission.status)).to.equal(0);
    expect(submission.rewardCredited).to.equal(false);
  });

  it("user can submit Laptop × 2 and receive calculated reward = 100", async function () {
    const { userOne, contract } = await deployContract();

    await contract.connect(userOne).submitEwaste("Laptop", 2, 1000);

    const submission = await contract.getSubmission(1);
    expect(submission.reward).to.equal(100n);
    expect(await contract.getSubmissionCount()).to.equal(1n);
  });

  it("submission starts as Pending", async function () {
    const { userOne, contract } = await deployContract();

    await contract.connect(userOne).submitEwaste("Battery", 1, 200);
    const submission = await contract.getSubmission(1);

    expect(Number(submission.status)).to.equal(0);
  });

  it("recycler can verify a Pending submission", async function () {
    const { owner, recycler, userOne, contract } = await deployContract();

    await contract.connect(owner).addRecycler(recycler.address);
    await contract.connect(userOne).submitEwaste("Charger", 3, 300);

    await expect(contract.connect(recycler).verifySubmission(1))
      .to.emit(contract, "SubmissionVerified")
      .withArgs(1n, recycler.address);

    const submission = await contract.getSubmission(1);
    expect(Number(submission.status)).to.equal(1);
    expect(submission.verifiedAt).to.be.greaterThan(0n);
  });

  it("recycler cannot verify an already verified submission", async function () {
    const { owner, recycler, userOne, contract } = await deployContract();

    await contract.connect(owner).addRecycler(recycler.address);
    await contract.connect(userOne).submitEwaste("Charger", 2, 250);
    await contract.connect(recycler).verifySubmission(1);

    await expect(contract.connect(recycler).verifySubmission(1)).to.be.revertedWithCustomError(
      contract,
      "SubmissionNotPending",
    );
  });

  it("recycler can reject a Pending submission", async function () {
    const { owner, recycler, userOne, contract } = await deployContract();

    await contract.connect(owner).addRecycler(recycler.address);
    await contract.connect(userOne).submitEwaste("Circuit Board", 4, 700);

    await expect(contract.connect(recycler).rejectSubmission(1))
      .to.emit(contract, "SubmissionRejected")
      .withArgs(1n, recycler.address);

    const submission = await contract.getSubmission(1);
    expect(Number(submission.status)).to.equal(2);
    expect(submission.rewardCredited).to.equal(false);
  });

  it("rejected submission cannot receive a reward", async function () {
    const { owner, recycler, userOne, contract } = await deployContract();

    await contract.connect(owner).addRecycler(recycler.address);
    await contract.connect(userOne).submitEwaste("Other", 3, 400);
    await contract.connect(recycler).rejectSubmission(1);

    await expect(contract.connect(recycler).issueReward(1)).to.be.revertedWithCustomError(
      contract,
      "SubmissionNotVerified",
    );
  });

  it("reward cannot be issued before verification", async function () {
    const { owner, recycler, userOne, contract } = await deployContract();

    await contract.connect(owner).addRecycler(recycler.address);
    await contract.connect(userOne).submitEwaste("Battery", 3, 500);

    await expect(contract.connect(recycler).issueReward(1)).to.be.revertedWithCustomError(
      contract,
      "SubmissionNotVerified",
    );
  });

  it("verified submission can receive a reward", async function () {
    const { owner, recycler, userOne, contract } = await deployContract();

    await contract.connect(owner).addRecycler(recycler.address);
    await contract.connect(userOne).submitEwaste("Mobile Phone", 4, 600);
    await contract.connect(recycler).verifySubmission(1);

    await expect(contract.connect(recycler).issueReward(1))
      .to.emit(contract, "RewardIssued")
      .withArgs(1n, userOne.address, 100n);

    expect(await contract.getRewardBalance(userOne.address)).to.equal(100n);
  });

  it("reward cannot be issued twice", async function () {
    const { owner, recycler, userOne, contract } = await deployContract();

    await contract.connect(owner).addRecycler(recycler.address);
    await contract.connect(userOne).submitEwaste("Laptop", 1, 500);
    await contract.connect(recycler).verifySubmission(1);
    await contract.connect(recycler).issueReward(1);

    await expect(contract.connect(recycler).issueReward(1)).to.be.revertedWithCustomError(
      contract,
      "RewardAlreadyCredited",
    );
  });

  it("reward balance updates correctly", async function () {
    const { owner, recycler, userOne, contract } = await deployContract();

    await contract.connect(owner).addRecycler(recycler.address);
    await contract.connect(userOne).submitEwaste("Laptop", 2, 1500);
    await contract.connect(recycler).verifySubmission(1);
    await contract.connect(recycler).issueReward(1);

    expect(await contract.getRewardBalance(userOne.address)).to.equal(100n);
  });

  it("unsupported category reverts", async function () {
    const { userOne, contract } = await deployContract();

    await expect(contract.connect(userOne).submitEwaste("Unknown", 1, 100)).to.be.revertedWithCustomError(
      contract,
      "UnsupportedCategory",
    );
  });

  it("zero quantity reverts", async function () {
    const { userOne, contract } = await deployContract();

    await expect(contract.connect(userOne).submitEwaste("Mobile Phone", 0, 100)).to.be.revertedWithCustomError(
      contract,
      "InvalidQuantity",
    );
  });

  it("zero weight reverts", async function () {
    const { userOne, contract } = await deployContract();

    await expect(contract.connect(userOne).submitEwaste("Mobile Phone", 1, 0)).to.be.revertedWithCustomError(
      contract,
      "InvalidWeight",
    );
  });

  it("non-recycler cannot verify", async function () {
    const { userOne, contract } = await deployContract();

    await contract.connect(userOne).submitEwaste("Battery", 1, 100);

    await expect(contract.connect(userOne).verifySubmission(1)).to.be.revertedWithCustomError(
      contract,
      "NotRecycler",
    );
  });

  it("non-recycler cannot reject", async function () {
    const { userOne, contract } = await deployContract();

    await contract.connect(userOne).submitEwaste("Battery", 1, 100);

    await expect(contract.connect(userOne).rejectSubmission(1)).to.be.revertedWithCustomError(
      contract,
      "NotRecycler",
    );
  });

  it("non-recycler cannot issue rewards", async function () {
    const { owner, userOne, recycler, contract } = await deployContract();

    await contract.connect(owner).addRecycler(recycler.address);
    await contract.connect(userOne).submitEwaste("Battery", 2, 200);
    await contract.connect(recycler).verifySubmission(1);

    await expect(contract.connect(userOne).issueReward(1)).to.be.revertedWithCustomError(
      contract,
      "NotRecycler",
    );
  });

  it("submission IDs increment correctly", async function () {
    const { userOne, userTwo, contract } = await deployContract();

    await contract.connect(userOne).submitEwaste("Mobile Phone", 1, 100);
    await contract.connect(userTwo).submitEwaste("Laptop", 1, 200);

    expect(await contract.getSubmissionCount()).to.equal(2n);
    expect((await contract.getSubmission(1)).user).to.equal(userOne.address);
    expect((await contract.getSubmission(2)).user).to.equal(userTwo.address);
  });

  it("user submission history works", async function () {
    const { userOne, userTwo, contract } = await deployContract();

    await contract.connect(userOne).submitEwaste("Mobile Phone", 1, 100);
    await contract.connect(userOne).submitEwaste("Laptop", 1, 200);
    await contract.connect(userTwo).submitEwaste("Battery", 1, 100);

    const userOneIds = await contract.getUserSubmissionIds(userOne.address);
    expect(userOneIds.length).to.equal(2);
    expect(userOneIds[0]).to.equal(1n);
    expect(userOneIds[1]).to.equal(2n);

    const userTwoIds = await contract.getUserSubmissionIds(userTwo.address);
    expect(userTwoIds.length).to.equal(1);
    expect(userTwoIds[0]).to.equal(3n);
  });

  it("submission reward is calculated correctly for each category", async function () {
    const { userOne, contract } = await deployContract();

    await contract.connect(userOne).submitEwaste("Battery", 2, 400);
    const battery = await contract.getSubmission(1);
    expect(battery.reward).to.equal(30n);

    await contract.connect(userOne).submitEwaste("Circuit Board", 3, 500);
    const board = await contract.getSubmission(2);
    expect(board.reward).to.equal(60n);

    await contract.connect(userOne).submitEwaste("Other", 4, 1000);
    const other = await contract.getSubmission(3);
    expect(other.reward).to.equal(20n);
  });
});
