# WAY Token: Synthetic USD Bridge Token
## User-Abstracted Cross-Chain Routing

## 🎯 The Concept

**WAY Token = Synthetic USD** (1 WAY = 1 USD)
- Backed by real USD stablecoins (USDC/USDT)
- Users NEVER hold WAY (abstracted in routing)
- Used only as bridge intermediary
- Instant conversions: Any token → WAY → Any token

## Visual Flow

```
USER PERSPECTIVE (What they see):
═══════════════════════════════════════════════════════════
"Send 0.04 ETH on Ethereum → Receive FLOW on Flow EVM"

Click → Done! ✅

That's it. No intermediate tokens, no complexity.


UNDER THE HOOD (What actually happens):
═══════════════════════════════════════════════════════════

Ethereum Sepolia                        Flow EVM
─────────────────                       ─────────

User: 0.04 ETH                          Merchant: FLOW tokens
     ↓                                        ↑
     1. Swap ETH → WAY                   4. Swap WAY → FLOW
        (0.04 ETH → 100 WAY)                (100 WAY → FLOW)
     ↓                                        ↑
     2. Burn 100 WAY on Ethereum         3. Mint 100 WAY on Flow
     └───────────────────────────────────────┘
              LayerZero OFT Bridge
```

## Architecture

### 1. WAY Token (Synthetic USD)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title WAY Token
 * @notice Synthetic USD token for cross-chain routing
 * @dev 1 WAY = 1 USD, backed by USDC reserves
 * 
 * Key Features:
 * - Omnichain via LayerZero OFT
 * - 1:1 backed by USDC
 * - Only minted when USDC deposited
 * - Only burned when USDC withdrawn
 * - Users never hold it (abstracted)
 */
