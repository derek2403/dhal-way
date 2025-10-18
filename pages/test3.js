import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function CDPSmartAccountDemo() {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Execute batch mint using CDP Smart Account
  const executeBatchMint = async () => {
    if (!amount) {
      setStatus('Please enter amount');
      return;
    }

    setLoading(true);
    setStatus('⚡ Executing batch transaction via CDP Smart Account...');

    try {
      const response = await fetch('/api/cdp/batch-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      setStatus('✅ Batch complete! Approved + Minted in ONE transaction!');

    } catch (error) {
      setStatus('❌ Error: ' + error.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">CDP Smart Account Demo</h1>
            <p className="text-white/70">EIP-4337 Account Abstraction</p>
          </div>
          <ConnectButton />
        </div>

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
              className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="text-white/50 text-xs mt-1">
              Backend will batch: Approve + Mint in 1 transaction
            </p>
          </div>

          <button
            onClick={executeBatchMint}
            disabled={loading || !amount}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? '⏳ Processing...' : '⚡ Execute Batch (CDP Smart Account)'}
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

          {result && (
            <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-200 text-sm font-semibold mb-2">Transaction Details:</p>
              <p className="text-green-200/70 text-xs mb-1">
                Smart Account: {result.smartAccountAddress?.slice(0, 10)}...{result.smartAccountAddress?.slice(-8)}
              </p>
              <a
                href={result.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 text-xs hover:underline"
              >
                View on Basescan →
              </a>
              <p className="text-green-200 text-xs mt-2">
                ✅ Gas Sponsored: {result.gasSponsored ? 'YES (FREE!)' : 'No'}
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-6 bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-white font-bold mb-3">🔐 CDP Smart Account Features</h3>
          <div className="text-white/70 text-sm space-y-2">
            <p><strong>✅ Transaction Batching:</strong></p>
            <p className="ml-4">Approve + Mint executed in ONE transaction</p>
            
            <p className="mt-3"><strong>✅ Gas Sponsorship:</strong></p>
            <p className="ml-4">FREE gas on Base Sepolia (CDP pays!)</p>
            
            <p className="mt-3"><strong>✅ Secure Key Management:</strong></p>
            <p className="ml-4">Private key secured in AWS Nitro Enclave TEE</p>
            <p className="ml-4">Never exposed to your app or Coinbase</p>
            
            <p className="mt-3"><strong>✅ EIP-4337 Compliant:</strong></p>
            <p className="ml-4">Industry-standard account abstraction</p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
          <p className="text-cyan-200 text-sm">
            <strong>How it works:</strong><br/>
            1. Click execute (no wallet needed!)<br/>
            2. Backend uses CDP Smart Account<br/>
            3. Batches approve + mint in 1 TX<br/>
            4. CDP sponsors gas (free!)<br/>
            5. Done! ✅
          </p>
        </div>

        {/* Comparison */}
        <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/10">
          <p className="text-white/70 text-xs">
            <strong>Smart Account:</strong> 0x6818bDC452062898C82441930f07B9C0a2bB0318<br/>
            <strong>Owner:</strong> 0x41Db99b9A098Af28A06C0af238799c08076Af2f7<br/>
            <strong>Network:</strong> Base Sepolia
          </p>
        </div>
      </div>
    </div>
  );
}

