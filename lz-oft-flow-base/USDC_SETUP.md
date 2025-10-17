# Bridging USDC: Base Sepolia ↔ Arbitrum Sepolia

## ⚠️ Important: How OFT Adapter Works with USDC

### Architecture Overview

**Base Sepolia (Source Chain):**
- ✅ Uses **existing USDC** contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- ✅ Deploys `MyOFTAdapter` that **locks/unlocks** USDC
- ✅ When you send USDC, it gets **locked** in the adapter

**Arbitrum Sepolia (Destination Chain):**
- ⚠️ Does **NOT** use existing USDC at `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`
- ✅ Deploys a **NEW** `MyOFT` contract (wrapped USDC)
- ✅ When you receive tokens, the OFT **mints** wrapped USDC
- ⚠️ These are **wrapped tokens**, not native USDC from Circle

## Why Not Use Existing USDC on Both Chains?

The OFT Adapter architecture requires:
1. **ONE chain** with OFT Adapter (locks/unlocks existing token)
2. **ALL other chains** with OFT (mints/burns wrapped tokens)

This ensures:
- ✅ Unified liquidity management
- ✅ No double-spending
- ✅ Correct token supply tracking

## What Users Get

```
Base Sepolia                           Arbitrum Sepolia
─────────────                          ─────────────────
Real USDC (Circle)                     Wrapped USDC (Your OFT)
0x036CbD...3dCF7e                      0x[YourOFTAddress]
    ↓ (lock in adapter)                    ↑ (mint wrapped)
Locked in OFT Adapter  ────────────→   Wrapped USDC tokens
```

When bridging back:
```
Arbitrum Sepolia                       Base Sepolia
─────────────────                      ─────────────
Wrapped USDC                           Real USDC
    ↓ (burn wrapped)                       ↑ (unlock)
Burned    ─────────────────────────→   Real USDC returned
```

## Quick Start

### 1. Get USDC on Base Sepolia

