/**
 * Delegated Session Manager
 * User grants permission, backend executes with user's wallet
 * User pays gas, but doesn't need to sign each transaction
 */

const { ethers } = require('ethers');

// Store active sessions (use Redis in production)
const activeSessions = new Map();

/**
 * Create delegated session
 * User signs permission, backend can execute on their behalf
 */
function createDelegatedSession(userAddress, userSignature, signedMessage, maxSpendUSD, durationMinutes = 60) {
  // Verify signature using the EXACT message that was signed
  let recoveredAddress;
  try {
    recoveredAddress = ethers.utils.verifyMessage(signedMessage, userSignature);
  } catch (error) {
    throw new Error('Invalid signature');
  }

  if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
    throw new Error('Signature does not match user address');
  }

  const sessionId = ethers.utils.id(userAddress + Date.now());

  const session = {
    id: sessionId,
    userAddress,
    userPrivateKey: null, // We DON'T store user's key!
    backendCanExecute: true, // Backend has permission
    maxSpendUSD,
    spentUSD: 0,
    createdAt: Date.now(),
    expiresAt: Date.now() + (durationMinutes * 60 * 1000),
    signature: userSignature, // Proof of authorization
  };

  activeSessions.set(sessionId, session);

  console.log('✅ Delegated session created:');
  console.log('  User wallet:', userAddress);
  console.log('  Permission granted to backend ✅');
  console.log('  Max spend: $', maxSpendUSD);
  console.log('  Valid for:', durationMinutes, 'minutes');

  return {
    sessionId,
    message: 'Backend can now execute payments using YOUR wallet (you pay gas)',
    maxSpendUSD,
    expiresAt: session.expiresAt,
  };
}

/**
 * Validate session and check permissions
 */
function validateDelegatedSession(sessionId, amountUSD) {
  const session = activeSessions.get(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  if (Date.now() > session.expiresAt) {
    throw new Error('Session expired');
  }

  if (session.spentUSD + amountUSD > session.maxSpendUSD) {
    throw new Error(`Spend limit exceeded: ${session.spentUSD + amountUSD} > ${session.maxSpendUSD}`);
  }

  // Update spent amount
  session.spentUSD += amountUSD;
  activeSessions.set(sessionId, session);

  return {
    userAddress: session.userAddress,
    authorized: true,
    remaining: session.maxSpendUSD - session.spentUSD,
  };
}

/**
 * Check if backend has permission to execute for user
 */
function hasPermission(sessionId) {
  const session = activeSessions.get(sessionId);
  return session && session.backendCanExecute && Date.now() < session.expiresAt;
}

/**
 * Revoke session
 */
function revokeSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.backendCanExecute = false;
    activeSessions.set(sessionId, session);
    return true;
  }
  return false;
}

module.exports = {
  createDelegatedSession,
  validateDelegatedSession,
  hasPermission,
  revokeSession,
};

