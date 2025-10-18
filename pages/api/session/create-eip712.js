/**
 * API Route: Create Session with EIP-712 Signature
 * POST /api/session/create-eip712
 */

const { ethers } = require('ethers');

// Store sessions (use database in production)
const sessions = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {userAddress, merchantAddress, signature, typedData, userPayments, merchantPayouts} = req.body;

    // Verify EIP-712 signature
    const recoveredAddress = ethers.utils.verifyTypedData(
      typedData.domain,
      typedData.types,
      typedData.value,
      signature
    );

    if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Create session
    const sessionId = ethers.utils.id(userAddress + Date.now());
    
    sessions.set(sessionId, {
      id: sessionId,
      userAddress,
      merchantAddress,
      userPayments,
      merchantPayouts,
      signature,
      typedData,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour
    });

    console.log('✅ EIP-712 session created');
    console.log('  User:', userAddress);
    console.log('  Merchant:', merchantAddress);
    console.log('  Payments:', userPayments.length);

    return res.status(200).json({
      success: true,
      sessionId,
      message: 'Session created with EIP-712 authorization',
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return res.status(500).json({
      error: 'Failed to create session',
      message: error.message,
    });
  }
}

export { sessions };

