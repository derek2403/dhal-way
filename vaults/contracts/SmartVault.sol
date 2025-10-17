// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SmartVault
 * @notice Simple vault for token swaps - frontend calculates exact amounts
 * @dev For hackathon: Frontend controls pricing via API, contract just executes
 */
contract SmartVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token0; // USDC
    IERC20 public immutable token1; // WETH
    
    uint256 public reserve0;
    uint256 public reserve1;
    
    address public owner;

    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event LiquidityAdded(address indexed provider, uint256 amount0, uint256 amount1);

    constructor(address _token0, address _token1) {
        require(_token0 < _token1, "Tokens not sorted");
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        owner = msg.sender;
    }

    /**
     * @notice Add liquidity
     */
    function addLiquidity(uint256 amount0, uint256 amount1) external nonReentrant {
        token0.safeTransferFrom(msg.sender, address(this), amount0);
        token1.safeTransferFrom(msg.sender, address(this), amount1);
        reserve0 += amount0;
        reserve1 += amount1;
        emit LiquidityAdded(msg.sender, amount0, amount1);
    }

    /**
     * @notice Exact swap - frontend specifies exact amounts
     * @dev This is the main function! Frontend does all calculations via API
     */
    function exactSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 exactAmountOut
    ) external nonReentrant returns (uint256) {
        require(
            (tokenIn == address(token0) && tokenOut == address(token1)) ||
            (tokenIn == address(token1) && tokenOut == address(token0)),
            "Invalid tokens"
        );
        
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(msg.sender, exactAmountOut);
        
        if (tokenIn == address(token0)) {
            reserve0 += amountIn;
            reserve1 -= exactAmountOut;
        } else {
            reserve1 += amountIn;
            reserve0 -= exactAmountOut;
        }
        
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, exactAmountOut);
        return exactAmountOut;
    }

    function getReserves() external view returns (uint256, uint256) {
        return (reserve0, reserve1);
    }
}

