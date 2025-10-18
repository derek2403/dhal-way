/**
 * API Route: Execute Multi-Chain Payment
 * POST /api/payment/execute
 * 
 * Body:
 * {
 *   userPayments: [{ chain, token, usdValue }],
 *   merchantAddress: "0x...",
 *   merchantPayouts: [{ chain, token, usdValue }]
 * }
 */

const { executePayment } = require('../../../lib/paymentExecutor');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userPayments, merchantAddress, merchantPayouts } = req.body;

    // Validate inputs
    if (!userPayments || !merchantAddress || !merchantPayouts) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Execute payment using backend
    const result = await executePayment(userPayments, merchantAddress, merchantPayouts);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Payment execution error:', error);
    return res.status(500).json({
      error: 'Failed to execute payment',
      message: error.message,
    });
  }
}

// Old planning logic (keep for reference)
function planPayment(userPayments, merchantAddress, merchantPayouts) {
  const steps = [];

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: Collect Payments (Mint WAY on each source chain)
    // ═══════════════════════════════════════════════════════════
    
    for (const payment of userPayments) {
      steps.push({
        phase: 'collection',
        description: `Collect ${payment.usdValue} USD from ${payment.chain}`,
        chain: payment.chain,
        token: payment.token,
        amount: payment.usdValue,
        status: 'Processing...',
        substeps: [
          payment.token !== 'USDC' 
            ? `1. Swap ${payment.token} → USDC via SmartVault`
            : `1. Use USDC directly`,
          `2. Mint ${payment.usdValue} WAY (lock USDC)`,
          `3. ✅ ${payment.usdValue} WAY on ${payment.chain}`,
        ],
      });
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: Bridge WAY to Settlement Chains
    // ═══════════════════════════════════════════════════════════
    
    for (const payout of merchantPayouts) {
      steps.push({
        phase: 'bridging',
        description: `Bridge ${payout.usdValue} WAY to ${payout.chain}`,
        chain: payout.chain,
        amount: payout.usdValue,
        status: 'Pending...',
        substeps: [
          `1. Collect WAY from source chains`,
          `2. Bridge via LayerZero OFT`,
          `3. WAY arrives on ${payout.chain}`,
        ],
      });
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: Settlement (Burn WAY, get tokens, send to merchant)
    // ═══════════════════════════════════════════════════════════
    
    for (const payout of merchantPayouts) {
      steps.push({
        phase: 'settlement',
        description: `Pay merchant ${payout.usdValue} ${payout.token} on ${payout.chain}`,
        chain: payout.chain,
        token: payout.token,
        amount: payout.usdValue,
        status: 'Pending...',
        substeps: [
          `1. Burn ${payout.usdValue} WAY → get USDC`,
          payout.token !== 'USDC'
            ? `2. Swap USDC → ${payout.token} via SmartVault`
            : `2. Use USDC directly`,
          `3. Transfer to merchant ${merchantAddress.slice(0, 6)}...${merchantAddress.slice(-4)}`,
        ],
      });
    }

  // Return execution plan
  return {
    success: true,
    message: 'Payment flow planned',
    totalUSD: userPayments.reduce((sum, p) => sum + parseFloat(p.usdValue), 0),
    steps,
    note: 'Demo mode: Showing execution plan.',
  };
}