You need real USDC tokens. Get them from:
- [Circle Faucet](https://faucet.circle.com/) (if available)
- [Uniswap on Base Sepolia](https://app.uniswap.org/)
- Bridges or testnet faucets

### 2. Deploy OFT Contracts

```bash
cd lz-oft-flow-base

# Create .env file
cat > .env << 'EOF'
PRIVATE_KEY=your_private_key_here
EOF

# Deploy both contracts
npx hardhat lz:deploy
# Select: base-sepolia, arbitrum-sepolia
# Tags: MyOFT, MyOFTAdapter
```

**Expected Output:**
```
Network: base-sepolia
Deployed contract: MyOFTAdapter, address: 0x...

Network: arbitrum-sepolia
Deployed contract: MyOFT, address: 0x...  ← This is your wrapped USDC
```

### 3. Wire the Contracts

```bash
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

### 4. Approve OFT Adapter

The adapter needs permission to spend your USDC:

```bash
npx hardhat run scripts/approve-adapter.ts --network base-sepolia
```

### 5. Bridge USDC

```bash
npx hardhat lz:oft:send \
  --src-eid 40245 \
  --dst-eid 40231 \
  --amount 10 \
  --to 0xYourRecipientAddress
```

**What happens:**
1. OFT Adapter locks 10 USDC on Base Sepolia
2. LayerZero sends message to Arbitrum
3. MyOFT mints 10 wrapped USDC on Arbitrum Sepolia
4. Recipient receives wrapped USDC

## USDC Decimals

USDC has **6 decimals** (not 18 like most tokens):
- 1 USDC = 1,000,000 (smallest units)
- When sending 10 USDC, you send 10000000 units

The OFT contracts automatically handle decimal conversion!

## Verifying Your Setup

### Check USDC Balance (Base Sepolia)
```bash
cast call 0x036CbD53842c5426634e7929541eC2318f3dCF7e \
  "balanceOf(address)(uint256)" \
  YOUR_ADDRESS \
  --rpc-url https://base-sepolia.gateway.tenderly.co
```

### Check Adapter Allowance
```bash
cast call 0x036CbD53842c5426634e7929541eC2318f3dCF7e \
  "allowance(address,address)(uint256)" \
  YOUR_ADDRESS \
  ADAPTER_ADDRESS \
  --rpc-url https://base-sepolia.gateway.tenderly.co
```

## Important Notes

### ⚠️ Wrapped vs Native USDC

**On Base Sepolia:**
- ✅ You use **real USDC** from Circle
- ✅ Same USDC everyone uses
- ✅ Can use in DeFi, CEX deposits, etc.

**On Arbitrum Sepolia:**
- ⚠️ You receive **wrapped USDC** (your OFT contract)
- ⚠️ This is NOT the native USDC from Circle
- ⚠️ Cannot directly deposit to CEX or use in native USDC pools
- ✅ Can bridge back to Base to get real USDC

### 💡 If You Need Native USDC on Both Chains

If you need to use Circle's native USDC on both chains, consider:

1. **Use Circle's CCTP (Cross-Chain Transfer Protocol)**
   - Bridges native USDC between chains
   - No wrapped tokens
   - [CCTP Documentation](https://developers.circle.com/stablecoins/docs/cctp-getting-started)

2. **Use LayerZero OFT with Mint/Burn Adapter**
   - Requires USDC contract to have mint/burn capabilities
   - Circle's USDC doesn't expose these functions
   - Only works for custom tokens with mint/burn

### 🎯 Best Use Cases

**OFT Adapter is perfect for:**
- ✅ Bridging from one chain to multiple chains
- ✅ Creating wrapped versions for cross-chain apps
- ✅ Testing cross-chain functionality
- ✅ DeFi applications that accept wrapped tokens

**OFT Adapter is NOT ideal for:**
- ❌ Needing native token on all chains
- ❌ CEX deposits (they want native USDC)
- ❌ Using native USDC DeFi pools on destination

## Token Information

### Base Sepolia USDC (Source)
```
Address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
Name: USD Coin
Symbol: USDC
Decimals: 6
Type: Native (Circle)
Explorer: https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Arbitrum Sepolia (Destination)
```
Address: [Your MyOFT deployment address]
Name: MyOFT (can be renamed in contract)
Symbol: MOFT (can be renamed in contract)
Decimals: 6 (inherited from Base USDC)
Type: Wrapped (LayerZero OFT)
```

## Customizing Token Name/Symbol

Want to rename your wrapped USDC on Arbitrum? Edit `contracts/MyOFT.sol`:

```solidity
// Change these values
const { address } = await deploy(contractName, {
    from: deployer,
    args: [
        'Wrapped USDC',  // ← Change name here
        'wUSDC',         // ← Change symbol here
        endpointV2Deployment.address,
        deployer,
    ],
    log: true,
    skipIfAlreadyDeployed: false,
})
```

Then redeploy.

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Insufficient USDC balance" | Get USDC from faucet or DEX on Base Sepolia |
| "Insufficient allowance" | Run approve script: `npx hardhat run scripts/approve-adapter.ts --network base-sepolia` |
| "Transfer amount exceeds balance" | Check your USDC balance is sufficient |
| "ERC20: transfer amount exceeds allowance" | Approve the adapter first |

## Getting USDC on Base Sepolia

### Option 1: Circle Faucet
Check [Circle's faucet](https://faucet.circle.com/) for testnet USDC.

### Option 2: Bridge from Ethereum Sepolia
If you have USDC on Ethereum Sepolia, use a bridge to move it to Base Sepolia.

### Option 3: Swap on DEX
If you have ETH on Base Sepolia, swap it for USDC on a testnet DEX like Uniswap.

### Option 4: Use a Multi-Chain Faucet
Some faucets provide USDC on multiple testnets.

## Next Steps

- ✅ Configuration is ready with USDC address
- ✅ Deploy contracts (Step 2 above)
- ✅ Get some USDC on Base Sepolia
- ✅ Approve and bridge!

## Useful Links

- [USDC on Base Sepolia](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
- [Circle CCTP Docs](https://developers.circle.com/stablecoins/docs/cctp-getting-started)
- [LayerZero Scan](https://layerzeroscan.com/)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

