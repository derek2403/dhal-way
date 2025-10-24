# 💰 Tokenomics Architecture

## Overview

Your payment system enables **cross-chain payments** where users pay with any token on any chain, and merchants receive their preferred token on their preferred chain.

**Key Innovation:** WAY token acts as a **cross-chain bridge currency** backed 1:1 by USDC.

---

## The Payment Flow

### Example Transaction
```
User pays:          $10 LINK on Arbitrum Sepolia
Merchant receives:  $10 USDC on Base Sepolia
```

### Step-by-Step Process

```
┌─────────────┐
│   USER      │  Has: $10 LINK on Arbitrum
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 1: COLLECTION (On User's Chain - Arbitrum)  │
└─────────────────────────────────────────────────────┘

1. Swap LINK → USDC
   ├─ User has: $10 worth of LINK
   ├─ SmartVault AMM: Swap LINK for USDC
   └─ Result: $10 USDC on Arbitrum

2. Lock USDC & Mint WAY
   ├─ Approve: USDC for WAY contract
   ├─ Lock: $10 USDC in WAY vault
   └─ Mint: $10 WAY on Arbitrum
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 2: BRIDGING (Arbitrum → Base)               │
└─────────────────────────────────────────────────────┘

3. Bridge WAY via LayerZero
   ├─ Burn: $10 WAY on Arbitrum (source)
   ├─ LayerZero: Cross-chain message
   └─ Mint: $10 WAY on Base (destination)
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 3: SETTLEMENT (On Merchant's Chain - Base)  │
└─────────────────────────────────────────────────────┘

4. Burn WAY & Unlock USDC
   ├─ Burn: $10 WAY on Base
   └─ Unlock: $10 USDC from vault

5. Swap USDC → Final Token (if needed)
   ├─ If merchant wants USDC: Skip this step
   └─ If merchant wants ETH: Swap USDC → ETH

6. Transfer to Merchant
   └─ Send: $10 USDC to merchant address
       │
       ▼
┌─────────────┐
│  MERCHANT   │  Received: $10 USDC on Base ✅
└─────────────┘
```

---

## WAY Token Mechanics

### What is WAY?

**WAY** = Cross-chain stablecoin backed 1:1 by USDC

```
┌──────────────────────────────────────┐
│         WAY Token Vault              │
│                                      │
│  Assets Locked: 1,000 USDC          │
│  WAY Minted:    1,000 WAY           │
│  Ratio:         1:1 (always)        │
└──────────────────────────────────────┘

WAY is a LayerZero OFT (Omnichain Fungible Token)
```

### Mint Process (Lock USDC → Get WAY)

```javascript
1. User approves USDC for WAY contract
2. WAY contract locks USDC in vault
3. WAY contract mints WAY 1:1
4. User receives WAY tokens

Code:
usdc.approve(wayToken, amount)
wayToken.mint(userAddress, amount)  // Locks USDC, mints WAY
```

### Burn Process (Burn WAY → Get USDC)

```javascript
1. User burns WAY tokens
2. WAY contract releases USDC from vault
3. User receives USDC 1:1

Code:
wayToken.burn(userAddress, amount)  // Burns WAY, releases USDC
```

### Cross-Chain Transfer (LayerZero OFT)

```javascript
On Source Chain (Arbitrum):
wayToken.send(params)
├─ Burns WAY on Arbitrum
└─ Sends LayerZero message to Base

On Destination Chain (Base):
LayerZero delivers message
└─ Mints WAY on Base

Result: WAY moved from Arbitrum → Base
```

---

## Real Implementation vs Hackathon

### 🎯 Real Implementation (Production)

```
User Chain (Arbitrum):
├─ User has LINK
├─ SmartVault: Swap LINK → USDC (real AMM with liquidity)
├─ Lock USDC in vault
└─ Mint WAY

Bridge via LayerZero:
├─ Burn WAY on Arbitrum
└─ Mint WAY on Base

Merchant Chain (Base):
├─ Burn WAY
├─ Unlock USDC from vault
├─ SmartVault: Swap USDC → final token (if needed)
└─ Transfer to merchant

Full end-to-end: Everything automated
```

### 🚧 Hackathon Implementation (Demo)

