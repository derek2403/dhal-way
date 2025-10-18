const { createDelegatedSession } = require('../../../lib/delegatedSessionManager');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress, signature, message, maxSpendUSD, durationMinutes = 60 } = req.body;

    if (!userAddress || !signature || !message || !maxSpendUSD) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userAddress', 'signature', 'message', 'maxSpendUSD']
      });
    }

    // Create delegated session (backend gets permission to use YOUR wallet)
    const session = createDelegatedSession(
      userAddress,
      signature,
      message, // Pass the exact message that was signed
      maxSpendUSD,
      durationMinutes
    );

    return res.status(200).json({
      success: true,
      session,
      message: 'Session created! Backend can now execute payments using YOUR wallet.',
      note: 'You still pay gas from your wallet, but no more signatures needed!',
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return res.status(500).json({
      error: 'Failed to create session',
      message: error.message,
    });
  }
}

