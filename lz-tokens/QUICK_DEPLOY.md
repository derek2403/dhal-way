# Quick Deploy WAY Token (10 Minutes)

## Step 1: Install (2 min)

```bash
cd lz-tokens
npm install
```

## Step 2: Configure (1 min)

```bash
cp ../lz-oft-flow-base/.env .env
# Your PRIVATE_KEY already there! ✅
```

## Step 3: Deploy on All Chains (3 min)

```bash
npx hardhat lz:deploy

# When prompted:
# ✅ Select: arbitrum-sepolia, base-sepolia, sepolia, optimism-sepolia
# ✅ Tags: WAYToken
# ✅ Confirm: Yes
```

**Expected output:**
```
Deployed WAYToken on arbitrum-sepolia: 0x...
Deployed WAYToken on base-sepolia: 0x...
Deployed WAYToken on sepolia: 0x...
Deployed WAYToken on optimism-sepolia: 0x...
```

## Step 4: Wire Everything (2 min)

```bash
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

**This connects all WAY tokens together!**

## Step 5: Verify (1 min)

```bash
npx hardhat lz:oapp:peers:get --oapp-config layerzero.config.ts
```

Should show all chains connected! ✅

## Step 6: Deposit Initial Reserves (Optional)

```bash
# Each chain needs some USDC to handle burns
# Deposit 100-1000 USDC per chain

# Example: On Arbitrum
# Call depositReserves(1000000000) // 1000 USDC
```

## Done! 🎉

You now have WAY token on 4+ chains, all connected!

## Test It

```bash
# Send 10 WAY from Arbitrum to Base
npx hardhat lz:oft:send \
  --src-eid 40231 \
  --dst-eid 40245 \
  --amount 10 \
  --to 0xYourAddress
```

Should work! ✅

## Summary

**What you deployed:**
- ✅ WAYToken on Arbitrum (can mint/burn with Arbi USDC)
- ✅ WAYToken on Base (can mint/burn with Base USDC)
- ✅ WAYToken on Sepolia (can mint/burn with Sepolia USDC)
- ✅ WAYToken on Optimism (can mint/burn with OP USDC)
- ✅ All connected via LayerZero

**NO OFT Adapters! Just regular OFT with custom functions!**

Total time: 10 minutes ⏱️