```
User Chain (Arbitrum):
├─ User has USDC (or LINK, ETH, etc.)
├─ SmartVault swap: SIMULATED (logged but not executed) ⚠️
│  └─ Uses Pyth Network for price feeds (real)
├─ Lock USDC in vault ✅ (real)
└─ Mint WAY ✅ (real)

Bridge via LayerZero:
├─ Burn WAY on Arbitrum ✅ (real)
├─ LayerZero message ✅ (real)
└─ Mint WAY on Base ✅ (real)
└─ Wait 120 seconds ⚠️ (fixed timer, not polling)

Merchant Chain (Base):
├─ Burn WAY ✅ (real)
├─ Unlock USDC from vault ✅ (real)
├─ SmartVault swap: SIMULATED (logged but not executed) ⚠️
└─ Transfer USDC to merchant ✅ (real)

Result: Works for USDC → USDC payments
Other token swaps are simulated for demo
```

---

## What's Actually Happening

### ✅ Fully Implemented (Working)

1. **USDC Locking/Unlocking**
   - Real smart contracts
   - Real transactions
   - Actual USDC locked in vaults

2. **WAY Token Minting/Burning**
   - Real ERC20 token
   - 1:1 backed by USDC
   - Deployed on all chains

3. **LayerZero Bridging**
   - Real cross-chain messages
   - Actual WAY tokens bridged
   - Trackable on LayerZero Scan

4. **USDC Transfers**
   - Real on-chain transfers
   - Merchant actually receives USDC
   - Verifiable on block explorers

5. **EIP-712 Session Signatures**
   - Real cryptographic signatures
   - One signature → multiple backend transactions
   - Secure authorization

6. **Flashblocks (Base)**
   - Real 200ms preconfirmations
   - Production Base infrastructure
   - 10x faster settlements

### ⚠️ Simulated (Demo Only)

1. **Token Swaps (LINK, ETH, etc. → USDC)**
   ```javascript
   // Current (Demo):
   console.log(`Swapping ${amount} LINK → USDC`)
   // Logs the swap but doesn't execute
   
   // Production (Future):
   smartVault.exactSwap(tokenIn, tokenOut, amountIn, exactAmountOut)
   // Actually swaps via Uniswap/DEX
   ```

2. **LayerZero Delivery Polling**
   ```javascript
   // Current (Demo):
   await sleep(120000)  // Wait 2 minutes
   
   // Production (Future):
   await pollLayerZeroDelivery(txHash)  // Check actual status
   ```

---

## Smart Contracts

### WAY Token Contract

```solidity
contract WAYToken is OFT {
    IERC20 public usdc;
    
    // Mint: Lock USDC, mint WAY
    function mint(address to, uint256 amount) external {
        usdc.transferFrom(msg.sender, address(this), amount);
        _mint(to, amount);
    }
    
    // Burn: Burn WAY, release USDC
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
        usdc.transfer(from, amount);
    }
    
    // Bridge via LayerZero (OFT functionality)
    function send(...) external payable {
        // Burns on source, mints on destination
    }
}
```

### SmartVault Contract

```solidity
contract SmartVault {
    // Swap with exact output amount
    function exactSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 exactAmountOut
    ) external returns (uint256) {
        // Hackathon: Not implemented yet
        // Production: Integrates with Uniswap/AMM
    }
}
```

---

## Token Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    USER PAYS $10 LINK                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │   ARBITRUM SEPOLIA      │
        ├─────────────────────────┤
        │ LINK Balance: 0.0026    │
        └────────────┬────────────┘
                     │
         ┌───────────▼──────────┐
         │   SmartVault AMM     │  ⚠️ Simulated
         │   LINK → USDC        │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────┐
         │   USDC: $10.00       │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────┐
         │   Lock USDC          │  ✅ Real
         │   in WAY Vault       │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────┐
         │   Mint $10 WAY       │  ✅ Real
         │   on Arbitrum        │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────┐
         │   LayerZero Bridge   │  ✅ Real
         │   Arbitrum → Base    │
         └───────────┬──────────┘
                     │
        ┌────────────▼────────────┐
        │    BASE SEPOLIA         │
        ├─────────────────────────┤
        │  WAY Balance: $10.00    │
        └────────────┬────────────┘
                     │
         ┌───────────▼──────────┐
         │   Burn $10 WAY       │  ✅ Real
         │   on Base            │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────┐
         │   Unlock USDC        │  ✅ Real
         │   from Vault         │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────┐
         │   USDC: $10.00       │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────┐
         │   Transfer USDC      │  ✅ Real
         │   to Merchant        │
         └───────────┬──────────┘
                     │