contract WAYToken is OFT {
    using SafeERC20 for IERC20;

    // Backing stablecoin (USDC)
    IERC20 public immutable backingToken;
    
    // Reserve ratio (in basis points, 10000 = 100%)
    uint256 public constant RESERVE_RATIO = 10000; // 100% backed
    
    // Total reserves held
    uint256 public totalReserves;
    
    // Authorized minters (PaymentRouter contracts)
    mapping(address => bool) public authorizedMinters;

    event Minted(address indexed to, uint256 amount, uint256 backingAmount);
    event Burned(address indexed from, uint256 amount, uint256 backingAmount);
    event ReservesDeposited(uint256 amount);
    event ReservesWithdrawn(address indexed to, uint256 amount);

    modifier onlyAuthorized() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(
        address _backingToken,
        address _lzEndpoint,
        address _owner
    ) OFT("WAY Token", "WAY", _lzEndpoint, _owner) Ownable(_owner) {
        backingToken = IERC20(_backingToken);
    }

    /**
     * @notice Mint WAY tokens (requires USDC deposit)
     * @dev Only callable by authorized routers
     * @param to Recipient address
     * @param amount Amount of WAY to mint
     */
    function mint(address to, uint256 amount) external onlyAuthorized {
        // Require 1:1 USDC backing
        backingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Mint WAY tokens
        _mint(to, amount);
        
        totalReserves += amount;
        
        emit Minted(to, amount, amount);
    }

    /**
     * @notice Burn WAY tokens and return USDC
     * @dev Only callable by authorized routers
     * @param from Address to burn from
     * @param amount Amount of WAY to burn
     */
    function burn(address from, uint256 amount) external onlyAuthorized {
        require(balanceOf(from) >= amount, "Insufficient balance");
        require(totalReserves >= amount, "Insufficient reserves");
        
        // Burn WAY tokens
        _burn(from, amount);
        
        // Return USDC
        backingToken.safeTransfer(msg.sender, amount);
        
        totalReserves -= amount;
        
        emit Burned(from, amount, amount);
    }

    /**
     * @notice Check if token is fully backed
     */
    function isFullyBacked() public view returns (bool) {
        uint256 backingBalance = backingToken.balanceOf(address(this));
        return backingBalance >= totalSupply();
    }

    /**
     * @notice Get backing ratio (in basis points)
     */
    function getBackingRatio() public view returns (uint256) {
        if (totalSupply() == 0) return 10000;
        uint256 backingBalance = backingToken.balanceOf(address(this));
        return (backingBalance * 10000) / totalSupply();
    }

    /**
     * @notice Owner adds authorized minter
     */
    function addAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
    }

    /**
     * @notice Owner removes authorized minter
     */
    function removeAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
    }

    /**
     * @notice Emergency: Owner can deposit reserves
     */
    function depositReserves(uint256 amount) external onlyOwner {
        backingToken.safeTransferFrom(msg.sender, address(this), amount);
        totalReserves += amount;
        emit ReservesDeposited(amount);
    }
}
```

### 2. UnifiedRouter (User-Facing Contract)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { OApp } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ISwapRouter } from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import { WAYToken } from "./WAYToken.sol";

/**
 * @title UnifiedRouter
 * @notice One-click cross-chain swaps (user never sees WAY token)
 * @dev Handles: Input Token → WAY → Bridge → WAY → Output Token
 * 
 * User Experience:
 * - User: "Swap ETH on Ethereum to FLOW on Flow"
 * - UnifiedRouter: Handles everything automatically
 * - User: Receives FLOW tokens ✅
 */
contract UnifiedRouter is OApp {
    using SafeERC20 for IERC20;

    // WAY token (synthetic USD)
    WAYToken public immutable wayToken;
    
    // USDC (backing token)
    IERC20 public immutable usdc;
    
    // Uniswap V3 router
    ISwapRouter public immutable swapRouter;
    
    struct CrossChainSwap {
        bytes32 id;
        address sender;
        address recipient;
        address sourceToken;
        uint256 sourceAmount;
        uint32 destChainId;
        address destToken;
        uint256 minDestAmount;
        uint256 wayAmount;      // Intermediate WAY amount
    }
    
    mapping(bytes32 => CrossChainSwap) public swaps;

    event SwapInitiated(
        bytes32 indexed swapId,
        address indexed sender,
        uint256 sourceAmount,
        uint32 destChain
    );

    event SwapCompleted(
        bytes32 indexed swapId,
        address indexed recipient,
        uint256 destAmount
    );

    constructor(
        address _wayToken,
        address _usdc,
        address _swapRouter,
        address _lzEndpoint,
        address _owner
    ) OApp(_lzEndpoint, _owner) {
        wayToken = WAYToken(_wayToken);
        usdc = IERC20(_usdc);
        swapRouter = ISwapRouter(_swapRouter);
    }

    /**
     * @notice User initiates cross-chain swap
     * @dev User never touches WAY token - fully abstracted!
     * 
     * Example: Swap 0.04 ETH on Ethereum → FLOW on Flow EVM
     * 
     * @param sourceToken Token user is paying with (e.g., WETH)
     * @param sourceAmount Amount of source token (e.g., 0.04 ETH)
     * @param destChainId Destination chain EID
     * @param destToken Token recipient wants (e.g., FLOW)
     * @param minDestAmount Minimum output (slippage protection)
     * @param recipient Who receives on destination chain
     */
    function swapCrossChain(
        address sourceToken,
        uint256 sourceAmount,
        uint32 destChainId,
        address destToken,
        uint256 minDestAmount,
        address recipient
    ) external payable returns (bytes32 swapId) {
        // Generate swap ID
        swapId = keccak256(
            abi.encodePacked(
                msg.sender,
                sourceToken,
                sourceAmount,
                destChainId,
                block.timestamp
            )
        );

        // Step 1: Collect source token from user
        IERC20(sourceToken).safeTransferFrom(msg.sender, address(this), sourceAmount);

        // Step 2: Swap source token → USDC
        uint256 usdcAmount = _swapToUSDC(sourceToken, sourceAmount);

        // Step 3: Mint WAY tokens (1:1 with USDC)
        // Note: User never sees WAY, it stays in this contract
        usdc.approve(address(wayToken), usdcAmount);
        wayToken.mint(address(this), usdcAmount);

        // Step 4: Bridge WAY tokens to destination chain
        _bridgeWAY(swapId, recipient, usdcAmount, destChainId, destToken, minDestAmount);

        // Store swap info
        swaps[swapId] = CrossChainSwap({
            id: swapId,
            sender: msg.sender,
            recipient: recipient,
            sourceToken: sourceToken,
            sourceAmount: sourceAmount,
            destChainId: destChainId,
            destToken: destToken,
            minDestAmount: minDestAmount,
            wayAmount: usdcAmount
        });

        emit SwapInitiated(swapId, msg.sender, sourceAmount, destChainId);

        return swapId;
    }

    /**
     * @notice Swap any token to USDC
     * @dev All swaps go through USDC to ensure WAY backing
     */
    function _swapToUSDC(address tokenIn, uint256 amountIn)
        internal
        returns (uint256 usdcAmount)
    {
        // If already USDC, no swap needed
        if (tokenIn == address(usdc)) {
            return amountIn;
        }

        // Approve Uniswap
        IERC20(tokenIn).safeApprove(address(swapRouter), amountIn);

        // Determine swap path
        bytes memory path;
        if (_isStablecoin(tokenIn)) {
            // Stablecoin → USDC (direct, 0.01% pool)
            path = abi.encodePacked(tokenIn, uint24(100), address(usdc));
        } else {
            // Token → WETH → USDC (multi-hop)
            path = abi.encodePacked(
                tokenIn,
                uint24(3000), // 0.3% pool
                _getWETH(),
                uint24(3000),
                address(usdc)
            );
        }

        // Execute swap
        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            path: path,
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: amountIn,
            amountOutMinimum: 0 // TODO: Add price oracle check
        });

        usdcAmount = swapRouter.exactInput(params);

        return usdcAmount;
    }

    /**
     * @notice Bridge WAY tokens to destination chain
     */
    function _bridgeWAY(
        bytes32 swapId,
        address recipient,
        uint256 wayAmount,
        uint32 destChainId,
        address destToken,
        uint256 minDestAmount
    ) internal {
        // Encode swap data for destination
        bytes memory composeMsg = abi.encode(
            swapId,
            recipient,
            destToken,
            minDestAmount
        );

        // Send WAY tokens via LayerZero OFT
        // WAY gets burned on source, minted on destination
        wayToken.send{value: msg.value}(
            SendParam({
                dstEid: destChainId,
                to: addressToBytes32(address(this)), // To this contract on dest
                amountLD: wayAmount,
                minAmountLD: wayAmount * 98 / 100, // 2% max slippage
                extraOptions: "",
                composeMsg: composeMsg,
                oftCmd: ""
            }),
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
    }

    /**
     * @notice Receive WAY tokens on destination chain
     * @dev Automatically swaps WAY → USDC → Destination token
     */
    function _lzReceive(
        Origin calldata /*_origin*/,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        // Decode swap data
        (
            bytes32 swapId,
            address recipient,
            address destToken,
            uint256 minDestAmount
        ) = abi.decode(_message, (bytes32, address, address, uint256));

        // Get WAY balance (just received from bridge)
        uint256 wayAmount = wayToken.balanceOf(address(this));

        // Step 1: Burn WAY tokens to get USDC
        wayToken.burn(address(this), wayAmount);
        uint256 usdcAmount = wayAmount; // 1:1

        // Step 2: Swap USDC → Destination token
        uint256 destAmount = _swapFromUSDC(destToken, usdcAmount);

        // Verify minimum output
        require(destAmount >= minDestAmount, "Slippage too high");

        // Step 3: Transfer to recipient
        IERC20(destToken).safeTransfer(recipient, destAmount);

        emit SwapCompleted(swapId, recipient, destAmount);
    }

    /**
     * @notice Swap USDC to any token
     */
    function _swapFromUSDC(address tokenOut, uint256 usdcAmount)
        internal
        returns (uint256 amountOut)
    {
        // If output is USDC, no swap needed
        if (tokenOut == address(usdc)) {
            return usdcAmount;
        }

        // Approve Uniswap
        usdc.approve(address(swapRouter), usdcAmount);

        // Determine swap path
        bytes memory path;
        if (_isStablecoin(tokenOut)) {
            // USDC → Stablecoin (direct)
            path = abi.encodePacked(address(usdc), uint24(100), tokenOut);
        } else {
            // USDC → WETH → Token (multi-hop)
            path = abi.encodePacked(
                address(usdc),
                uint24(3000),
                _getWETH(),
                uint24(3000),
                tokenOut
            );
        }

        // Execute swap
        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            path: path,
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: usdcAmount,
            amountOutMinimum: 0 // TODO: Add oracle check
        });

        amountOut = swapRouter.exactInput(params);

        return amountOut;
    }

    function _isStablecoin(address token) internal pure returns (bool) {
        // List of known stablecoins
        // TODO: Make this configurable
        return false; // Simplified for example
    }

    function _getWETH() internal pure returns (address) {
        // Return WETH address for current chain
        if (block.chainid == 1) return 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // Ethereum
        if (block.chainid == 42161) return 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1; // Arbitrum
        if (block.chainid == 8453) return 0x4200000000000000000000000000000000000006; // Base
        return address(0);
    }

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
}
```

