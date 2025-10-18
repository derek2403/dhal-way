import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseUnits, formatUnits } from 'viem';

// WAY Token addresses (from deployment)
const WAY_ADDRESSES = {
  421614: '0x3dD9Fd77B089F96E84ca3F326Bf787C340A481F9', // Arbitrum Sepolia
  84532: '0x23652888F9978F00259CAfc20B20a8b008493299',  // Base Sepolia
  40232: '0x2948CEDf69dC2d21bE70d84D412ad0d8805EFC89',  // Optimism Sepolia
  11155111: '0x7e9abCa7D8bb64313EF9a98F3dC4B40C2BF83823', // Sepolia
  545: '0x4BdFc8a1D09D55E4e2D50F52052e6c4B6932cCfB',     // Flow Testnet
};

// USDC addresses
const USDC_ADDRESSES = {
  421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  40232: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
  545: '0x356ED74eE51e4aa5f1Ce9B51329fecEF728621bc',
};

// WAY Token ABI
const WAY_ABI = [
  {
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'from', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalReserves',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isFullyBacked',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// ERC20 ABI
const ERC20_ABI = [
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export default function WAYTokenTest() {
  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [amount, setAmount] = useState('');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [wayBalance, setWayBalance] = useState('0');
  const [reserves, setReserves] = useState('0');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const wayAddress = WAY_ADDRESSES[chain?.id];
  const usdcAddress = USDC_ADDRESSES[chain?.id];

  // Load balances
  useEffect(() => {
    if (address && wayAddress && usdcAddress && publicClient) {
      loadBalances();
    }
  }, [address, chain, publicClient]);

  const loadBalances = async () => {
    try {
      const [usdc, way, res] = await Promise.all([
        publicClient.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address],
        }),
        publicClient.readContract({
          address: wayAddress,
          abi: WAY_ABI,
          functionName: 'balanceOf',
          args: [address],
        }),
        publicClient.readContract({
          address: wayAddress,
          abi: WAY_ABI,
          functionName: 'totalReserves',
        }),
      ]);

      setUsdcBalance(formatUnits(usdc, 6));
      setWayBalance(formatUnits(way, 18));
      setReserves(formatUnits(res, 6));
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const mintWAY = async () => {
    if (!walletClient || !amount) return;

    setLoading(true);
    setStatus('Minting WAY tokens...');

    try {
      const amountWei = parseUnits(amount, 6);

      // Step 1: Approve USDC
      setStatus('Step 1/2: Approving USDC...');
      const approveTx = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [wayAddress, amountWei],
      });

      await publicClient.waitForTransactionReceipt({ hash: approveTx });
      setStatus('✅ Approved!');
      await new Promise(r => setTimeout(r, 1000));

      // Step 2: Mint WAY
      setStatus('Step 2/2: Minting WAY...');
      const mintTx = await walletClient.writeContract({
        address: wayAddress,
        abi: WAY_ABI,
        functionName: 'mint',
        args: [address, amountWei],
      });

      await publicClient.waitForTransactionReceipt({ hash: mintTx });
      setStatus(`✅ Minted ${amount} WAY! (Locked ${amount} USDC)`);
      
      await loadBalances();
    } catch (error) {
      setStatus('❌ Error: ' + (error.shortMessage || error.message));
    } finally {
      setLoading(false);
    }
  };

  const burnWAY = async () => {
    if (!walletClient || !amount) return;

    setLoading(true);
    setStatus('Burning WAY tokens...');

    try {
      const amountWei = parseUnits(amount, 6);

      const burnTx = await walletClient.writeContract({
        address: wayAddress,
        abi: WAY_ABI,
        functionName: 'burn',
        args: [address, amountWei],
      });

      await publicClient.waitForTransactionReceipt({ hash: burnTx });
      setStatus(`✅ Burned ${amount} WAY! (Received ${amount} USDC)`);
      
      await loadBalances();
    } catch (error) {
      setStatus('❌ Error: ' + (error.shortMessage || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">WAY Token Test</h1>
          <ConnectButton />
        </div>

        {!wayAddress && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200">❌ WAY Token not deployed on {chain?.name}</p>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          
          {/* Balances */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/70 text-sm">USDC Balance</p>
              <p className="text-white text-2xl font-bold">{parseFloat(usdcBalance).toFixed(2)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/70 text-sm">WAY Balance</p>
              <p className="text-white text-2xl font-bold">{parseFloat(wayBalance).toFixed(2)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/70 text-sm">Pool Reserves</p>
              <p className="text-white text-2xl font-bold">{parseFloat(reserves).toFixed(2)}</p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-white text-sm font-semibold mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10"
              className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={mintWAY}
              disabled={loading || !address || !amount}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all"
            >
              Mint WAY (Lock USDC)
            </button>
            <button
              onClick={burnWAY}
              disabled={loading || !address || !amount}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all"
            >
              Burn WAY (Get USDC)
            </button>
          </div>

          {/* Status */}
          {status && (
            <div className={`rounded-lg p-4 ${
              status.includes('❌') ? 'bg-red-500/20 border border-red-500/50' :
              status.includes('✅') ? 'bg-green-500/20 border border-green-500/50' :
              'bg-blue-500/20 border border-blue-500/50'
            }`}>
              <p className="text-white text-sm">{status}</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-white font-bold mb-2">💡 How it works:</h3>
          <ol className="text-white/70 text-sm space-y-1 list-decimal list-inside">
            <li>Connect wallet (RainbowKit - no private key needed!)</li>
            <li>Mint WAY: Locks your USDC, mints WAY 1:1</li>
            <li>Burn WAY: Burns WAY, returns USDC 1:1</li>
            <li>Bridge: Use LayerZero to send WAY cross-chain</li>
          </ol>
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded">
            <p className="text-green-200 text-sm">
              <strong>✅ Using RainbowKit (Wallet Extension)</strong><br/>
              No private key exposed! All transactions signed via your wallet.<br/><br/>
              <strong>Addresses:</strong><br/>
              WAY: {wayAddress?.slice(0, 6)}...{wayAddress?.slice(-4)}<br/>
              USDC: {usdcAddress?.slice(0, 6)}...{usdcAddress?.slice(-4)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

