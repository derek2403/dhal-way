import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function SessionKeyDemo() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [sessionId, setSessionId] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [maxSpend, setMaxSpend] = useState('100');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Create Session Key
  const createSession = async () => {
    if (!address) {
      setStatus('Please connect wallet');
      return;
    }

    setLoading(true);
    setStatus('Creating session key...');

    try {
      // User signs ONCE to grant permission
      const message = `I authorize Dhalway to execute payments on my behalf:
Max spend: $${maxSpend}
Valid for: 60 minutes
Timestamp: ${Date.now()}`;
      
      setStatus('Please sign to grant permission to backend...');
      const signature = await signMessageAsync({ message });

      // Create session on backend
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          signature,
          message, // Send the exact message that was signed
          maxSpendUSD: parseFloat(maxSpend),
          durationMinutes: 60,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSessionId(data.session.sessionId);
      setSessionInfo(data.session);
      setStatus('✅ Session created! You can now execute payments without signing each transaction!');

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

  // Step 2: Execute Payment with Session
  const executePaymentWithSession = async () => {
    if (!sessionId) {
      setStatus('Please create a session first');
      return;
    }

    setLoading(true);
    setStatus('🔄 Executing payment with session key (no signatures needed!)...');

    try {
      const response = await fetch('/api/payment/execute-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userPayments: [
            { chain: 'arbitrum-sepolia', token: 'USDC', usdValue: '0.01' },
            { chain: 'base-sepolia', token: 'USDC', usdValue: '0.01' },
          ],
          merchantAddress: '0x1C4e764e1748CFe74EC579fa7C83AB081df6D6C6',
          merchantPayouts: [
            { chain: 'base-sepolia', token: 'USDC', usdValue: '0.02' },
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setStatus('✅ Payment completed! All transactions executed automatically with session key!');
      console.log('Payment result:', data);

    } catch (error) {
      setStatus('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 p-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Session Key Demo</h1>
            <p className="text-white/70">EIP-4337: Sign Once, Pay Automatically</p>
          </div>
          <ConnectButton />
        </div>

        {/* Step 1: Create Session */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Step 1: Create Session Key</h2>
          
          <div className="mb-4">
            <label className="block text-white text-sm mb-2">Max Spend (USD)</label>
            <input
              type="number"
              value={maxSpend}
              onChange={(e) => setMaxSpend(e.target.value)}
              placeholder="100"
              className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white"
            />
            <p className="text-white/50 text-xs mt-1">
              Session will allow backend to spend up to this amount on your behalf
            </p>
          </div>

          <button
            onClick={createSession}
            disabled={loading || !address || sessionId}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all"
          >
            {loading ? '⏳ Creating...' : sessionId ? '✅ Session Active' : '🔑 Create Session (Sign Once)'}
          </button>

          {sessionInfo && (
            <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded p-4">
              <p className="text-green-200 text-sm">
                <strong>Session Active!</strong><br/>
                ID: {sessionInfo.sessionId.slice(0, 10)}...<br/>
                Budget: ${maxSpend}<br/>
                Valid for: 60 minutes
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Execute Payment */}
        {sessionId && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Step 2: Execute Payment (No Signatures!)</h2>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4 mb-4">
              <p className="text-blue-200 text-sm">
                <strong>Demo Payment:</strong><br/>
                • Pay 0.01 USDC on Arbitrum<br/>
                • Pay 0.01 USDC on Base<br/>
                • Merchant receives 0.02 USDC on Base<br/><br/>
                <strong>No signatures required!</strong>
              </p>
            </div>

            <button
              onClick={executePaymentWithSession}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all"
            >
              {loading ? '⏳ Executing...' : '⚡ Execute Payment (Automatic!)'}
            </button>
          </div>
        )}

        {/* Status */}
        {status && (
          <div className={`mt-6 rounded-lg p-4 ${
            status.includes('❌') ? 'bg-red-500/20 border border-red-500/50' :
            status.includes('✅') ? 'bg-green-500/20 border border-green-500/50' :
            'bg-blue-500/20 border border-blue-500/50'
          }`}>
            <p className="text-white text-sm">{status}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-white font-bold mb-2">🔑 How Session Keys Work:</h3>
          <div className="text-white/70 text-sm space-y-2">
            <p><strong>Step 1: User Signs Once</strong></p>
            <p className="ml-4">→ Creates temporary session key</p>
            <p className="ml-4">→ Sets spending limit ($100)</p>
            <p className="ml-4">→ Sets time limit (60 min)</p>
            
            <p className="mt-3"><strong>Step 2: Backend Executes Automatically</strong></p>
            <p className="ml-4">→ Uses session key for all transactions</p>
            <p className="ml-4">→ No more user signatures needed!</p>
            <p className="ml-4">→ Respects limits (can't overspend/overtime)</p>
            
            <p className="mt-3"><strong>Security:</strong></p>
            <p className="ml-4">✅ Limited budget</p>
            <p className="ml-4">✅ Limited time</p>
            <p className="ml-4">✅ User can revoke anytime</p>
            <p className="ml-4">✅ EIP-4337 compliant</p>
          </div>
        </div>

        {/* Comparison */}
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-200 text-sm">
            <strong>Traditional:</strong> 5+ signatures for multi-chain payment 😓<br/>
            <strong>Session Key:</strong> 1 signature, then automatic! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}

