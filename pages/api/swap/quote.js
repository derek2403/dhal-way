/**
 * API Route: Calculate exact swap amounts
 * GET /api/swap/quote
 * 
 * Frontend pricing engine - YOU control the price!
 * 
 * Query params:
 * - tokenIn: Input token symbol (ETH, USDC, etc.)
 * - tokenOut: Output token symbol
 * - amountIn: Amount to swap (in readable units, e.g., "0.001")
 * - chainId: Chain ID
 */

// Token prices (YOU control these!)
const PRICES = {
  'ETH': 2500,
  'WETH': 2500,
  'USDC': 1,
  'USDT': 1,
  'DAI': 1,
  'FLOW': 0.70,
};

// Token decimals
const DECIMALS = {
  'ETH': 18,
  'WETH': 18,
  'USDC': 6,
  'USDT': 6,
  'DAI': 18,
  'FLOW': 18,
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokenIn, tokenOut, amountIn } = req.query;

    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({
        error: 'Missing parameters',
        required: ['tokenIn', 'tokenOut', 'amountIn'],
      });
    }

    // Get prices
    const priceIn = PRICES[tokenIn];
    const priceOut = PRICES[tokenOut];

    if (!priceIn || !priceOut) {
      return res.status(400).json({ error: 'Token not supported' });
    }

    // Calculate USD value
    const usdValue = parseFloat(amountIn) * priceIn;
    
    // Calculate output amount
    let amountOut = usdValue / priceOut;
    
    // Apply 0.3% fee
    amountOut = amountOut * 0.997;

    // Convert to smallest units
    const decimalsIn = DECIMALS[tokenIn];
    const decimalsOut = DECIMALS[tokenOut];
    
    const amountInWei = Math.floor(parseFloat(amountIn) * Math.pow(10, decimalsIn));
    const amountOutWei = Math.floor(amountOut * Math.pow(10, decimalsOut));

    return res.status(200).json({
      tokenIn,
      tokenOut,
      amountIn: amountInWei.toString(),
      amountOut: amountOutWei.toString(),
      amountOutReadable: amountOut.toFixed(6),
      usdValue: usdValue.toFixed(2),
      priceIn,
      priceOut,
      fee: '0.3%',
    });
  } catch (error) {
    console.error('Error calculating quote:', error);
    return res.status(500).json({
      error: 'Failed to calculate quote',
      message: error.message,
    });
  }
}

