// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IRewardVault {
    function creditReward(address user, uint256 amount) external;
}

contract EWasteRegistry {
    enum Status {
        Pending,
        Verified,
        Rejected
    }

    struct Submission {
        uint256 id;
        address user;
        string category;
        uint256 quantity;
        uint256 weight;
        uint256 reward;
        Status status;
        uint256 submittedAt;
        uint256 verifiedAt;
        bool rewardIssued;
    }

    error NotOwner();
    error NotRecycler();
    error InvalidAddress();
    error InvalidQuantity();
    error InvalidWeight();
    error UnsupportedCategory();
    error SubmissionNotFound();
    error SubmissionNotPending();
    error SubmissionNotVerified();
    error RewardAlreadyIssued();
    error RecyclerAlreadyExists();
    error RecyclerNotFound();
    error RewardVaultNotSet();

    event EWasteSubmitted(
        uint256 indexed submissionId,
        address indexed user,
        string category,
        uint256 quantity,
        uint256 weight,
        uint256 reward
    );

    event SubmissionVerified(
        uint256 indexed submissionId,
        address indexed recycler
    );

    event SubmissionRejected(
        uint256 indexed submissionId,
        address indexed recycler
    );

    event RewardIssued(
        uint256 indexed submissionId,
        address indexed user,
        uint256 reward
    );

    event RecyclerAdded(address indexed recycler);
    event RecyclerRemoved(address indexed recycler);
    event RewardVaultUpdated(address indexed rewardVault);

    address public owner;
    address public rewardVault;

    uint256 public submissionCounter;

    mapping(uint256 => Submission) public submissions;
    mapping(address => bool) public recyclers;
    mapping(address => uint256[]) private userSubmissionIds;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyRecycler() {
        if (!recyclers[msg.sender]) revert NotRecycler();
        _;
    }

    function setRewardVault(address vault) external onlyOwner {
        if (vault == address(0)) revert InvalidAddress();

        rewardVault = vault;

        emit RewardVaultUpdated(vault);
    }

    function addRecycler(address recycler) external onlyOwner {
        if (recycler == address(0)) revert InvalidAddress();
        if (recyclers[recycler]) revert RecyclerAlreadyExists();

        recyclers[recycler] = true;

        emit RecyclerAdded(recycler);
    }

    function removeRecycler(address recycler) external onlyOwner {
        if (recycler == address(0)) revert InvalidAddress();
        if (!recyclers[recycler]) revert RecyclerNotFound();

        recyclers[recycler] = false;

        emit RecyclerRemoved(recycler);
    }

    function submitEwaste(
        string calldata category,
        uint256 quantity,
        uint256 weight
    ) external returns (uint256) {
        if (quantity == 0) revert InvalidQuantity();
        if (weight == 0) revert InvalidWeight();

        uint256 reward = _calculateReward(category, quantity);

        submissionCounter += 1;

        uint256 newId = submissionCounter;

        submissions[newId] = Submission({
            id: newId,
            user: msg.sender,
            category: category,
            quantity: quantity,
            weight: weight,
            reward: reward,
            status: Status.Pending,
            submittedAt: block.timestamp,
            verifiedAt: 0,
            rewardIssued: false
        });

        userSubmissionIds[msg.sender].push(newId);

        emit EWasteSubmitted(
            newId,
            msg.sender,
            category,
            quantity,
            weight,
            reward
        );

        return newId;
    }

    function verifySubmission(
        uint256 submissionId
    ) external onlyRecycler {
        Submission storage submission = submissions[submissionId];

        if (submission.id == 0) revert SubmissionNotFound();
        if (submission.status != Status.Pending) {
            revert SubmissionNotPending();
        }

        submission.status = Status.Verified;
        submission.verifiedAt = block.timestamp;

        emit SubmissionVerified(submissionId, msg.sender);
    }

    function rejectSubmission(
        uint256 submissionId
    ) external onlyRecycler {
        Submission storage submission = submissions[submissionId];

        if (submission.id == 0) revert SubmissionNotFound();
        if (submission.status != Status.Pending) {
            revert SubmissionNotPending();
        }

        submission.status = Status.Rejected;
        submission.verifiedAt = 0;

        emit SubmissionRejected(submissionId, msg.sender);
    }

    function issueReward(
        uint256 submissionId
    ) external onlyRecycler {
        Submission storage submission = submissions[submissionId];

        if (submission.id == 0) revert SubmissionNotFound();
        if (submission.status != Status.Verified) {
            revert SubmissionNotVerified();
        }
        if (submission.rewardIssued) {
            revert RewardAlreadyIssued();
        }
        if (rewardVault == address(0)) {
            revert RewardVaultNotSet();
        }

        IRewardVault(rewardVault).creditReward(
            submission.user,
            submission.reward
        );

        submission.rewardIssued = true;

        emit RewardIssued(
            submissionId,
            submission.user,
            submission.reward
        );
    }

    function getSubmission(
        uint256 submissionId
    ) external view returns (Submission memory) {
        Submission memory submission = submissions[submissionId];

        if (submission.id == 0) revert SubmissionNotFound();

        return submission;
    }

    function getUserSubmissionIds(
        address user
    ) external view returns (uint256[] memory) {
        return userSubmissionIds[user];
    }

    function getSubmissionCount()
        external
        view
        returns (uint256)
    {
        return submissionCounter;
    }

    function _calculateReward(
        string calldata category,
        uint256 quantity
    ) internal pure returns (uint256) {
        bytes32 categoryHash = keccak256(bytes(category));

        if (categoryHash == keccak256("Mobile Phone")) {
            return quantity * 25;
        }

        if (categoryHash == keccak256("Laptop")) {
            return quantity * 50;
        }

        if (categoryHash == keccak256("Battery")) {
            return quantity * 15;
        }

        if (categoryHash == keccak256("Charger")) {
            return quantity * 10;
        }

        if (categoryHash == keccak256("Circuit Board")) {
            return quantity * 20;
        }

        if (categoryHash == keccak256("Other")) {
            return quantity * 5;
        }

        revert UnsupportedCategory();
    }
}