/**
 * API Route: Get Supported Chains from Stargate
 * GET /api/stargate/chains
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://stargate.finance/api/v1/chains');
    
    if (!response.ok) {
      throw new Error(`Stargate API error: ${response.status}`);
    }

    const data = await response.json();
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching chains:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch chains',
      message: error.message 
    });
  }
}

