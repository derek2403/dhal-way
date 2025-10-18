// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title WAYToken
 * @notice Omnichain synthetic USD token backed 1:1 by USDC
 * @dev Regular OFT (NOT adapter!) deployed on ALL chains
 * 
 * Key Concepts:
 * - This is a REGULAR OFT (inherits from OFT.sol)
 * - NOT an OFT Adapter! (we're creating a NEW token, not wrapping existing)
 * - Deployed on EVERY chain (Arbitrum, Base, Sepolia, Flow, etc.)
 * - Each deployment holds its own USDC reserves
 * - Uses normal ERC20 transferFrom/transfer to interact with USDC
 * 
 * Flow:
 * 1. User deposits USDC → mint() locks USDC, mints WAY (1:1)
 * 2. WAY bridges via OFT (burn on source, mint on dest)
 * 3. User burns WAY → burn() returns USDC (1:1)
 * 
 * NO OFT Adapter needed because:
 * - We're not bridging USDC itself
 * - We're creating NEW token (WAY) backed by USDC
 * - USDC stays local on each chain
 * - Only WAY bridges between chains
 */
contract WAYToken is OFT {
    using SafeERC20 for IERC20;

    // USDC contract on THIS specific chain
    // Each chain deployment points to different USDC address!
    IERC20 public immutable usdc;
    
    // Authorized addresses that can mint/burn (e.g., PaymentRouter contracts)
    mapping(address => bool) public authorized;
    
    // Total USDC reserves locked in this contract
    uint256 public totalReserves;
    
    event Minted(address indexed to, uint256 wayAmount, uint256 usdcLocked);
    event Burned(address indexed from, uint256 wayAmount, uint256 usdcReturned);
    event ReservesDeposited(address indexed from, uint256 amount);
    event AuthorizedAdded(address indexed addr);
    event AuthorizedRemoved(address indexed addr);

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    /**
     * @notice Constructor
     * @param _name Token name (e.g., "WAY Token")
     * @param _symbol Token symbol (e.g., "WAY")
     * @param _usdcAddress USDC address on THIS chain (different per chain!)
     * @param _lzEndpoint LayerZero Endpoint on THIS chain
     * @param _delegate Owner/delegate address
     */
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
     * @notice Override decimals to match USDC (6 decimals)
     * @dev CRITICAL: WAY must have same decimals as USDC for 1:1 conversion!
     */
    function decimals() public pure override returns (uint8) {
        return 6; // Same as USDC!
    }

    /**
     * @notice Mint WAY tokens (requires USDC deposit)
     * @dev Uses normal ERC20 transferFrom - NO adapter needed!
     * @param to Recipient of WAY tokens
     * @param amount Amount to mint (1:1 with USDC)
     */
    function mint(address to, uint256 amount) external onlyAuthorized {
        require(amount > 0, "Amount must be > 0");
        
        // Lock USDC in this contract using NORMAL ERC20 function
        // This is just standard ERC20 interaction - works with ANY USDC!
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        
        // Mint WAY tokens 1:1 with locked USDC
        _mint(to, amount);
        
        // Track reserves
        totalReserves += amount;
        
        emit Minted(to, amount, amount);
    }

    /**
     * @notice Burn WAY tokens (returns USDC)
     * @dev Uses normal ERC20 transfer - NO adapter needed!
     * @param from Address to burn WAY from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyAuthorized {
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(from) >= amount, "Insufficient WAY balance");
        require(totalReserves >= amount, "Insufficient USDC reserves");
        
        // Burn WAY tokens
        _burn(from, amount);
        
        // Return USDC using NORMAL ERC20 function
        usdc.safeTransfer(msg.sender, amount);
        
        // Track reserves
        totalReserves -= amount;
        
        emit Burned(from, amount, amount);
    }

    /**
     * @notice Owner deposits USDC reserves for future settlements
     * @dev Pre-fund contract so it can handle burns even if imbalanced
     */
    function depositReserves(uint256 amount) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        totalReserves += amount;
        emit ReservesDeposited(msg.sender, amount);
    }

    /**
     * @notice Add authorized minter/burner
     * @param addr Address to authorize (e.g., PaymentRouter)
     */
    function addAuthorized(address addr) external onlyOwner {
        authorized[addr] = true;
        emit AuthorizedAdded(addr);
    }

    /**
     * @notice Remove authorized address
     */
    function removeAuthorized(address addr) external onlyOwner {
        authorized[addr] = false;
        emit AuthorizedRemoved(addr);
    }

    /**
     * @notice Check if WAY is fully backed by USDC
     * @dev Should always return true (100%+ backed)
     */
    function isFullyBacked() external view returns (bool) {
        return usdc.balanceOf(address(this)) >= totalSupply();
    }

    /**
     * @notice Get backing ratio in basis points
     * @return ratio Backing ratio (10000 = 100%)
     */
    function getBackingRatio() external view returns (uint256 ratio) {
        uint256 supply = totalSupply();
        if (supply == 0) return 10000; // 100%
        
        uint256 usdcBalance = usdc.balanceOf(address(this));
        return (usdcBalance * 10000) / supply;
    }

    /**
     * @notice Get USDC address for this chain
     */
    function getUSDCAddress() external view returns (address) {
        return address(usdc);
    }
}

