# Payment Integration Guide

## Overview
Successfully integrated EIP-712 session-based payment execution into the transfer flow. Users can now scan merchant QR codes, select tokens, and execute cross-chain payments with a single signature.

## How It Works

### Flow Summary
1. **Merchant (merchant.js)** → Generates QR code with payment preferences
2. **User (transfer.js)** → Scans QR, enters amount, selects tokens, pays

### Detailed User Journey

#### 1. Merchant Setup (merchant.js)
Merchant configures their payment preferences:
```json
{
  "walletAddress": "0x41Db99b9A098Af28A06C0af238799c08076Af2f7",
  "sepolia": {"ETH": 50},
  "base": {"USDC": 50}
}
```
This means: "I want to receive 50% in ETH on Sepolia and 50% in USDC on Base Sepolia"

#### 2. User Payment (transfer.js)

**Step 1: Scan QR Code**
- User clicks the scan button
- Scans merchant's QR code
- System displays merchant wallet and payment preferences

**Step 2: Enter Payment Amount**
- Modal appears asking for payment amount
- User enters amount (e.g., $10.00)
- Confirms amount

**Step 3: Select Payment Tokens**
- User selects which tokens they want to pay with
- Can use any tokens from any supported chains
- System shows total USD value based on Pyth Network prices

**Step 4: Execute Payment**
- User clicks "Pay Now"
- Wallet prompts for EIP-712 signature (ONE signature)
- Backend automatically:
  - Collects tokens from user chains
  - Mints WAY tokens
  - Bridges via LayerZero
  - Burns WAY and sends to merchant
  - All according to merchant preferences

**Step 5: View Results**
- Payment results modal shows all transaction details
- Links to block explorers and LayerZero tracker
- User can start new payment or close

## Key Features

### 1. Automatic Token Conversion
- User pays with whatever tokens they have
- System automatically converts to merchant's preferred tokens
- Uses WAY token as intermediary bridge token

### 2. Cross-Chain Support
Supported chains:
- Ethereum Sepolia
- Arbitrum Sepolia
- Base Sepolia
- Optimism Sepolia
- Flow Testnet

### 3. Single Signature
- User only signs once (EIP-712)
- Backend executes all subsequent transactions
- No need for multiple wallet approvals

### 4. Real-Time Price Feeds
- Uses Pyth Network for accurate token prices
- Updates every 30 seconds
- Ensures fair value exchange

## Technical Implementation

### Components Modified

#### pages/transfer.js
**Added:**
- `useSignTypedData` hook for EIP-712 signatures
- Payment execution state management
- Chain mapping functions
- Data conversion functions (transferAmounts → userPayments)
- Merchant allocation parsing (QR data → merchantPayouts)
- Payment execution function with full flow
- Payment results modal
- Merchant preferences display

**Key Functions:**
```javascript
// Convert user's token selection to payment format
convertToUserPayments()

// Convert merchant QR data to payout format
convertToMerchantPayouts()

// Execute payment with EIP-712 signature
executePayment()
```

### Data Flow

#### Input: Merchant QR Data
```json
{
  "walletAddress": "0x...",
  "sepolia": {"ETH": 50},
  "base": {"USDC": 50}
}
```

#### Conversion: User Payments
```javascript
[
  { chain: "arbitrum-sepolia", token: "USDC", usdValue: "10.00" }
]
```

#### Conversion: Merchant Payouts
```javascript
[
  { chain: "sepolia", token: "ETH", usdValue: "5.00" },
  { chain: "base-sepolia", token: "USDC", usdValue: "5.00" }
]
```

## Setup Requirements

### Environment Variables
Add to `.env`:
```bash
# Required for payment execution
PRIVATE_KEY=your_backend_wallet_private_key

# Alchemy RPC URLs (recommended for reliability)
ARBITRUM_SEPOLIA_RPC=https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY
BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
OPTIMISM_SEPOLIA_RPC=https://opt-sepolia.g.alchemy.com/v2/YOUR_API_KEY
SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
FLOW_TESTNET_RPC=https://testnet.evm.nodes.onflow.org
```

### Contract Addresses (Already Configured)

