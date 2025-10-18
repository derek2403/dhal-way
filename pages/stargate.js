import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseUnits, formatUnits } from 'viem';

export default function StargateTest() {
  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // State
  const [chains, setChains] = useState([]);
  const [allTokens, setAllTokens] = useState([]);
  const [srcChain, setSrcChain] = useState(null);
  const [dstChain, setDstChain] = useState(null);
  const [srcToken, setSrcToken] = useState(null);
  const [dstToken, setDstToken] = useState(null);
  const [amount, setAmount] = useState('');
  const [quotes, setQuotes] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');

  // Fetch chains and tokens on mount (only once!)
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await fetchChains();
        await fetchAllTokens();
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array = run only once

  // Fetch chains from Stargate
  const fetchChains = async () => {
    try {
      console.log('Fetching chains...');
      const response = await fetch('/api/stargate/chains');
      const data = await response.json();
      console.log('Chains loaded:', data.chains?.length);
      setChains(data.chains || []);
    } catch (error) {
      console.error('Error fetching chains:', error);
      setStatus('Error fetching chains: ' + error.message);
    }
  };

  // Fetch all tokens (for all chains)
  const fetchAllTokens = async () => {
    try {
      console.log('Fetching tokens...');
      const response = await fetch('/api/stargate/tokens');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || data.error);
      }
      
      console.log('Tokens loaded:', data.tokens?.length);
      setAllTokens(data.tokens || []);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setStatus('Error fetching tokens: ' + error.message);
    }
  };

  // Get tokens for a specific chain
  const getTokensForChain = (chainKey) => {
    return allTokens.filter(t => t.chainKey === chainKey);
  };

  // Get quote
  const getQuote = async () => {
    if (!srcChain || !dstChain || !srcToken || !dstToken || !amount || !address) {
      setStatus('Please fill all fields and connect wallet');
      return;
    }

    setLoading(true);
    setStatus('Fetching quotes...');

    try {
      // Convert amount to smallest unit
      const srcAmount = parseUnits(amount, srcToken.decimals).toString();
      const dstAmountMin = (BigInt(srcAmount) * BigInt(98) / BigInt(100)).toString(); // 2% slippage

      const params = new URLSearchParams({
        srcToken: srcToken.address,
        dstToken: dstToken.address,
        srcAddress: address,
        dstAddress: address,
        srcChainKey: srcChain.chainKey,
        dstChainKey: dstChain.chainKey,
        srcAmount,
        dstAmountMin
      });

      const response = await fetch(`/api/stargate/quotes?${params.toString()}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setQuotes(data);
      
      // Check if any routes found
      if (!data.quotes || data.quotes.length === 0) {
        setStatus('❌ No routes available for this token pair. Try different tokens or chains.');
        setSelectedRoute(null);
        return;
      }

      setStatus(`✅ Found ${data.quotes.length} route${data.quotes.length > 1 ? 's' : ''}`);

      // Auto-select taxi route (fastest)
      const taxiRoute = data.quotes.find(q => q.route.includes('taxi'));
      if (taxiRoute) {
        setSelectedRoute(taxiRoute);
        setStatus(`✅ Found ${data.quotes.length} routes - Selected fastest (taxi)`);
      }
    } catch (error) {
      console.error('Error getting quote:', error);
      setStatus('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Execute bridge
  const executeBridge = async () => {
    if (!selectedRoute || !walletClient) {
      setStatus('No route selected or wallet not connected');
      return;
    }

    setLoading(true);
    setStatus('Executing bridge...');

    try {
      const steps = selectedRoute.steps;

      // Execute each step
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setStatus(`Executing step ${i + 1}/${steps.length}: ${step.type}...`);

        const tx = {
          to: step.transaction.to,
          from: step.transaction.from,
          data: step.transaction.data,
          value: step.transaction.value ? BigInt(step.transaction.value) : BigInt(0),
        };

        // Send transaction
        const hash = await walletClient.sendTransaction(tx);
        setTxHash(hash);
        setStatus(`Transaction sent: ${hash.slice(0, 10)}... Waiting for confirmation...`);

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (receipt.status === 'success') {
          setStatus(`Step ${i + 1} complete! ${step.type === 'bridge' ? 'Bridge initiated!' : 'Approved!'}`);
        } else {
          throw new Error(`Transaction failed: ${hash}`);
        }

        // Small delay between steps
        if (i < steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      setStatus(`✅ Bridge complete! Tokens will arrive on ${dstChain.name} in ~${Math.round(selectedRoute.duration.estimated / 60)} minutes`);
    } catch (error) {
      console.error('Error executing bridge:', error);
      setStatus('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Stargate Bridge Test</h1>
          <ConnectButton />
        </div>

        {/* Debug Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
          <p className="text-white/70 text-sm">
            Loaded: {chains.length} chains, {allTokens.length} tokens
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          
          {/* Source Chain Selection */}
          <div className="mb-6">
            <label className="block text-white text-sm font-semibold mb-2">
              Source Chain
            </label>
            <select
              value={srcChain?.chainKey || ''}
              onChange={(e) => {
                const chain = chains.find(c => c.chainKey === e.target.value);
                setSrcChain(chain);
                setSrcToken(null);
              }}
              className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select source chain</option>
              {chains.map(chain => (
                <option key={chain.chainKey} value={chain.chainKey} className="bg-gray-900">
                  {chain.name} ({chain.chainKey})
                </option>
              ))}
            </select>
          </div>

          {/* Destination Chain Selection */}
          <div className="mb-6">
            <label className="block text-white text-sm font-semibold mb-2">
              Destination Chain
            </label>
            <select
              value={dstChain?.chainKey || ''}
              onChange={(e) => {
                const chain = chains.find(c => c.chainKey === e.target.value);
                setDstChain(chain);
                setDstToken(null);
              }}
              className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select destination chain</option>
              {chains.map(chain => (
                <option 
                  key={chain.chainKey} 
                  value={chain.chainKey} 
                  className="bg-gray-900"
                  disabled={chain.chainKey === srcChain?.chainKey}
                >
                  {chain.name} ({chain.chainKey})
                </option>
              ))}
            </select>
          </div>

          {/* Source Token Selection */}
          {srcChain && (
            <div className="mb-6">
              <label className="block text-white text-sm font-semibold mb-2">
                Source Token
              </label>
              <select
                value={srcToken?.address || ''}
                onChange={(e) => {
                  const token = allTokens.find(t => t.address === e.target.value && t.chainKey === srcChain.chainKey);
                  setSrcToken(token);
                  
                  // Auto-select matching token on destination if available
                  if (token && dstChain) {
                    const matchingDstToken = allTokens.find(
                      t => t.symbol === token.symbol && t.chainKey === dstChain.chainKey
                    );
                    if (matchingDstToken) {
                      setDstToken(matchingDstToken);
                    }
                  }
                }}
                className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select token</option>
                {getTokensForChain(srcChain.chainKey).map(token => (
                  <option key={`${token.chainKey}-${token.address}`} value={token.address} className="bg-gray-900">
                    {token.symbol} - {token.name} (${token.price?.usd?.toFixed(2) || 'N/A'})
                  </option>
                ))}
              </select>
              {getTokensForChain(srcChain.chainKey).length === 0 && (
                <p className="text-yellow-400 text-sm mt-1">No bridgeable tokens found for {srcChain.name}</p>
              )}
            </div>
          )}

          {/* Destination Token Selection */}
          {dstChain && (
            <div className="mb-6">
              <label className="block text-white text-sm font-semibold mb-2">
                Destination Token {srcToken && `(Recommended: ${srcToken.symbol})`}
              </label>
              <select
                value={dstToken?.address || ''}
                onChange={(e) => {
                  const token = allTokens.find(t => t.address === e.target.value && t.chainKey === dstChain.chainKey);
                  setDstToken(token);
                }}
                className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select token</option>
                {getTokensForChain(dstChain.chainKey).map(token => {
                  const isRecommended = srcToken && token.symbol === srcToken.symbol;
                  return (
                    <option 
                      key={`${token.chainKey}-${token.address}`} 
                      value={token.address} 
                      className="bg-gray-900"
                    >
                      {isRecommended ? '⭐ ' : ''}{token.symbol} - {token.name} (${token.price?.usd?.toFixed(2) || 'N/A'})
                    </option>
                  );
                })}
              </select>
              {getTokensForChain(dstChain.chainKey).length === 0 && (
                <p className="text-yellow-400 text-sm mt-1">No bridgeable tokens found for {dstChain.name}</p>
              )}
              {srcToken && dstToken && srcToken.symbol !== dstToken.symbol && (
                <p className="text-yellow-400 text-sm mt-1">
                  ⚠️ Warning: {srcToken.symbol} → {dstToken.symbol} may not be supported by Stargate
                </p>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-white text-sm font-semibold mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="any"
              className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {srcToken && amount && (
              <p className="text-white/70 text-sm mt-1">
                ≈ ${(parseFloat(amount) * (srcToken.price?.usd || 0)).toFixed(2)}
              </p>
            )}
          </div>

          {/* Get Quote Button */}
          <button
            onClick={getQuote}
            disabled={loading || !address || !srcChain || !dstChain || !srcToken || !dstToken || !amount}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-4 rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-6"
          >
            {loading ? 'Loading...' : 'Get Quote'}
          </button>

          {/* Quote Display */}
          {selectedRoute && (
            <div className="bg-white/5 rounded-lg p-6 mb-6 border border-white/10">
              <h3 className="text-white font-bold mb-4">Selected Route: {selectedRoute.route}</h3>
              
              <div className="space-y-2 text-white/80 text-sm mb-4">
                <p>You send: <span className="text-white font-semibold">
                  {formatUnits(BigInt(selectedRoute.srcAmount), srcToken.decimals)} {srcToken.symbol}
                </span></p>
                <p>You receive: <span className="text-white font-semibold">
                  {formatUnits(BigInt(selectedRoute.dstAmount), dstToken.decimals)} {dstToken.symbol}
                </span></p>
                <p>Estimated time: <span className="text-white font-semibold">
                  ~{Math.round(selectedRoute.duration.estimated / 60)} minutes
                </span></p>
                <p>Fees: <span className="text-white font-semibold">
                  {selectedRoute.fees.map(fee => 
                    `${formatUnits(BigInt(fee.amount), 18)} ${fee.token === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? 'ETH' : 'token'}`
                  ).join(', ')}
                </span></p>
              </div>

              <button
                onClick={executeBridge}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Processing...' : 'Execute Bridge'}
              </button>
            </div>
          )}

          {/* All Routes Display */}
          {quotes && quotes.quotes && quotes.quotes.length > 1 && (
            <div className="bg-white/5 rounded-lg p-6 mb-6 border border-white/10">
              <h3 className="text-white font-bold mb-4">All Available Routes:</h3>
              <div className="space-y-2">
                {quotes.quotes.map((quote, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedRoute(quote)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedRoute?.route === quote.route
                        ? 'bg-purple-500/20 border-purple-500'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-white font-semibold">{quote.route}</p>
                    <p className="text-white/70 text-sm">
                      Output: {formatUnits(BigInt(quote.dstAmount), dstToken.decimals)} {dstToken.symbol}
                    </p>
                    <p className="text-white/70 text-sm">
                      Time: ~{Math.round(quote.duration.estimated / 60)} min
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Display */}
          {status && (
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
              <p className="text-white text-sm">{status}</p>
              {txHash && (
                <a
                  href={`${chain?.blockExplorers?.default?.url}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 text-sm underline mt-2 inline-block"
                >
                  View transaction →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-white/10">
          <h3 className="text-white font-bold mb-2">ℹ️ How it works:</h3>
          <ol className="text-white/70 text-sm space-y-1 list-decimal list-inside">
            <li>Connect your wallet</li>
            <li>Select source and destination chains</li>
            <li>Select tokens to bridge</li>
            <li>Enter amount</li>
            <li>Get quote to see routes and fees</li>
            <li>Execute bridge (will ask for approval + bridge transaction)</li>
            <li>Wait for tokens to arrive on destination chain</li>
          </ol>
        </div>

        {/* Important Note */}
        <div className="mt-4 bg-yellow-500/10 backdrop-blur-lg rounded-lg p-6 border border-yellow-500/30">
          <h3 className="text-yellow-300 font-bold mb-2">⚠️ Important:</h3>
          <p className="text-yellow-200/70 text-sm mb-2">
            <strong>Stargate only supports same-asset bridging:</strong>
          </p>
          <ul className="text-yellow-200/70 text-sm space-y-1 list-disc list-inside">
            <li>✅ USDC (Ethereum) → USDC (Arbitrum)</li>
            <li>✅ ETH (Ethereum) → ETH (Base)</li>
            <li>✅ USDT (Ethereum) → USDT (Polygon)</li>
            <li>❌ USDC → ETH (not supported)</li>
            <li>❌ ETH → USDC (not supported)</li>
          </ul>
          <p className="text-yellow-200/70 text-sm mt-2">
            Choose the <strong>same token</strong> on both source and destination chains.
          </p>
        </div>
      </div>
    </div>
  );
}

