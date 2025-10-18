// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title WAYToken
 * @notice Omnichain synthetic USD token backed 1:1 by USDC
 * @dev Regular OFT (NOT adapter!) with custom mint/burn for USDC backing
 * 
 * Architecture:
 * - Deploy on ALL chains (Arbitrum, Base, Sepolia, Flow, Optimism)
 * - Each deployment holds its own USDC reserves
 * - Users deposit USDC → mint WAY (1:1)
 * - Users burn WAY → get USDC back (1:1)
 * - WAY bridges between chains via LayerZero OFT
 * 
 * NO OFT Adapter needed!
 */
contract WAYToken is OFT {
    using SafeERC20 for IERC20;

    // USDC address on THIS chain
    IERC20 public immutable usdc;
    
    // Authorized addresses that can mint/burn (your routers)
    mapping(address => bool) public authorized;
    
    // Total USDC reserves on this chain
    uint256 public totalReserves;
    
    event Minted(address indexed to, uint256 amount, uint256 usdcLocked);
    event Burned(address indexed from, uint256 amount, uint256 usdcReturned);
    event ReservesDeposited(address indexed from, uint256 amount);

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _usdcAddress,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) Ownable(_delegate) {
        usdc = IERC20(_usdcAddress);
        authorized[_delegate] = true;
    }

    /**
     * @notice Mint WAY tokens (requires USDC deposit)
     * @param to Recipient of WAY tokens
     * @param amount Amount to mint (1:1 with USDC)
     */
    function mint(address to, uint256 amount) external onlyAuthorized {
        require(amount > 0, "Amount must be > 0");
        
        // Lock USDC in this contract (1:1 backing)
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        
        // Mint WAY tokens
        _mint(to, amount);
        
        // Track reserves
        totalReserves += amount;
        
        emit Minted(to, amount, amount);
    }

    /**
     * @notice Burn WAY tokens (returns USDC)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyAuthorized {
        require(amount > 0, "Amount must be > 0");
        require(totalReserves >= amount, "Insufficient reserves");
        
        // Burn WAY tokens
        _burn(from, amount);
        
        // Return USDC (1:1)
        usdc.safeTransfer(msg.sender, amount);
        
        // Track reserves
        totalReserves -= amount;
        
        emit Burned(from, amount, amount);
    }

    /**
     * @notice Owner deposits initial USDC reserves
     * @dev Use this to pre-fund the contract for settlements
     */
    function depositReserves(uint256 amount) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        totalReserves += amount;
        emit ReservesDeposited(msg.sender, amount);
    }

    /**
     * @notice Add authorized minter/burner (e.g., your PaymentRouter)
     */
    function addAuthorized(address addr) external onlyOwner {
        authorized[addr] = true;
    }

    /**
     * @notice Remove authorized address
     */
    function removeAuthorized(address addr) external onlyOwner {
        authorized[addr] = false;
    }

    /**
     * @notice Check if WAY is fully backed by USDC
     */
    function isFullyBacked() external view returns (bool) {
        return usdc.balanceOf(address(this)) >= totalSupply();
    }

    /**
     * @notice Get backing ratio (should always be 100%+)
     */
    function getBackingRatio() external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 10000; // 100%
        
        uint256 usdcBalance = usdc.balanceOf(address(this));
        return (usdcBalance * 10000) / supply; // In basis points
    }
}

