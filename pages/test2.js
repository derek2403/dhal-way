import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton, WalletButton } from '@rainbow-me/rainbowkit';
import { encodeFunctionData, parseUnits, numberToHex } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';

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

export default function BaseAccountDemo() {
  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Batch: Approve + Mint in ONE transaction!
  const batchApproveMint = async () => {
    if (!address || !walletClient || !amount) {
      setStatus('Please connect wallet and enter amount');
      return;
    }

    if (chain?.id !== baseSepolia.id) {
      setStatus('Please switch to Base Sepolia');
      return;
    }

    setLoading(true);
    setStatus('Preparing batch transaction...');

    try {
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
            args: [address, amountWei]
          })
        }
      ];

      setStatus('Sending batch transaction (approve + mint in ONE tx)...');

      // Send batch using Base Account's wallet_sendCalls
      const result = await walletClient.request({
        method: 'wallet_sendCalls',
        params: [{
          version: '2.0.0',
          from: address,
          chainId: numberToHex(baseSepolia.id),
          atomicRequired: true, // All or nothing!
          calls: calls
        }]
      });

      setStatus(`✅ Batch complete! Approved + Minted ${amount} WAY in ONE transaction! 🎉`);
      console.log('Batch result:', result);

    } catch (error) {
      console.error('Batch error:', error);
      setStatus('❌ Error: ' + (error.message || 'Transaction failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Base Account Demo</h1>
            <p className="text-white/70">Batch Transactions with WAY Token</p>
          </div>
          <div className="flex gap-2">
            <WalletButton wallet="baseAccount" />
            <ConnectButton />
          </div>
        </div>

        {/* Info Card */}
        {chain?.id !== baseSepolia.id && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
            <p className="text-yellow-200 text-sm font-semibold">
              ⚠️ Please switch to Base Sepolia
            </p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          
          <div className="mb-6">
            <label className="block text-white text-sm font-semibold mb-2">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10"
              step="0.01"
              className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-white/50 text-xs mt-1">
              Will mint {amount || '0'} WAY tokens (1:1 with USDC)
            </p>
          </div>

          <button
            onClick={batchApproveMint}
            disabled={loading || !address || !amount || chain?.id !== baseSepolia.id}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? '⏳ Processing...' : '⚡ Batch: Approve + Mint (1 TX!)'}
          </button>

          {status && (
            <div className={`mt-6 rounded-lg p-4 ${
              status.includes('❌') ? 'bg-red-500/20 border border-red-500/50' :
              status.includes('✅') ? 'bg-green-500/20 border border-green-500/50' :
              'bg-blue-500/20 border border-blue-500/50'
            }`}>
              <p className="text-white text-sm">{status}</p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-6 bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-white font-bold mb-3">⚡ Base Account Batch Transactions</h3>
          <div className="text-white/70 text-sm space-y-2">
            <p><strong>Traditional:</strong></p>
            <p className="ml-4">1. Approve USDC → Sign transaction</p>
            <p className="ml-4">2. Mint WAY → Sign transaction</p>
            <p className="ml-4">= 2 transactions, 2 signatures 😓</p>
            
            <p className="mt-3"><strong>Base Account Batch:</strong></p>
            <p className="ml-4">1. Approve + Mint → Sign ONCE</p>
            <p className="ml-4">= 1 transaction, 1 signature! 🎉</p>
            
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
              <p className="text-blue-200 text-xs">
                <strong>Atomic:</strong> Both calls succeed or both fail (no partial states)
              </p>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/10">
          <p className="text-white/50 text-xs">
            <strong>Contracts:</strong><br/>
            WAY: {WAY_TOKEN.slice(0, 6)}...{WAY_TOKEN.slice(-4)}<br/>
            USDC: {USDC.slice(0, 6)}...{USDC.slice(-4)}
          </p>
        </div>
      </div>
    </div>
  );
}

