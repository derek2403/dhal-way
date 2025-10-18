/**
 * API Route: Get Real-Time Price from Pyth Network
 * GET /api/pyth/price
 * 
 * Query params:
 * - symbol: Token symbol (ETH, FLOW, etc.)
 */

// Pyth price feed IDs
const PYTH_PRICE_FEEDS = {
  'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', // ETH/USD
  'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', // BTC/USD
  'FLOW': '0x2fb245b9a84554a0f15aa123cbb5f64cd263b59e9a87d80148cbffab50c69f30', // FLOW/USD ✅
  'USDC': null, // USDC = $1.00 (stablecoin)
};

// Fallback prices for tokens not on Pyth
const FALLBACK_PRICES = {
  'FLOW': 0.70, // $0.70 (update as needed)
  'LINK': 15.50,
  'ARB': 0.80,
};

const HERMES_URL = 'https://hermes.pyth.network';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Missing symbol parameter' });
    }

    // USDC is always $1.00
    if (symbol === 'USDC' || symbol === 'USDT' || symbol === 'DAI') {
      return res.status(200).json({
        symbol,
        price: 1.0,
        confidence: 0.001,
        source: 'stablecoin',
        timestamp: Math.floor(Date.now() / 1000),
      });
    }

    const priceId = PYTH_PRICE_FEEDS[symbol];
    
    // If no Pyth feed, use fallback price
    if (!priceId) {
      const fallbackPrice = FALLBACK_PRICES[symbol];
      if (fallbackPrice) {
        console.log(`Using fallback price for ${symbol}: $${fallbackPrice}`);
        return res.status(200).json({
          symbol,
          price: fallbackPrice,
          confidence: 0.01,
          source: 'fallback',
          timestamp: Math.floor(Date.now() / 1000),
          note: `${symbol} not on Pyth mainnet, using fallback price`,
        });
      }
      return res.status(400).json({ error: `No price data for ${symbol}` });
    }

    // Fetch from Pyth Hermes
    const response = await fetch(
      `${HERMES_URL}/v2/updates/price/latest?ids[]=${priceId}`
    );

    if (!response.ok) {
      throw new Error(`Hermes API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.parsed || data.parsed.length === 0) {
      throw new Error('No price data returned');
    }

    const priceData = data.parsed[0];
    
    // Convert Pyth price format to USD
    // Pyth prices have expo (e.g., -8 means divide by 10^8)
    const price = parseFloat(priceData.price.price) * Math.pow(10, priceData.price.expo);
    const confidence = parseFloat(priceData.price.conf) * Math.pow(10, priceData.price.expo);

    return res.status(200).json({
      symbol,
      price,
      confidence,
      expo: priceData.price.expo,
      publishTime: priceData.price.publish_time,
      source: 'pyth',
      priceId,
    });

  } catch (error) {
    console.error('Pyth price fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch price',
      message: error.message,
    });
  }
}

