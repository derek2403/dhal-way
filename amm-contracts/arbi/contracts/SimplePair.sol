// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimplePair
 */
contract SimplePair is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token0; // USDC (lower address)
    IERC20 public immutable token1; // WETH (higher address)
    
    uint256 public reserve0; // USDC reserve
    uint256 public reserve1; // WETH reserve
    
    uint256 public constant FEE = 997; // 0.3% fee (997/1000)
    
    address public owner;

    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );

    event LiquidityAdded(
        address indexed provider,
        uint256 amount0,
        uint256 amount1
    );

    event Sync(uint256 reserve0, uint256 reserve1);

    constructor(address _token0, address _token1) {
        require(_token0 < _token1, "Tokens not sorted");
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        owner = msg.sender;
    }

    /**
     * @notice Add liquidity to the pool
     * @param amount0 Amount of token0 (USDC)
     * @param amount1 Amount of token1 (WETH)
     */
    function addLiquidity(uint256 amount0, uint256 amount1) external nonReentrant {
        // Transfer tokens from user
        token0.safeTransferFrom(msg.sender, address(this), amount0);
        token1.safeTransferFrom(msg.sender, address(this), amount1);
        
        // Update reserves
        reserve0 += amount0;
        reserve1 += amount1;
        
        emit LiquidityAdded(msg.sender, amount0, amount1);
        emit Sync(reserve0, reserve1);
    }

    /**
     * @notice Swap token0 for token1 (USDC → WETH)
     * @param amountIn Amount of USDC to swap
     * @param minAmountOut Minimum WETH to receive (slippage protection)
     * @return amountOut Amount of WETH received
     */
    function swapToken0ForToken1(uint256 amountIn, uint256 minAmountOut) 
        external 
        nonReentrant 
        returns (uint256 amountOut) 
    {
        require(amountIn > 0, "Amount must be > 0");
        require(reserve0 > 0 && reserve1 > 0, "No liquidity");
        
        // Calculate amount out using x * y = k
        uint256 amountInWithFee = amountIn * FEE;
        amountOut = (amountInWithFee * reserve1) / ((reserve0 * 1000) + amountInWithFee);
        
        require(amountOut >= minAmountOut, "Slippage too high");
        require(amountOut <= reserve1, "Insufficient liquidity");
        
        // Transfer tokens
        token0.safeTransferFrom(msg.sender, address(this), amountIn);
        token1.safeTransfer(msg.sender, amountOut);
        
        // Update reserves
        reserve0 += amountIn;
        reserve1 -= amountOut;
        
        emit Swap(msg.sender, amountIn, 0, 0, amountOut, msg.sender);
        emit Sync(reserve0, reserve1);
        
        return amountOut;
    }

    /**
     * @notice Swap token1 for token0 (WETH → USDC)
     * @param amountIn Amount of WETH to swap
     * @param minAmountOut Minimum USDC to receive
     * @return amountOut Amount of USDC received
     */
    function swapToken1ForToken0(uint256 amountIn, uint256 minAmountOut) 
        external 
        nonReentrant 
        returns (uint256 amountOut) 
    {
        require(amountIn > 0, "Amount must be > 0");
        require(reserve0 > 0 && reserve1 > 0, "No liquidity");
        
        // Calculate amount out using x * y = k
        uint256 amountInWithFee = amountIn * FEE;
        amountOut = (amountInWithFee * reserve0) / ((reserve1 * 1000) + amountInWithFee);
        
        require(amountOut >= minAmountOut, "Slippage too high");
        require(amountOut <= reserve0, "Insufficient liquidity");
        
        // Transfer tokens
        token1.safeTransferFrom(msg.sender, address(this), amountIn);
        token0.safeTransfer(msg.sender, amountOut);
        
        // Update reserves
        reserve1 += amountIn;
        reserve0 -= amountOut;
        
        emit Swap(msg.sender, 0, amountIn, amountOut, 0, msg.sender);
        emit Sync(reserve0, reserve1);
        
        return amountOut;
    }

    /**
     * @notice Get quote for token0 → token1 swap
     * @param amountIn Amount of token0 (USDC)
     * @return amountOut Expected amount of token1 (WETH)
     */
    function getAmountOut0(uint256 amountIn) external view returns (uint256 amountOut) {
        require(reserve0 > 0 && reserve1 > 0, "No liquidity");
        uint256 amountInWithFee = amountIn * FEE;
        amountOut = (amountInWithFee * reserve1) / ((reserve0 * 1000) + amountInWithFee);
    }

    /**
     * @notice Get quote for token1 → token0 swap
     * @param amountIn Amount of token1 (WETH)
     * @return amountOut Expected amount of token0 (USDC)
     */
    function getAmountOut1(uint256 amountIn) external view returns (uint256 amountOut) {
        require(reserve0 > 0 && reserve1 > 0, "No liquidity");
        uint256 amountInWithFee = amountIn * FEE;
        amountOut = (amountInWithFee * reserve0) / ((reserve1 * 1000) + amountInWithFee);
    }

    /**
     * @notice Get current reserves
     */
    function getReserves() external view returns (uint256, uint256) {
        return (reserve0, reserve1);
    }

    /**
     * @notice Owner emergency withdraw
     */
    function emergencyWithdraw() external {
        require(msg.sender == owner, "Only owner");
        token0.safeTransfer(owner, token0.balanceOf(address(this)));
        token1.safeTransfer(owner, token1.balanceOf(address(this)));
    }
}

