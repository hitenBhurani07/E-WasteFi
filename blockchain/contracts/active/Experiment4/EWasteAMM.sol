// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EWasteAMM {
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint256 public reserve0;
    uint256 public reserve1;

    uint256 public totalLPSupply;
    mapping(address => uint256) public lpBalances;

    uint256 private _unlocked = 1;

    event LiquidityAdded(address indexed provider, uint256 token0Amount, uint256 token1Amount, uint256 lpAmount);
    event LiquidityRemoved(address indexed provider, uint256 token0Amount, uint256 token1Amount, uint256 lpAmount);
    event Swap(address indexed user, address indexed tokenIn, uint256 amountIn, address indexed tokenOut, uint256 amountOut);

    error InvalidTokens();
    error InvalidAmount();
    error InsufficientLiquidity();
    error InsufficientReserves();
    error TransferFailed();
    error Reentrancy();

    modifier nonReentrant() {
        if (_unlocked != 1) revert Reentrancy();
        _unlocked = 0;
        _;
        _unlocked = 1;
    }

    constructor(address _token0, address _token1) {
        if (_token0 == address(0) || _token1 == address(0) || _token0 == _token1) {
            revert InvalidTokens();
        }
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    function getReserves() external view returns (uint256, uint256) {
        return (reserve0, reserve1);
    }

    function addLiquidity(uint256 token0Amount, uint256 token1Amount) external nonReentrant returns (uint256 lpAmount) {
        if (token0Amount == 0 || token1Amount == 0) revert InvalidAmount();

        if (totalLPSupply == 0) {
            lpAmount = _sqrt(token0Amount * token1Amount);
        } else {
            uint256 lp0 = (token0Amount * totalLPSupply) / reserve0;
            uint256 lp1 = (token1Amount * totalLPSupply) / reserve1;
            lpAmount = lp0 < lp1 ? lp0 : lp1;
        }

        if (lpAmount == 0) revert InsufficientLiquidity();

        bool success0 = token0.transferFrom(msg.sender, address(this), token0Amount);
        if (!success0) revert TransferFailed();

        bool success1 = token1.transferFrom(msg.sender, address(this), token1Amount);
        if (!success1) revert TransferFailed();

        reserve0 += token0Amount;
        reserve1 += token1Amount;

        lpBalances[msg.sender] += lpAmount;
        totalLPSupply += lpAmount;

        emit LiquidityAdded(msg.sender, token0Amount, token1Amount, lpAmount);
    }

    function removeLiquidity(uint256 lpAmount) external nonReentrant returns (uint256 token0Amount, uint256 token1Amount) {
        if (lpAmount == 0 || lpBalances[msg.sender] < lpAmount) revert InvalidAmount();
        if (totalLPSupply == 0) revert InsufficientLiquidity();

        token0Amount = (lpAmount * reserve0) / totalLPSupply;
        token1Amount = (lpAmount * reserve1) / totalLPSupply;

        if (token0Amount == 0 || token1Amount == 0) revert InsufficientLiquidity();

        lpBalances[msg.sender] -= lpAmount;
        totalLPSupply -= lpAmount;

        reserve0 -= token0Amount;
        reserve1 -= token1Amount;

        bool success0 = token0.transfer(msg.sender, token0Amount);
        if (!success0) revert TransferFailed();

        bool success1 = token1.transfer(msg.sender, token1Amount);
        if (!success1) revert TransferFailed();

        emit LiquidityRemoved(msg.sender, token0Amount, token1Amount, lpAmount);
    }

    function swapToken0ForToken1(uint256 amountIn) external nonReentrant returns (uint256 amountOut) {
        if (amountIn == 0) revert InvalidAmount();
        if (reserve0 == 0 || reserve1 == 0) revert InsufficientReserves();

        // 0.3% fee: amountInWithFee = amountIn * 997 / 1000
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserve1;
        uint256 denominator = (reserve0 * 1000) + amountInWithFee;
        amountOut = numerator / denominator;

        if (amountOut == 0 || amountOut >= reserve1) revert InsufficientLiquidity();

        bool successIn = token0.transferFrom(msg.sender, address(this), amountIn);
        if (!successIn) revert TransferFailed();

        bool successOut = token1.transfer(msg.sender, amountOut);
        if (!successOut) revert TransferFailed();

        reserve0 += amountIn;
        reserve1 -= amountOut;

        emit Swap(msg.sender, address(token0), amountIn, address(token1), amountOut);
    }

    function swapToken1ForToken0(uint256 amountIn) external nonReentrant returns (uint256 amountOut) {
        if (amountIn == 0) revert InvalidAmount();
        if (reserve0 == 0 || reserve1 == 0) revert InsufficientReserves();

        // 0.3% fee: amountInWithFee = amountIn * 997 / 1000
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserve0;
        uint256 denominator = (reserve1 * 1000) + amountInWithFee;
        amountOut = numerator / denominator;

        if (amountOut == 0 || amountOut >= reserve0) revert InsufficientLiquidity();

        bool successIn = token1.transferFrom(msg.sender, address(this), amountIn);
        if (!successIn) revert TransferFailed();

        bool successOut = token0.transfer(msg.sender, amountOut);
        if (!successOut) revert TransferFailed();

        reserve1 += amountIn;
        reserve0 -= amountOut;

        emit Swap(msg.sender, address(token1), amountIn, address(token0), amountOut);
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
