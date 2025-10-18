# Quick Start Guide - OFT Adapter Setup (Using USDC)

## TL;DR - What You Need to Do

### 1️⃣ Create .env file
```bash
cd lz-oft-flow-base
cat > .env << EOF
PRIVATE_KEY=your_private_key_without_0x
EOF
```

> **Note:** USDC address is already configured!  
> Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### 2️⃣ Get USDC on Base Sepolia
You need real USDC tokens on Base Sepolia:
- [Circle Faucet](https://faucet.circle.com/) (if available)
- Swap ETH for USDC on a testnet DEX
- Bridge from Ethereum Sepolia

### 3️⃣ Deploy OFT Contracts
```bash
npx hardhat lz:deploy
# Select: base-sepolia, arbitrum-sepolia
# Tags: MyOFT, MyOFTAdapter
```

### 4️⃣ Wire the Contracts
```bash
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

### 5️⃣ Approve Adapter (IMPORTANT!)
```bash
npx hardhat run scripts/approve-adapter.ts --network base-sepolia
```

### 6️⃣ Bridge USDC
```bash
npx hardhat lz:oft:send \
  --src-eid 40245 \
  --dst-eid 40231 \
  --amount 10 \
  --to 0xYourRecipientAddress
```

> **Note:** USDC has 6 decimals, so 10 USDC = 10000000 (smallest units)

## What Changed in Your Setup

✅ **Base Sepolia** → Uses `MyOFTAdapter` (locks/unlocks USDC)  
✅ **Arbitrum Sepolia** → Uses `MyOFT` (mints/burns wrapped USDC)  
✅ Replaced Flow testnet with Arbitrum Sepolia  
✅ Pre-configured with **USDC** address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`  
✅ Added scripts to approve adapter

## ⚠️ Important: Wrapped vs Native USDC

**Base Sepolia (Source):**
- ✅ Uses **real USDC** from Circle: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- ✅ Your USDC gets **locked** in the OFT Adapter

**Arbitrum Sepolia (Destination):**
- ⚠️ You receive **wrapped USDC** (your OFT contract)
- ⚠️ This is NOT Circle's native USDC at `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`
- ✅ Wrapped tokens work in your dApps
- ✅ Can bridge back to Base to get real USDC

## Additional Notes

- **Approval required**: OFT Adapter needs approval to spend your USDC
- **Gas**: You need ETH on both Base Sepolia and Arbitrum Sepolia
- **Only ONE adapter**: Only ONE OFT Adapter can exist per token globally
- **6 decimals**: USDC uses 6 decimals (not 18)

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Insufficient USDC balance" | Get USDC from faucet or DEX on Base Sepolia |
| "Insufficient allowance" | Run the approve script (step 5) |
| "quoteSend reverts" | Re-run the wire command (step 4) |
| "Transfer amount exceeds balance" | Check your USDC balance |

## Understanding the Setup

**What you get:**
- Base Sepolia: Real USDC (Circle) gets **locked** in adapter
- Arbitrum Sepolia: Wrapped USDC gets **minted** by your OFT
- Bridge back: Wrapped tokens get **burned**, real USDC gets **unlocked**

For detailed explanations, see:
- [USDC_SETUP.md](./USDC_SETUP.md) - Complete USDC bridging guide
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Full deployment walkthrough