┌────────────────────▼─────────────────────────────────────────┐
│              MERCHANT RECEIVES $10 USDC ON BASE              │
└──────────────────────────────────────────────────────────────┘
```

---

## Supported Chains & Tokens

### Chains (All Testnets)
- Ethereum Sepolia (11155111)
- Arbitrum Sepolia (421614)
- Base Sepolia (84532) ⚡ Flashblocks enabled
- Optimism Sepolia (11155420)
- Flow Testnet (545)

### Tokens

**Fully Supported (Working):**
- USDC → USDC (all chains)
- WAY → WAY (bridge token)

**Demo Supported (Simulated Swap):**
- ETH, LINK, PYUSD → USDC
- USDC → ETH, LINK, PYUSD

---

## Key Features

### 1. Cross-Chain Payments ✅
User on Chain A → Merchant on Chain B

### 2. Any Token to Any Token ⚠️
- USDC → USDC: Fully working
- Other tokens: Simulated for demo

### 3. One Signature ✅
EIP-712 signature → All backend transactions automated

### 4. Flashblocks (Base) ✅
200ms confirmations instead of 2 seconds

### 5. Session-Based ✅
Sign once, backend executes everything

---

## Transaction Costs

```
Example: User pays $10 on Arbitrum → Merchant receives on Base

Gas Costs (Approximate):
├─ Arbitrum USDC Approval:  $0.01
├─ Arbitrum WAY Mint:       $0.02
├─ LayerZero Bridge Fee:    $0.20 (most expensive!)
├─ Base WAY Burn:           $0.01
└─ Base USDC Transfer:      $0.01

Total Gas: ~$0.25

Merchant Receives: $10.00 USDC
User Paid: $10.00 + $0.25 gas = $10.25 total
```

---

## Security Model

### WAY Token Backing

```
Total USDC Locked = Total WAY Minted (always)

If 1,000 WAY exists across all chains:
└─ Exactly 1,000 USDC locked in vaults

Cannot mint WAY without locking USDC ✅
Cannot unlock USDC without burning WAY ✅
```

### LayerZero Security
- Cross-chain messages verified by LayerZero DVNs
- Destination chain verifies message authenticity
- WAY only minted if valid message received

### Backend Wallet
- Private key stored server-side only
- Executes transactions on behalf of user
- User authorizes via EIP-712 signature

---

## Production Roadmap

### Phase 1: Core (✅ Complete)
- [x] WAY token deployment
- [x] LayerZero bridging
- [x] USDC locking/unlocking
- [x] Backend execution engine
- [x] EIP-712 signatures
- [x] Flashblocks integration

### Phase 2: Swaps (🚧 In Progress)
- [ ] Integrate Uniswap V3
- [ ] Multi-hop routing
- [ ] Slippage protection
- [ ] Real-time price feeds
- [ ] Gas optimization

### Phase 3: Advanced (📋 Planned)
- [ ] LayerZero delivery polling
- [ ] Failed transaction recovery
- [ ] Multi-signature support
- [ ] Payment splitting
- [ ] Recurring payments
- [ ] Refund mechanism

---

## Summary

**What Works:**
- ✅ Cross-chain USDC payments (fully functional)
- ✅ WAY token bridging via LayerZero
- ✅ Session-based one-signature flow
- ✅ Flashblocks on Base (10x faster)
- ✅ Real on-chain transactions

**What's Simulated:**
- ⚠️ Token swaps (LINK, ETH, etc.)
- ⚠️ LayerZero delivery polling

**Bottom Line:**
The **core architecture is production-ready** for USDC payments. Token swap integration is the next step for full multi-token support.

---

**Last Updated:** October 21, 2025  
**Status:** Core ✅ | Swaps 🚧 | Advanced 📋