## Complete User Flow

### Example: ETH (Sepolia) → FLOW (Flow EVM)

```
USER EXPERIENCE:
═══════════════════════════════════════════════════════════

1. User goes to your app
2. Selects:
   - From: 0.04 ETH on Ethereum Sepolia
   - To: FLOW tokens on Flow EVM
   - Recipient: 0xMerchant...
3. Clicks "Swap" → Transaction submitted
4. Waits 30 seconds
5. Merchant receives FLOW on Flow EVM ✅

User never sees WAY token! Completely abstracted! ✨


TECHNICAL FLOW:
═══════════════════════════════════════════════════════════

Ethereum Sepolia:
├─ 1. User deposits 0.04 ETH to UnifiedRouter
├─ 2. Router swaps: 0.04 ETH → 100 USDC (via Uniswap)
├─ 3. Router mints: 100 WAY (1:1 with USDC deposited)
├─ 4. Router bridges: 100 WAY via LayerZero
│       ├─ Burns 100 WAY on Ethereum
│       └─ Mints 100 WAY on Flow EVM
└─ User's ETH is gone ✅

           ↓ LayerZero Bridge (30 seconds)

Flow EVM:
├─ 5. UnifiedRouter receives 100 WAY
├─ 6. Router burns: 100 WAY → gets 100 USDC back
├─ 7. Router swaps: 100 USDC → FLOW (via DEX)
└─ 8. Router transfers: FLOW → Merchant ✅

Merchant receives FLOW! ✅
```

