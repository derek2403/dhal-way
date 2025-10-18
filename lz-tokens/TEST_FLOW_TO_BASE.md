# Test Complete Flow: USDC Flow → USDC Base

## 🎯 What This Tests

**Complete cross-chain value transfer:**
```
Flow EVM:        10 USDC
      ↓
   Mint 10 WAY (locks USDC)
      ↓
   Bridge via LayerZero
      ↓
Base Sepolia:    10 WAY arrives
      ↓
   Burn 10 WAY (get USDC)
      ↓
Base Sepolia:    10 USDC ✅
```

## Prerequisites

```
You need on Flow:
├─ 10 USDC (your TestUSDC)
└─ ~0.01 FLOW (for gas + LayerZero fee)
```

## Step-by-Step Test

### Step 1: Run Flow Script (Mint + Bridge)

```bash
npx hardhat run scripts/testFlowToBase.ts --network flow-testnet
```

**What it does:**
1. ✅ Checks you have 10 USDC on Flow
2. ✅ Approves WAYToken to spend USDC
3. ✅ Mints 10 WAY (locks 10 USDC)
4. ✅ Bridges 10 WAY to Base via LayerZero
5. ✅ Shows LayerZero Scan link

**Output:**
```
✅ Minted 10 WAY on Flow!
✅ Bridge transaction sent!
🔗 Track: https://testnet.layerzeroscan.com/tx/0x...
⏰ Waiting 30-60 seconds for delivery...
```

### Step 2: Wait for Cross-Chain Delivery (1 minute)

Click the LayerZero Scan link and wait for:
```
Status: ✅ Delivered
```

### Step 3: Run Base Script (Burn)

```bash
npx hardhat run scripts/burnOnBase.ts --network base-sepolia
```

**What it does:**
1. ✅ Checks you have 10 WAY on Base
2. ✅ Burns 10 WAY
3. ✅ Returns 10 USDC to your wallet

**Output:**
```
✅ Received 10 USDC on Base!
════════════════════════════════════════
Full Flow Success:
✅ 10 USDC on Flow → 10 WAY on Flow
✅ 10 WAY on Flow → 10 WAY on Base
✅ 10 WAY on Base → 10 USDC on Base
════════════════════════════════════════
```

## Alternative: Frontend Test

Visit: `http://localhost:3000/way-token-test`

**On Flow:**
1. Connect wallet
2. Switch to Flow Testnet
3. Amount: 10
4. Click "Mint WAY"
5. Sign transaction ✅

**Bridge (using LayerZero task):**
```bash
npx hardhat lz:oft:send \
  --src-eid 40351 \
  --dst-eid 40245 \
  --amount 10 \
  --to 0x41Db99b9A098Af28A06C0af238799c08076Af2f7
```

**On Base:**
1. Switch to Base Sepolia
2. Wait for delivery (~1 min)
3. Should see 10 WAY
4. Click "Burn WAY"
5. Receive 10 USDC ✅

## Summary

**Two ways to test:**

### Option A: Scripts (Automated)
```bash
# On Flow
npx hardhat run scripts/testFlowToBase.ts --network flow-testnet

# Wait 1 minute

# On Base
npx hardhat run scripts/burnOnBase.ts --network base-sepolia
```

### Option B: Frontend (Manual)
```
Use /way-token-test page
More visual, easier to understand
```

## Success Criteria

✅ 10 USDC locked on Flow
✅ 10 WAY minted on Flow
✅ 10 WAY bridged to Base
✅ 10 WAY burned on Base
✅ 10 USDC received on Base

**If all pass → WAY token works perfectly!** 🎉