**WAY Token Addresses:**
- Arbitrum Sepolia: `0x87D59Acdd1EE5a514256DB79c5a67e7cEa49739f`
- Base Sepolia: `0xaFBbb476e98AD3BF169d2d4b4B85152774b16C1D`
- Flow Testnet: `0x11157B1D577efd33354B47E7240FB3E3eF902f33`
- Optimism Sepolia: `0x8Cf5a78FC7251FF3923bDA4219D72C056759049A`
- Sepolia: `0xBB94908C6c622B966fBDc466e276fC7F775DB7Fb`

## Testing Guide

### Test Scenario 1: Same Chain Payment
1. Merchant wants: 100% USDC on Base Sepolia
2. User pays: $10 USDC on Base Sepolia
3. Expected: Direct transfer, no bridging needed

### Test Scenario 2: Cross-Chain Payment
1. Merchant wants: 100% USDC on Base Sepolia
2. User pays: $10 USDC on Arbitrum Sepolia
3. Expected:
   - Mint WAY on Arbitrum
   - Bridge WAY to Base
   - Burn WAY, get USDC
   - Send to merchant

### Test Scenario 3: Split Payment
1. Merchant wants: 50% ETH on Sepolia, 50% USDC on Base
2. User pays: $10 USDC on Arbitrum, $10 LINK on Sepolia
3. Expected:
   - Convert LINK → USDC (if needed)
   - Mint WAY on both chains
   - Bridge and distribute according to merchant preferences

## Mobile Usage

### QR Code Scanning on Mobile
1. Open `/merchant` page on desktop
2. Generate QR code
3. Open `/transfer` page on mobile
4. Scan QR code with phone camera
5. Complete payment on mobile device

## Error Handling

### Common Errors

**"Please scan merchant QR code first"**
- Solution: Scan a valid merchant QR code before paying

**"Please select tokens to pay with"**
- Solution: Select at least one token with amount > 0

**"Payment mismatch"**
- Solution: Your selected tokens' total USD value must match payment amount

**"Signature rejected"**
- Solution: User cancelled the signature. Try again.

**Network timeout errors**
- Solution: Ensure Alchemy RPC URLs are configured in `.env`

## Security Features

### EIP-712 Signature Benefits
- **Human Readable**: Users see exactly what they're signing
- **Type Safe**: Structured data prevents manipulation
- **Replay Protection**: Includes timestamp and nonce
- **Chain Specific**: Tied to specific chainId

### Backend Wallet Security
- Private key stored server-side only
- Never exposed to frontend
- All transactions executed by backend
- User only controls authorization via signature

## Payment Tracking

### Transaction Links
- **Block Explorers**: Direct links to view transactions
- **LayerZero Scan**: Track cross-chain bridge status
- **Real-time Status**: Updates during execution

### Payment Phases
1. **Collection**: Mint WAY tokens on user's chains
2. **Bridging**: Transfer WAY across chains via LayerZero
3. **Waiting**: Wait for LayerZero delivery (~2 minutes)
4. **Settlement**: Burn WAY, transfer final tokens to merchant

## Future Enhancements

### Potential Improvements
1. **Polling LayerZero**: Replace fixed wait with actual delivery confirmation
2. **Retry Logic**: Auto-retry failed transactions
3. **Gas Estimation**: Show estimated gas costs before payment
4. **Payment History**: Store and display past transactions
5. **Multi-signature**: Support for merchant multi-sig wallets
6. **Partial Payments**: Allow splitting large payments
7. **Refund Mechanism**: Handle failed payments gracefully

## Troubleshooting

### Payment Stuck?
- Check LayerZero Scan link for bridge status
- Verify RPC endpoints are responding
- Check backend wallet has enough gas on all chains

### Wrong Amount Received?
- Verify Pyth Network prices are updating
- Check for price slippage during swap
- Ensure merchant percentages add up to 100%

### Signature Issues?
- Make sure wallet is connected to correct network
- Try disconnecting and reconnecting wallet
- Clear browser cache and try again

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify `.env` configuration
3. Test with small amounts first
4. Review transaction hashes on block explorers

---

**Last Updated:** October 21, 2025
**Integration Status:** ✅ Complete and Functional