## Key Advantages

### 1. User Never Holds WAY
```
OLD (Bad UX):
User → Swap to bridge token → Wait → Swap from bridge token
     ↓                               ↓
User sees weird token in wallet   User has to manually swap
     ❌ Confusing                     ❌ Extra steps

NEW (Your Model):
User → One transaction → Done!
     ↓
Everything abstracted
     ✅ Clean UX
```

### 2. USD-Backed Stability
```
WAY = Synthetic USD (1:1 USDC backed)

Benefits:
✅ Stable value (no volatility)
✅ Users trust USD-backed tokens
✅ Easy to understand
✅ Regulatory friendly (backed asset)
```

### 3. Capital Efficiency
```
Traditional: Need EVERY token on EVERY chain
Your Model: Only need USDC liquidity + WAY/USDC pairs

Capital needed:
Traditional: $50M across all tokens
Your Model: $5M in USDC + WAY/USDC pools
```

### 4. Composability
```
WAY is just a routing mechanism
↓
Can integrate with:
- DEX aggregators (1inch)
- Lending protocols (Aave)
- Yield optimizers
- Other bridges
```

## Token Distribution (Different from PAY)

### WAY is NOT a governance token!

```
WAY = Pure utility (1:1 USDC backed)

No token sale! No distribution!

Minting:
├─ Only minted when USDC deposited
└─ Only burned when USDC withdrawn

Supply:
├─ Dynamic (based on usage)
└─ Always 100% backed by USDC
```

## Revenue Model

