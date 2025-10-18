import { useState } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function EnhancedPaymentDemo() {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  // Payment state
  const [userPayments, setUserPayments] = useState([
    { chain: 'arbitrum-sepolia', token: 'USDC', usdValue: '' }
  ]);
  const [merchantAddress, setMerchantAddress] = useState('');
  const [merchantPayouts, setMerchantPayouts] = useState([
    { chain: 'base-sepolia', token: 'USDC', usdValue: '' }
  ]);
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Available chains and tokens
  const chains = [
    { value: 'arbitrum-sepolia', label: 'Arbitrum Sepolia' },
    { value: 'base-sepolia', label: 'Base Sepolia' },
    { value: 'flow-testnet', label: 'Flow Testnet' },
    { value: 'optimism-sepolia', label: 'Optimism Sepolia' },
    { value: 'sepolia', label: 'Ethereum Sepolia' },
  ];

  const tokens = {
    'arbitrum-sepolia': ['USDC', 'ETH'],
    'base-sepolia': ['USDC', 'ETH'],
    'flow-testnet': ['USDC', 'FLOW'],
    'optimism-sepolia': ['USDC', 'ETH'],
    'sepolia': ['USDC', 'ETH'],
  };

  // Payment management functions
  const addUserPayment = () => setUserPayments([...userPayments, { chain: 'arbitrum-sepolia', token: 'USDC', usdValue: '' }]);
  const removeUserPayment = (idx) => setUserPayments(userPayments.filter((_, i) => i !== idx));
  const updateUserPayment = (idx, field, value) => {
    const updated = [...userPayments];
    updated[idx][field] = value;
    setUserPayments(updated);
  };

  const addMerchantPayout = () => setMerchantPayouts([...merchantPayouts, { chain: 'base-sepolia', token: 'USDC', usdValue: '' }]);
  const removeMerchantPayout = (idx) => setMerchantPayouts(merchantPayouts.filter((_, i) => i !== idx));
  const updateMerchantPayout = (idx, field, value) => {
    const updated = [...merchantPayouts];
    updated[idx][field] = value;
    setMerchantPayouts(updated);
  };

  const userTotal = userPayments.reduce((sum, p) => sum + (parseFloat(p.usdValue) || 0), 0);
  const merchantTotal = merchantPayouts.reduce((sum, p) => sum + (parseFloat(p.usdValue) || 0), 0);

  // Combined: Sign EIP-712 + Execute Payment in ONE action
  const signAndExecute = async () => {
    if (!address) {
      setStatus('Please connect wallet');
      return;
    }

    if (!merchantAddress) {
      setStatus('Please enter merchant address');
      return;
    }

    if (Math.abs(userTotal - merchantTotal) > 0.01) {
      setStatus('❌ Totals must match');
      return;
    }

    setLoading(true);
    setStatus('Creating session with EIP-712 signature...');

    try {
      // EIP-712 Typed Data with detailed payment info
      const domain = {
        name: 'Dhalway Payment Protocol',
        version: '1',
        chainId: 84532, // Base Sepolia
      };

      // Contract addresses by chain
      const contracts = {
        'arbitrum-sepolia': {
          tokens: { 'USDC': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', 'ETH': '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73' },
          vault: '0x05fF0c6Da0a07960977D8629A748F71b6117e6ea',
        },
        'base-sepolia': {
          tokens: { 'USDC': '0x036CbD53842c5426634e7929541eC2318f3dCF7e', 'ETH': '0x4200000000000000000000000000000000000006' },
          vault: '0xaeD23b0F0a11d8169a1711b37B2E07203b18F36F',
        },
        'flow-testnet': {
          tokens: { 'USDC': '0x356ED74eE51e4aa5f1Ce9B51329fecEF728621bc', 'FLOW': '0xd3bF53DAC106A0290B0483EcBC89d40FcC961f3e' },
          vault: '0xFc199a0ad172B8cAFF2a1e0cdAB022f9B62928e9',
        },
        'optimism-sepolia': {
          tokens: { 'USDC': '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', 'ETH': '0x4200000000000000000000000000000000000006' },
          vault: '0x5aD82749A1D56BC1F11B023f0352735ea006D238',
        },
        'sepolia': {
          tokens: { 'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', 'ETH': '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' },
          vault: '0x817F2c13bDBa44D8d7E7ae0d40f28b6DC43ED30d',
        },
      };

      // Build payment items with full details
      const paymentItems = userPayments.map((p) => ({
        chainKey: p.chain,
        tokenAddress: contracts[p.chain]?.tokens[p.token] || '0x0',
        tokenName: p.token,
        amount: p.usdValue,
        treasury: contracts[p.chain]?.vault || '0x0',
      }));

      const types = {
        PaymentItem: [
          { name: 'chainKey', type: 'string' },
          { name: 'tokenAddress', type: 'address' },
          { name: 'tokenName', type: 'string' },
          { name: 'amount', type: 'string' },
          { name: 'treasury', type: 'address' },
        ],
        PaymentAuthorization: [
          { name: 'user', type: 'address' },
          { name: 'merchant', type: 'address' },
          { name: 'totalUSD', type: 'string' },
          { name: 'payments', type: 'PaymentItem[]' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
        ],
      };

      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = Math.floor(Math.random() * 1000000);

      const value = {
        user: address,
        merchant: merchantAddress,
        totalUSD: userTotal.toFixed(2),
        payments: paymentItems,
        timestamp,
        nonce,
      };

      setStatus('Please sign to authorize payment session...');
      
      // User signs EIP-712 structured data
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'PaymentAuthorization',
        message: value,
      });

      setStatus('✅ Signed! Creating session...');

      // Create session with signature
      const response = await fetch('/api/session/create-eip712', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          merchantAddress,
          signature,
          typedData: { domain, types, value },
          userPayments,
          merchantPayouts,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSessionId(data.sessionId);
      setStatus('✅ Signature verified! Now executing payment...');

      // Immediately execute payment after signing
      const executeResponse = await fetch('/api/payment/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data.sessionId,
          userPayments,
          merchantAddress,
          merchantPayouts,
        }),
      });

      const executeData = await executeResponse.json();

      if (executeData.error) {
        throw new Error(executeData.error);
      }

      setResults(executeData);
      setStatus('✅ Payment completed! Check results below.');

    } catch (error) {
      if (error.message.includes('User rejected')) {
        setStatus('❌ Signature rejected');
      } else {
        setStatus('❌ Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">EIP-712 Session Payment</h1>
            <p className="text-white/70">Sign Once with EIP-712, Execute Automatically</p>
          </div>
          <ConnectButton />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
              
              {/* USER SIDE */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">👤 User Pays</h2>
                
                {userPayments.map((payment, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-white/70 text-sm">Payment {idx + 1}</p>
                      {userPayments.length > 1 && (
                        <button onClick={() => removeUserPayment(idx)} className="text-red-400 text-sm">✕</button>
                      )}
                    </div>

                    <select
                      value={payment.chain}
                      onChange={(e) => updateUserPayment(idx, 'chain', e.target.value)}
                      className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white mb-2 text-sm"
                    >
                      {chains.map(c => (
                        <option key={c.value} value={c.value} className="bg-gray-900">{c.label}</option>
                      ))}
                    </select>

                    <select
                      value={payment.token}
                      onChange={(e) => updateUserPayment(idx, 'token', e.target.value)}
                      className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white mb-2 text-sm"
                    >
                      {tokens[payment.chain]?.map(t => (
                        <option key={t} value={t} className="bg-gray-900">{t}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={payment.usdValue}
                      onChange={(e) => updateUserPayment(idx, 'usdValue', e.target.value)}
                      placeholder="USD value"
                      className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white placeholder-white/50 text-sm"
                    />
                  </div>
                ))}

                <button onClick={addUserPayment} className="w-full bg-blue-500/20 border border-blue-500/50 text-blue-200 py-2 rounded text-sm mb-4">
                  + Add Payment
                </button>

                <div className="bg-green-500/10 border border-green-500/50 rounded p-3">
                  <p className="text-green-200 font-bold">Total: ${userTotal.toFixed(2)}</p>
                </div>
              </div>

              {/* MERCHANT SIDE */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">🏪 Merchant Receives</h2>
                
                <div className="mb-4">
                  <label className="block text-white text-sm mb-2">Merchant Address</label>
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
                        <button onClick={() => removeMerchantPayout(idx)} className="text-red-400 text-sm">✕</button>
                      )}
                    </div>

                    <select
                      value={payout.chain}
                      onChange={(e) => updateMerchantPayout(idx, 'chain', e.target.value)}
                      className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white mb-2 text-sm"
                    >
                      {chains.map(c => (
                        <option key={c.value} value={c.value} className="bg-gray-900">{c.label}</option>
                      ))}
                    </select>

                    <select
                      value={payout.token}
                      onChange={(e) => updateMerchantPayout(idx, 'token', e.target.value)}
                      className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white mb-2 text-sm"
                    >
                      {tokens[payout.chain]?.map(t => (
                        <option key={t} value={t} className="bg-gray-900">{t}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={payout.usdValue}
                      onChange={(e) => updateMerchantPayout(idx, 'usdValue', e.target.value)}
                      placeholder="USD value"
                      className="w-full bg-white/10 border border-white/30 rounded px-3 py-2 text-white placeholder-white/50 text-sm"
                    />
                  </div>
                ))}

                <button onClick={addMerchantPayout} className="w-full bg-purple-500/20 border border-purple-500/50 text-purple-200 py-2 rounded text-sm mb-4">
                  + Add Payout
                </button>

                <div className="bg-orange-500/10 border border-orange-500/50 rounded p-3">
                  <p className="text-orange-200 font-bold">Total: ${merchantTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Balance Warning */}
            {Math.abs(userTotal - merchantTotal) > 0.01 && userTotal > 0 && merchantTotal > 0 && (
              <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-200">⚠️ Totals must match!</p>
              </div>
            )}

        {/* Execute Button */}
        <button
          onClick={signAndExecute}
          disabled={loading || !address || !merchantAddress || Math.abs(userTotal - merchantTotal) > 0.01}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-6 rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 transition-all text-lg mb-6"
        >
          {loading ? '⏳ Processing...' : '🔐 Sign & Execute Payment'}
        </button>

        {/* Status */}
        {status && (
          <div className={`rounded-lg p-4 mb-6 ${
            status.includes('❌') ? 'bg-red-500/20 border border-red-500/50' :
            status.includes('✅') ? 'bg-green-500/20 border border-green-500/50' :
            'bg-blue-500/20 border border-blue-500/50'
          }`}>
            <p className="text-white text-sm">{status}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-bold text-xl mb-4">📊 Payment Results</h3>
                
                <div className="space-y-4">
                  {results.steps?.map((step, idx) => (
                    <div key={idx} className="bg-white/5 rounded p-3">
                      <p className="text-white text-sm font-semibold">{step.description}</p>
                      <p className="text-white/70 text-xs mt-1">{step.status}</p>
                      
                      {step.phase === 'bridging' && step.layerZeroUrl && (
                        <a href={step.layerZeroUrl} target="_blank" rel="noopener noreferrer" className="text-green-400 text-xs hover:underline block mt-1">
                          🔗 Track on LayerZero Scan →
                        </a>
                      )}
                      
                      {step.explorerUrl && step.phase !== 'bridging' && (
                        <a href={step.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline block mt-1">
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

            <button
              onClick={() => {
                setSessionId(null);
                setResults(null);
                setStatus('');
              }}
              className="mt-4 w-full bg-white/10 border border-white/30 text-white py-3 rounded-lg hover:bg-white/20 transition-all"
            >
              🔄 Start New Payment
            </button>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-white font-bold mb-2">🔐 EIP-712 + Session Keys</h3>
          <div className="text-white/70 text-sm space-y-2">
            <p><strong>What you sign (EIP-712):</strong></p>
            <p className="ml-4">• User & merchant addresses</p>
            <p className="ml-4">• Payment details (chains, tokens, amounts)</p>
            <p className="ml-4">• Total amount authorization</p>
            <p className="ml-4">• Timestamp & nonce (prevent replay)</p>
            
            <p className="mt-3"><strong>After signing:</strong></p>
            <p className="ml-4">• Session created with your authorization</p>
            <p className="ml-4">• Backend executes ALL transactions</p>
            <p className="ml-4">• NO more signatures needed! ✅</p>
            
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
              <p className="text-blue-200 text-xs">
                <strong>Security:</strong> EIP-712 provides structured, readable data. 
                You see EXACTLY what you're authorizing!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
