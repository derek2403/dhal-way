/**
 * API Route: Get Supported Tokens from Stargate
 * GET /api/stargate/tokens
 * 
 * Query params:
 * - srcChainKey (optional): Filter by source chain
 * - srcToken (optional): Filter by source token address
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all tokens (Stargate API doesn't always support query params)
    const url = 'https://stargate.finance/api/v1/tokens';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stargate API error:', errorText);
      throw new Error(`Stargate API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter only bridgeable tokens
    let bridgeableTokens = data.tokens?.filter(token => token.isBridgeable) || [];
    
    // Apply filters from query params if provided
    const { srcChainKey, srcToken } = req.query;
    if (srcChainKey) {
      bridgeableTokens = bridgeableTokens.filter(t => t.chainKey === srcChainKey);
    }
    if (srcToken) {
      bridgeableTokens = bridgeableTokens.filter(t => t.address.toLowerCase() === srcToken.toLowerCase());
    }
    
    return res.status(200).json({ tokens: bridgeableTokens });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch tokens',
      message: error.message 
    });
  }
}

