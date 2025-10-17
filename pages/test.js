import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function PaymentDemo() {
  // Payment state
  const [totalUSD, setTotalUSD] = useState('');
  const [userPayments, setUserPayments] = useState([
    { chain: 'arbitrum-sepolia', token: 'USDC', usdValue: '' }
  ]);
  const [merchantAddress, setMerchantAddress] = useState('');
  const [merchantPayouts, setMerchantPayouts] = useState([
    { chain: 'base-sepolia', token: 'USDC', usdValue: '' }
  ]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Available chains
  const chains = [
    { value: 'arbitrum-sepolia', label: 'Arbitrum Sepolia' },
    { value: 'base-sepolia', label: 'Base Sepolia' },
    { value: 'flow-testnet', label: 'Flow Testnet' },
    { value: 'optimism-sepolia', label: 'Optimism Sepolia' },
    { value: 'sepolia', label: 'Ethereum Sepolia' },
  ];

  // Available tokens per chain
  const tokens = {
    'arbitrum-sepolia': ['USDC', 'ETH'],
    'base-sepolia': ['USDC', 'ETH'],
    'flow-testnet': ['USDC', 'FLOW'],
    'optimism-sepolia': ['USDC', 'ETH'],
    'sepolia': ['USDC', 'ETH'],
  };

  // Add payment input
  const addUserPayment = () => {
    setUserPayments([...userPayments, { chain: 'arbitrum-sepolia', token: 'USDC', usdValue: '' }]);
  };

  // Remove payment input
  const removeUserPayment = (index) => {
    setUserPayments(userPayments.filter((_, i) => i !== index));
  };

  // Add merchant payout
  const addMerchantPayout = () => {
    setMerchantPayouts([...merchantPayouts, { chain: 'base-sepolia', token: 'USDC', usdValue: '' }]);
  };

  // Remove merchant payout
  const removeMerchantPayout = (index) => {
    setMerchantPayouts(merchantPayouts.filter((_, i) => i !== index));
  };

  // Update user payment
  const updateUserPayment = (index, field, value) => {
    const updated = [...userPayments];
    updated[index][field] = value;
    setUserPayments(updated);
  };

  // Update merchant payout
  const updateMerchantPayout = (index, field, value) => {
    const updated = [...merchantPayouts];
    updated[index][field] = value;
    setMerchantPayouts(updated);
  };

  // Calculate totals
  const userTotal = userPayments.reduce((sum, p) => sum + (parseFloat(p.usdValue) || 0), 0);
  const merchantTotal = merchantPayouts.reduce((sum, p) => sum + (parseFloat(p.usdValue) || 0), 0);

  // Execute payment
  const executePayment = async () => {
    if (!merchantAddress) {
      setStatus('❌ Please enter merchant address');
      return;
    }

    if (Math.abs(userTotal - merchantTotal) > 0.01) {
      setStatus('❌ User payments must equal merchant payouts');
      return;
    }

    setLoading(true);
    setStatus('🔄 Processing payment...');

    try {
      const response = await fetch('/api/payment/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPayments,
          merchantAddress,
          merchantPayouts,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data);
      setStatus('✅ Payment completed successfully!');
    } catch (error) {
      setStatus('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Multi-Chain Payment Demo</h1>
            <p className="text-white/70">Collect from multiple chains, settle on any chain</p>
          </div>
          <ConnectButton />
        </div>

        <div className="grid grid-cols-2 gap-6">
          
          {/* USER SIDE */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">👤 User Pays</h2>
            
            {userPayments.map((payment, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white/70 text-sm">Payment {idx + 1}</p>
                  {userPayments.length > 1 && (
                    <button
                      onClick={() => removeUserPayment(idx)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {/* Chain */}
                <select
                  value={payment.chain}
                  onChange={(e) => updateUserPayment(idx, 'chain', e.target.value)}
                  className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white mb-2 text-sm"
                >
                  {chains.map(c => (
                    <option key={c.value} value={c.value} className="bg-gray-900">
                      {c.label}
                    </option>
                  ))}
                </select>

                {/* Token */}
                <select
                  value={payment.token}
                  onChange={(e) => updateUserPayment(idx, 'token', e.target.value)}
                  className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white mb-2 text-sm"
                >
                  {tokens[payment.chain]?.map(t => (
                    <option key={t} value={t} className="bg-gray-900">
                      {t}
                    </option>
                  ))}
                </select>

                {/* USD Value */}
                <input
                  type="number"
                  value={payment.usdValue}
                  onChange={(e) => updateUserPayment(idx, 'usdValue', e.target.value)}
                  placeholder="USD value (e.g., 10)"
                  className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white placeholder-white/50 text-sm"
                />
              </div>
            ))}

            <button
              onClick={addUserPayment}
              className="w-full bg-blue-500/20 border border-blue-500/50 text-blue-200 py-2 rounded hover:bg-blue-500/30 transition-all text-sm mb-4"
            >
              + Add Payment Source
            </button>

            <div className="bg-green-500/10 border border-green-500/50 rounded p-3">
              <p className="text-green-200 font-bold">
                Total: ${userTotal.toFixed(2)}
              </p>
            </div>
          </div>

          {/* MERCHANT SIDE */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">🏪 Merchant Receives</h2>
            
            {/* Merchant Address */}
            <div className="mb-4">
              <label className="block text-white text-sm mb-2">Merchant Wallet Address</label>
              <input
                type="text"
                value={merchantAddress}
                onChange={(e) => setMerchantAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white placeholder-white/50 text-sm"
              />
            </div>

            {merchantPayouts.map((payout, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white/70 text-sm">Payout {idx + 1}</p>
                  {merchantPayouts.length > 1 && (
                    <button
                      onClick={() => removeMerchantPayout(idx)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {/* Chain */}
                <select
                  value={payout.chain}
                  onChange={(e) => updateMerchantPayout(idx, 'chain', e.target.value)}
                  className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white mb-2 text-sm"
                >
                  {chains.map(c => (
                    <option key={c.value} value={c.value} className="bg-gray-900">
                      {c.label}
                    </option>
                  ))}
                </select>

                {/* Token */}
                <select
                  value={payout.token}
                  onChange={(e) => updateMerchantPayout(idx, 'token', e.target.value)}
                  className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white mb-2 text-sm"
                >
                  {tokens[payout.chain]?.map(t => (
                    <option key={t} value={t} className="bg-gray-900">
                      {t}
                    </option>
                  ))}
                </select>

                {/* USD Value */}
                <input
                  type="number"
                  value={payout.usdValue}
                  onChange={(e) => updateMerchantPayout(idx, 'usdValue', e.target.value)}
                  placeholder="USD value (e.g., 10)"
                  className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white placeholder-white/50 text-sm"
                />
              </div>
            ))}

            <button
              onClick={addMerchantPayout}
              className="w-full bg-purple-500/20 border border-purple-500/50 text-purple-200 py-2 rounded hover:bg-purple-500/30 transition-all text-sm mb-4"
            >
              + Add Payout Destination
            </button>

            <div className="bg-orange-500/10 border border-orange-500/50 rounded p-3">
              <p className="text-orange-200 font-bold">
                Total: ${merchantTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Balance Warning */}
        {Math.abs(userTotal - merchantTotal) > 0.01 && userTotal > 0 && merchantTotal > 0 && (
          <div className="mt-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-200">
              ⚠️ Totals don't match! User: ${userTotal.toFixed(2)}, Merchant: ${merchantTotal.toFixed(2)}
            </p>
          </div>
        )}

        {/* Execute Button */}
        <div className="mt-6">
          <button
            onClick={executePayment}
            disabled={loading || !merchantAddress || Math.abs(userTotal - merchantTotal) > 0.01}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-6 rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
          >
            {loading ? '⏳ Processing Payment...' : '💸 Execute Payment Flow'}
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className={`mt-6 rounded-lg p-4 ${
            status.includes('❌') ? 'bg-red-500/20 border border-red-500/50' :
            status.includes('✅') ? 'bg-green-500/20 border border-green-500/50' :
            'bg-blue-500/20 border border-blue-500/50'
          }`}>
            <p className="text-white">{status}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-white font-bold text-xl mb-4">📊 Payment Results</h3>
            
            <div className="space-y-4">
              {results.steps?.map((step, idx) => (
                <div key={idx} className="bg-white/5 rounded p-3">
                  <p className="text-white text-sm font-semibold">{step.description}</p>
                  <p className="text-white/70 text-xs mt-1">{step.status}</p>
                  
                  {/* Show appropriate link based on step type */}
                  {step.phase === 'bridging' && step.layerZeroUrl && (
                    <a
                      href={step.layerZeroUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 text-xs hover:underline block mt-1"
                    >
                      🔗 Track on LayerZero Scan →
                    </a>
                  )}
                  
                  {step.explorerUrl && step.phase !== 'bridging' && (
                    <a
                      href={step.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-xs hover:underline block mt-1"
                    >
                      View on Block Explorer →
                    </a>
                  )}
                  
                  {step.substeps && (
                    <div className="mt-2 ml-4 space-y-1">
                      {step.substeps.map((substep, sidx) => (
                        <p key={sidx} className="text-white/50 text-xs">• {substep}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-white font-bold mb-2">💡 How it works:</h3>
          <div className="text-white/70 text-sm space-y-2">
            <p><strong>Step 1:</strong> User payments collected on multiple chains</p>
            <p className="ml-4">→ Swap tokens to USDC (if needed) via SmartVault</p>
            <p className="ml-4">→ Mint WAY tokens (1:1 with USDC)</p>
            
            <p className="mt-3"><strong>Step 2:</strong> Bridge WAY to settlement chains</p>
            <p className="ml-4">→ LayerZero OFT bridges WAY between chains</p>
            
            <p className="mt-3"><strong>Step 3:</strong> Merchant receives on their chains</p>
            <p className="ml-4">→ Burn WAY to get USDC</p>
            <p className="ml-4">→ Swap USDC to merchant's tokens (if needed)</p>
            <p className="ml-4">→ Transfer to merchant wallet ✅</p>
          </div>
        </div>

        {/* Example */}
        <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-200 text-sm">
            <strong>Example:</strong> User pays 0.02 USDC on Arbitrum + 0.1 USDC on Base → 
            Merchant receives 0.12 USDC on Base (or any mix!)
          </p>
        </div>
      </div>
    </div>
  );
}

