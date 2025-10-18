/**
 * API Route: Batch Mint using CDP Smart Account
 * POST /api/cdp/batch-mint
 * 
 * Body:
 * {
 *   amount: "10" // USDC amount
 * }
 */

const { CdpClient } = require('@coinbase/cdp-sdk');
const { encodeFunctionData, parseUnits } = require('viem');

// Contract addresses (Base Sepolia)
const WAY_TOKEN = '0xaFBbb476e98AD3BF169d2d4b4B85152774b16C1D';
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// ABIs
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
];

const WAY_ABI = [
  {
    name: 'mint',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  }
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount required' });
    }

    console.log('⚡ Executing batch transaction with CDP Smart Account');
    console.log('Amount:', amount, 'USDC');

    // Initialize CDP
    const cdp = new CdpClient();

    // Get your smart account
    const smartAccount = await cdp.evm.getAccount({
      name: "DhalwaySmartAccount"
    });

    console.log('Smart Account:', smartAccount.address);

    const amountWei = parseUnits(amount, 6);

    // Prepare batch calls
    const calls = [
      {
        to: USDC,
        value: '0x0',
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [WAY_TOKEN, amountWei]
        })
      },
      {
        to: WAY_TOKEN,
        value: '0x0',
        data: encodeFunctionData({
          abi: WAY_ABI,
          functionName: 'mint',
          args: [smartAccount.address, amountWei]
        })
      }
    ];

    console.log('Sending batch user operation...');

    // Send batch transaction using Smart Account
    const result = await cdp.evm.sendUserOperation({
      smartAccount,
      network: "base-sepolia",
      calls,
    });

    console.log('✅ Batch complete!');
    console.log('  Tx:', result.transactionHash);

    return res.status(200).json({
      success: true,
      transactionHash: result.transactionHash,
      explorerUrl: `https://sepolia.basescan.org/tx/${result.transactionHash}`,
      message: `Batched: Approved + Minted ${amount} WAY in ONE transaction!`,
      gasSponsored: true,
      smartAccountAddress: smartAccount.address,
    });

  } catch (error) {
    console.error('Batch mint error:', error);
    return res.status(500).json({
      error: 'Failed to execute batch',
      message: error.message,
    });
  }
}

