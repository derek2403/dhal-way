# CDP Server Wallet Setup

## 🎯 What This Does

Imports your existing wallet private key into CDP Server Wallet where it's:
- ✅ Secured in AWS Nitro Enclave (TEE)
- ✅ Never exposed (even to Coinbase!)
- ✅ Usable across all EVM chains
- ✅ No hardcoded private keys in code!

## Quick Setup

### Step 1: Get CDP API Keys (5 min)

1. Go to [CDP Portal](https://portal.cdp.coinbase.com)
2. Sign up/Sign in
3. Create API Key:
   - Go to Projects → API Keys
   - Create new key
   - ✅ Enable "Export" scope (for importing)
   - Download JSON or copy keys

### Step 2: Generate Wallet Secret (2 min)

1. In CDP Portal, go to Products → Server Wallets
2. Click "Generate Wallet Secret"
3. Copy the secret

### Step 3: Configure Environment (2 min)

```bash
cp .env.example .env
nano .env
```

Add your keys:
```
CDP_API_KEY_ID=organizations/xxx/apiKeys/xxx
CDP_API_KEY_SECRET=-----BEGIN EC PRIVATE KEY-----...
CDP_WALLET_SECRET=your-wallet-secret-here
EXISTING_PRIVATE_KEY=your_current_private_key_without_0x
```

### Step 4: Import Wallet + Create Smart Account (1 min)

```bash
node importWallet.js
```

**Output:**
```
✅ Owner EOA imported!
  Address: 0x41Db99b9A098Af28A06C0af238799c08076Af2f7

✅ Smart Account created!
  Address: 0x... (deterministic address)

✅ Features Enabled:
  ⚡ Transaction batching
  💰 Gas sponsorship (Base Sepolia)
  🔐 EIP-4337 account abstraction
```

## Usage in Your App

### Before (Hardcoded):
```javascript
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
// Private key in .env ❌
```

### After (CDP Smart Account):
```javascript
const cdp = new CdpClient();
const smartAccount = await cdp.evm.getAccount({ 
  name: "DhalwaySmartAccount" 
});

// Batch operations in ONE transaction!
await cdp.evm.sendUserOperation({
  smartAccount,
  network: "base-sepolia",
  calls: [
    { to: USDC, data: encodeFunctionData({...}) }, // Approve
    { to: WAY, data: encodeFunctionData({...}) },  // Mint
  ]
});

// ✅ Private key never exposed!
// ✅ Batch transactions!
// ✅ Gas sponsorship on Base!
```

## Benefits

**Security:**
- ✅ Key stored in AWS Nitro Enclave TEE
- ✅ Never exposed to your app
- ✅ Never exposed to Coinbase
- ✅ Production-grade security

**Features:**
- ✅ Works on all EVM chains
- ✅ Transaction batching
- ✅ Gas sponsorship (Smart Accounts)
- ✅ viem compatible

**Operational:**
- ✅ Single secret for all accounts
- ✅ Rotatable keys
- ✅ Professional infra

## Test Smart Account

```bash
node testSmartAccount.js
```

**This will:**
- ✅ Batch: Approve + Mint in 1 transaction
- ✅ Gas sponsored on Base Sepolia (FREE!)
- ✅ Show EIP-4337 Smart Account in action

## Next Steps

1. ✅ Import wallet: `node importWallet.js`
2. ✅ Test batching: `node testSmartAccount.js`
3. Integrate with payment executor
4. Remove private key from .env
5. Use CDP Smart Account for all operations!

**Total setup: ~10 minutes** ⏱️

## Why Smart Account?

**vs Regular EOA:**
- ✅ Batch transactions (approve + mint + bridge in 1 TX!)
- ✅ Gas sponsorship (free on Base Sepolia!)
- ✅ Spend limits & permissions
- ✅ EIP-4337 compliant

**Perfect for payments!** 🎯