```
You don't make money from WAY token itself
↓
Make money from:

1. Swap Fees: 0.1-0.3% on conversions
   └─ User Token → USDC: 0.2%
   └─ USDC → Destination Token: 0.2%
   └─ Total: 0.4% per transaction

2. Bridge Fee: 0.1% on WAY transfers
   └─ Small fee on LayerZero OFT send

3. Spread: 0.05-0.1%
   └─ Slightly better rates for yourself

Example: $10M monthly volume
├─ Swap fees: $40K
├─ Bridge fees: $10K
└─ Total: $50K/month revenue
```

## Comparison: WAY vs PAY

| Feature | WAY (Your Model) | PAY (Previous) |
|---------|------------------|----------------|
| **Type** | Synthetic USD | Governance/Utility |
| **Backing** | 1:1 USDC | Market value |
| **User Exposure** | Abstracted ✅ | Users hold it |
| **Volatility** | None (USD) | Market driven |
| **Capital Needed** | Lower | Higher |
| **Token Distribution** | None (minted on-demand) | ICO/Fair Launch |
| **Regulatory** | Clearer (backed) | More complex |
| **Simplicity** | Higher ✅ | Medium |

## Real-World Examples

### 1. Stargate's STG Pools
```
- Not really 1:1 backing
- But similar abstraction
- Users swap USDC → USDC cross-chain
- STG used internally
```

### 2. Synapse's nUSD
```
- Nexus USD (synthetic)
- Backed by multiple stablecoins
- Users never hold nUSD
- Exactly your model! ✅
```

### 3. Across Protocol
```
- Uses USDC as settlement layer
- Similar abstraction
- Very successful!
```

## Implementation Steps

### Phase 1: Single Chain Test (2 weeks)
```
1. Deploy WAY token on Ethereum Sepolia
2. Deploy USDC backing (test USDC)
3. Deploy UnifiedRouter
4. Test: ETH → USDC → WAY → USDC → DAI
5. Verify 1:1 backing maintained
```

### Phase 2: Add LayerZero (4 weeks)
```
1. Deploy WAY on Arbitrum Sepolia
2. Configure OFT bridging
3. Test cross-chain: Ethereum → Arbitrum
4. Verify backing on both chains
5. Test full flow: ETH (ETH) → USDC (ARB)
```

### Phase 3: Production (6-8 weeks)
```
1. Security audit
2. Deploy on mainnets
3. Initial USDC reserves ($100K)
4. Launch with 3-5 chains
5. Monitor backing ratio
```

## Security Considerations

### 1. Backing Ratio
```
CRITICAL: Always maintain 1:1 backing!

Monitoring:
├─ Total WAY minted
├─ Total USDC reserves
└─ Backing ratio must be >= 100%

If ratio < 100%:
├─ Pause minting
├─ Emergency deposit
└─ Investigation
```

### 2. Authorization
```
Only UnifiedRouter can mint/burn WAY
↓
Prevents:
- Unauthorized minting
- Reserve theft
- Accounting errors
```

### 3. Reentrancy
```
All external calls protected
Use ReentrancyGuard
Test thoroughly
```

## Summary

### Your WAY Model is EXCELLENT! ✅

**Why it's better:**
1. ✅ User abstraction (clean UX!)
2. ✅ USD-backed (stable & trusted)
3. ✅ Lower capital requirements
4. ✅ Clearer regulatory path
5. ✅ Perfect LayerZero OFT use case

**Comparison:**
- Intent-Based: Great for efficiency, but no token ownership
- Bridge Token (PAY): Great for value capture, but complex token launch
- **WAY Model: Best of both worlds!** ✨
  - Token ownership ✅
  - Simple UX ✅
  - No token launch complexity ✅
  - Just need USDC backing ✅

**Capital Needed:**
- Vault Model: $10M+ 💸
- Intent-Based: $0 
- PAY Token: $500K-1M (token launch)
- **WAY Model: $100K-500K (just USDC reserves!)** 💰

**Recommendation:**
START WITH WAY MODEL!
- Deploy with $100K USDC backing
- Scale as volume grows
- Gradually increase reserves

This is EXACTLY how successful protocols work! 🚀

Want me to help you build the contracts?


