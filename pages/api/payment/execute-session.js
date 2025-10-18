/**
 * API Route: Execute Payment with Session Key
 * POST /api/payment/execute-session
 * 
 * Body:
 * {
 *   sessionId: "0x...",
 *   userPayments: [...],
 *   merchantAddress: "0x...",
 *   merchantPayouts: [...]
 * }
 */

const { validateDelegatedSession } = require('../../../lib/delegatedSessionManager');
const { executePayment } = require('../../../lib/paymentExecutor');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, userPayments, merchantAddress, merchantPayouts } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Calculate total payment
    const totalUSD = userPayments.reduce((sum, p) => sum + parseFloat(p.usdValue), 0);

    // Validate session - checks user gave permission
    const authorization = validateDelegatedSession(sessionId, totalUSD);

    console.log('✅ User authorized payment:');
    console.log('  User wallet:', authorization.userAddress);
    console.log('  Amount: $', totalUSD);
    console.log('  Remaining budget: $', authorization.remaining);

    // Execute payment using YOUR PRIVATE KEY (backend has permission)
    // User's wallet would be used in production via delegated transaction
    const result = await executePayment(userPayments, merchantAddress, merchantPayouts);
      
    return res.status(200).json({
      ...result,
      sessionUsed: true,
      userWallet: authorization.userAddress,
      message: `Payment executed with delegated permission from ${authorization.userAddress}`,
      note: 'User signed once, backend executed all steps automatically!',
    });

  } catch (error) {
    console.error('Session payment error:', error);
    return res.status(500).json({
      error: 'Failed to execute payment',
      message: error.message,
    });
  }
}

