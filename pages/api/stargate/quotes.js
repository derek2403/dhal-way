/**
 * API Route: Get Transfer Quotes from Stargate
 * GET /api/stargate/quotes
 * 
 * Required query params:
 * - srcToken: Source token contract address
 * - dstToken: Destination token contract address
 * - srcAddress: User's wallet address on source chain
 * - dstAddress: User's wallet address on destination chain
 * - srcChainKey: Source chain identifier (e.g., 'ethereum', 'arbitrum')
 * - dstChainKey: Destination chain identifier
 * - srcAmount: Amount to transfer (in smallest unit)
 * - dstAmountMin: Minimum acceptable amount on destination
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      srcToken,
      dstToken,
      srcAddress,
      dstAddress,
      srcChainKey,
      dstChainKey,
      srcAmount,
      dstAmountMin
    } = req.query;

    // Validate required parameters
    if (!srcToken || !dstToken || !srcAddress || !dstAddress || 
        !srcChainKey || !dstChainKey || !srcAmount || !dstAmountMin) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: [
          'srcToken', 'dstToken', 'srcAddress', 'dstAddress',
          'srcChainKey', 'dstChainKey', 'srcAmount', 'dstAmountMin'
        ]
      });
    }

    // Build query string
    const params = new URLSearchParams({
      srcToken,
      dstToken,
      srcAddress,
      dstAddress,
      srcChainKey,
      dstChainKey,
      srcAmount,
      dstAmountMin
    });

    const url = `https://stargate.finance/api/v1/quotes?${params.toString()}`;
    
    console.log('Fetching quotes from:', url);
    
    const response = await fetch(url);
    
    // Handle 422 - means no routes available (not an error, just no liquidity)
    if (response.status === 422) {
      const data = await response.json();
      console.log('No routes available for this pair:', data);
      return res.status(200).json({ 
        quotes: [],
        message: 'No routes available for this token pair on Stargate'
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stargate API error:', response.status, errorText);
      throw new Error(`Stargate API error: ${response.status}`);
    }

    const data = await response.json();
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch quotes',
      message: error.message 
    });
  }
}

