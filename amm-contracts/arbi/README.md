# Simple AMM Pool - WETH/USDC

Minimal AMM implementation for Arbitrum Sepolia (hackathon demo).

## Features

- ✅ Constant product AMM (x * y = k)
- ✅ 0.3% swap fee
- ✅ WETH/USDC pair
- ✅ Simple and reliable
- ✅ ~150 lines of code

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env and add your PRIVATE_KEY
```

### 3. Deploy Pool

```bash
npm run deploy
```

Save the deployed address!

### 4. Add Liquidity

```bash
# Edit scripts/addLiquidity.js and add your PAIR_ADDRESS
export PAIR_ADDRESS=0xYourDeployedAddress
npm run add-liquidity
```

You need:
- 1000 USDC (or adjust amount in script)
- 0.4 WETH (or adjust amount in script)

### 5. Test Swap

```bash
npm run test-swap
```

Should swap 0.001 WETH → ~2.5 USDC!

## Contract Addresses (Arbitrum Sepolia)

```
USDC: 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d
WETH: 0x980B62Da83eFf3D4576C647993b0c1D7faf17c73
SimplePair: [Your deployed address]
```

## How It Works

### Constant Product Formula

```
x * y = k

Where:
- x = USDC reserve
- y = WETH reserve  
- k = constant

When you swap:
- Add tokens to one reserve
- Remove tokens from other reserve
- Maintain k constant
```

### Example:

```
Initial state:
- USDC: 1000
- WETH: 0.4
- k = 1000 * 0.4 = 400

User swaps 0.001 WETH for USDC:
- New WETH reserve: 0.401
- New USDC reserve: 400 / 0.401 = 997.5
- USDC out: 1000 - 997.5 = 2.5 USDC
- Apply 0.3% fee: 2.5 * 0.997 = 2.4925 USDC

User receives: 2.4925 USDC ✅
```

## Using in Your App

### Option 1: Direct Integration

```javascript
// Call your SimplePair directly
const pair = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, signer);

// Swap WETH for USDC
await weth.approve(PAIR_ADDRESS, amount);
const amountOut = await pair.swapToken1ForToken0(amount, minOut);
```

### Option 2: Adapter Pattern

Create a router contract that wraps your SimplePair and exposes Uniswap-like interface.

## Functions

### `addLiquidity(uint256 amount0, uint256 amount1)`
Add USDC and WETH liquidity to the pool.

### `swapToken0ForToken1(uint256 amountIn, uint256 minAmountOut)`
Swap USDC for WETH.

### `swapToken1ForToken0(uint256 amountIn, uint256 minAmountOut)`
Swap WETH for USDC.

### `getAmountOut0(uint256 amountIn)` / `getAmountOut1(uint256 amountIn)`
Get quote for swap without executing.

### `getReserves()`
Get current pool reserves.

## Important Notes

⚠️ This is a MINIMAL implementation for demo purposes!

**For production, you'd need:**
- LP tokens (ERC20)
- Price oracles
- Reentrancy protection (included ✅)
- Access controls
- Events for indexing
- More safety checks

**For hackathon demo:**
- This is perfect! ✅
- Simple, works, shows concept
- Easy to understand
- Reliable

## Troubleshooting

### "Insufficient USDC/WETH"
Get testnet tokens from faucets or reduce liquidity amounts in script.

### "No liquidity"
Run `npm run add-liquidity` first.

### "Slippage too high"
Pool has low liquidity. Add more or adjust minAmountOut.

## Gas Costs

- Deploy: ~1.5M gas (~$0.50 on Arbitrum Sepolia)
- Add Liquidity: ~100K gas (~$0.03)
- Swap: ~80K gas (~$0.02)

Total setup: < $1 in gas! ✅
