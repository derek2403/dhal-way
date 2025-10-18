# WAY Token - Omnichain Synthetic USD

## 🎯 What is WAY Token?

**WAY = Synthetic USD backed 1:1 by USDC**

- Regular OFT (NOT OFT Adapter!)
- Deployed on ALL chains
- Each deployment backed by local USDC
- Bridges seamlessly via LayerZero

## Architecture

```
NO OFT Adapter! Just regular OFT on each chain:

Arbitrum:    WAYToken (OFT) backed by Arbi USDC
Base:        WAYToken (OFT) backed by Base USDC
Sepolia:     WAYToken (OFT) backed by Sepolia USDC
Optimism:    WAYToken (OFT) backed by OP USDC

All connected via LayerZero ✅
```

## Key Difference from OFT Adapter

### OFT Adapter (lz-oft-flow-base):
```
Purpose: Bridge EXISTING token (Circle's USDC)
Setup: 1 Adapter + Many OFTs
Use when: Token already exists, can't modify it

Example: Bridge Circle USDC from Base to Arbitrum
```

### WAY Token (This Project):
```
Purpose: Create NEW omnichain token
Setup: Just OFT on every chain (NO adapter!)
Use when: Creating your own token

Example: Create WAY token that exists everywhere
```

## How It Works

### Mint WAY (Lock USDC):
```solidity
// User on Arbitrum
usdc.approve(wayToken, 100);
wayToken.mint(user, 100);

// What happens:
// 1. WAYToken takes 100 USDC from user (normal ERC20 transferFrom)
// 2. Locks it in WAYToken contract
// 3. Mints 100 WAY to user
// 4. Arbitrum USDC stays on Arbitrum!
```

### Bridge WAY:
```solidity
// Built-in OFT function!
wayToken.send(dstEid, amount, recipient);

// What happens:
// 1. Burns WAY on source chain
// 2. Mints WAY on destination chain  
// 3. USDC doesn't move! (stays locked on each chain)
```

### Burn WAY (Get USDC):
```solidity
// User on Base
wayToken.burn(user, 100);

// What happens:
// 1. Burns 100 WAY from user
// 2. Returns 100 USDC (normal ERC20 transfer)
// 3. USDC from Base reserves
```

## Quick Start

### 1. Install Dependencies

```bash
cd lz-tokens
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Add your PRIVATE_KEY
```

### 3. Deploy WAY on All Chains

```bash
npx hardhat lz:deploy

# Select chains: arbitrum-sepolia, base-sepolia, sepolia, optimism-sepolia
# Tag: WAYToken
```

### 4. Wire Everything

```bash
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

### 5. Deposit Initial USDC Reserves

```bash
# On each chain, deposit USDC so contract can handle burns
# Example on Arbitrum:
npx hardhat run scripts/depositReserves.js --network arbitrum-sepolia
```

## USDC Addresses by Chain

| Chain | USDC Address |
|-------|--------------|
| Arbitrum Sepolia | 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d |
| Base Sepolia | 0x036CbD53842c5426634e7929541eC2318f3dCF7e |
| Ethereum Sepolia | 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 |
| Optimism Sepolia | 0x5fd84259d66Cd46123540766Be93DFE6D43130D7 |

## Key Functions

### mint(address to, uint256 amount)
- Locks USDC, mints WAY (1:1)
- Only authorized addresses can call
- Uses normal ERC20 transferFrom

### burn(address from, uint256 amount)
- Burns WAY, returns USDC (1:1)
- Only authorized addresses can call
- Uses normal ERC20 transfer

### send(SendParam) - Inherited from OFT
- Bridges WAY to another chain
- Burns on source, mints on destination
- Built-in LayerZero function

### depositReserves(uint256 amount)
- Add USDC reserves to contract
- Needed for handling burns
- Anyone can call

## Important Notes

### Reserve Management

Each chain needs USDC reserves:

```
Example:
Arbitrum WAYToken: Start with 1000 USDC
├─ Users mint 500 WAY → Reserves: 1500 USDC
├─ Users burn 300 WAY → Reserves: 1200 USDC
└─ Always maintain buffer!

If reserves run low, rebalance using Stargate
```

### No Adapter Needed!

WAY uses NORMAL ERC20 functions to interact with USDC:
- `transferFrom()` - When minting (locking USDC)
- `transfer()` - When burning (returning USDC)

Every ERC20 (including USDC) has these functions!
No special adapter required! ✅

## Summary

**WAY Token = Regular OFT + Custom Mint/Burn**

- ✅ Deploy on all chains (like MyOFT)
- ✅ Add custom mint() that locks USDC
- ✅ Add custom burn() that returns USDC
- ✅ Bridge via inherited OFT functions
- ❌ NO OFT Adapter needed!

USDC interaction = Normal ERC20 functions
Cross-chain = LayerZero OFT (built-in)

Simple! ✅
