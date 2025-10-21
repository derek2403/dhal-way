import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useSignTypedData } from 'wagmi';
import { Header } from '../components/Header';
import { Spotlight } from '@/components/ui/spotlight-new';
import AtomicTransfer from '../components/AtomicTransfer';
import TokenBalance from '../components/TokenBalance';
import AtomicEscrowTransfer from '../components/AtomicEscrowTransfer';
import QRScanner from '../components/QRScanner';
import { ScanLine } from 'lucide-react';

// Pyth price feed IDs mapping
const PYTH_PRICE_IDS = {
  'PYUSD': '0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692',
  'LINK': '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
  'FLOW': '0x2fb245b9a84554a0f15aa123cbb5f64cd263b59e9a87d80148cbffab50c69f30',
  'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'
};

export default function Transfer() {
  const router = useRouter();
  const { address, isConnected, chainId: connectedChainId } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [transferAmounts, setTransferAmounts] = useState({});
  const [tokenPrices, setTokenPrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [pricesError, setPricesError] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  
  // Payment amount configuration - user specified
  const [paymentAmount, setPaymentAmount] = useState('0.00'); // User input amount (formatted as dollars.cents)
  const [isAmountSet, setIsAmountSet] = useState(false); // Track if amount is confirmed
  const [showScanner, setShowScanner] = useState(false); // Show QR scanner modal
  const [showAmountModal, setShowAmountModal] = useState(false); // Show payment amount modal
  
  // Payment execution state
  const [sessionId, setSessionId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResults, setPaymentResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  // Handle payment amount input like a money keypad (adds digits as cents)
  const handlePaymentAmountChange = (e) => {
    const value = e.target.value;
    
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '');
    
    // Convert to number (cents) then to dollars
    const cents = parseInt(digitsOnly || '0', 10);
    const dollars = (cents / 100).toFixed(2);
    
    setPaymentAmount(dollars);
  };

  // Handle backspace/delete for payment amount
  const handlePaymentAmountKeyDown = (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      const current = paymentAmount.replace(/\D/g, '');
      const newValue = current.slice(0, -1);
      const cents = parseInt(newValue || '0', 10);
      const dollars = (cents / 100).toFixed(2);
      setPaymentAmount(dollars);
    }
  };

  // Function to fetch prices from Hermes API
  const fetchTokenPrices = async () => {
    try {
      setPricesLoading(true);
      setPricesError(null);
      
      // Get all price feed IDs
      const priceIds = Object.values(PYTH_PRICE_IDS);
      
      // Create query string for multiple IDs
      const idsQuery = priceIds.map(id => `ids[]=${id}`).join('&');
      const url = `https://hermes.pyth.network/api/latest_price_feeds?${idsQuery}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }
      
      const priceData = await response.json();
      
      // Convert to symbol-keyed object
      const pricesById = {};
      priceData.forEach(item => {
        const symbol = Object.keys(PYTH_PRICE_IDS).find(
          key => PYTH_PRICE_IDS[key] === `0x${item.id}`
        );
        
        if (symbol && item.price) {
          // Convert price based on expo (price feeds use different decimal places)
          const price = parseFloat(item.price.price) * Math.pow(10, item.price.expo);
          pricesById[symbol] = {
            price: price,
            confidence: parseFloat(item.price.conf) * Math.pow(10, item.price.expo),
            publishTime: item.price.publish_time,
            formatted: price.toFixed(price < 1 ? 6 : 2)
          };
        }
      });
      
      setTokenPrices(pricesById);
    } catch (error) {
      console.error('Error fetching token prices:', error);
      setPricesError(error.message);
    } finally {
      setPricesLoading(false);
    }
  };

  // Calculate total USD value of selected tokens
  const calculateTotalUSDValue = () => {
    return Object.entries(transferAmounts).reduce((total, [key, amount]) => {
      // Extract token symbol from key (format: "SYMBOL_CHAINID")
      const tokenSymbol = key.split('_')[0];
      const tokenPrice = tokenPrices[tokenSymbol]?.price || 0;
      return total + (amount * tokenPrice);
    }, 0);
  };

  // Wrapper for setTransferAmounts that enforces the payment limit
  const setTransferAmountsWithLimit = (newAmounts) => {
    const maxAmount = parseFloat(paymentAmount) || 0; // Use user-specified amount
    
    if (typeof newAmounts === 'function') {
      setTransferAmounts(prev => {
        const updated = newAmounts(prev);
        const totalValue = Object.entries(updated).reduce((total, [key, amount]) => {
          const tokenSymbol = key.split('_')[0];
          const tokenPrice = tokenPrices[tokenSymbol]?.price || 0;
          return total + (amount * tokenPrice);
        }, 0);
        
        // Only update if within limit
        if (totalValue <= maxAmount) {
          return updated;
        }
        return prev; // Return previous state if limit exceeded
      });
    } else {
      // Direct object assignment
      const totalValue = Object.entries(newAmounts).reduce((total, [key, amount]) => {
        const tokenSymbol = key.split('_')[0];
        const tokenPrice = tokenPrices[tokenSymbol]?.price || 0;
        return total + (amount * tokenPrice);
      }, 0);
      
      if (totalValue <= maxAmount) {
        setTransferAmounts(newAmounts);
      }
    }
  };

  // Function to handle scanned QR code data
  const handleQRScan = (scannedData) => {
    try {
      // Try parsing as JSON first (simple QR format)
      const parsedData = JSON.parse(scannedData);
      setPortfolioData(parsedData);
      setShowScanner(false);
      setShowAmountModal(true); // Show amount modal after successful scan
    } catch (error) {
      // If JSON parsing fails, try parsing as URL (detailed QR format)
      try {
        const url = new URL(scannedData);
        const portfolioParam = url.searchParams.get('portfolio');
        if (portfolioParam) {
          const parsedPortfolio = JSON.parse(decodeURIComponent(portfolioParam));
          setPortfolioData(parsedPortfolio);
          setShowScanner(false);
          setShowAmountModal(true); // Show amount modal after successful scan
        } else {
          alert('Invalid QR code format. Please scan a valid merchant QR code.');
        }
      } catch (urlError) {
        console.error('Error parsing QR code:', error, urlError);
        alert('Unable to read QR code. Please try again.');
      }
    }
  };

  // Effect to parse portfolio data from URL parameter
  useEffect(() => {
    if (router.isReady && router.query.portfolio) {
      try {
        const decodedData = decodeURIComponent(router.query.portfolio);
        const parsedPortfolio = JSON.parse(decodedData);
        setPortfolioData(parsedPortfolio);
        setShowAmountModal(true); // Show amount modal when loading from URL
      } catch (error) {
        console.error('Error parsing portfolio data from URL:', error);
      }
    }
  }, [router.isReady, router.query.portfolio]);

  // Effect to fetch prices on mount and set up periodic updates
  useEffect(() => {
    // Initial fetch
    fetchTokenPrices();
    
    // Set up periodic updates every 30 seconds
    const interval = setInterval(fetchTokenPrices, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Effect to lock/unlock body scroll when scanner or amount modal is open
  useEffect(() => {
    if (showScanner || showAmountModal) {
      // Disable scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable scrolling when modal is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup - ensure scroll is re-enabled when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showScanner, showAmountModal]);

  // Make RainbowKit modal use a full-page blurred overlay on this page
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Mark body so page-scoped CSS can target the RainbowKit portal
    document.body.classList.add('transfer-page');

    // Create a global, page-scoped overlay that always spans the viewport
    const pageOverlay = document.createElement('div');
    pageOverlay.id = 'transfer-global-overlay';
    const ov = pageOverlay.style;
    ov.position = 'fixed';
    ov.inset = '0';
    ov.width = '100vw';
    ov.height = '100vh';
    ov.background = 'rgba(0, 0, 0, 0.35)';
    ov.backdropFilter = 'blur(9px)';
    ov.WebkitBackdropFilter = 'blur(9px)';
    ov.zIndex = '999998';
    ov.pointerEvents = 'none';
    ov.display = 'none';
    document.body.appendChild(pageOverlay);

    const applyBackdropFix = () => {
      const candidates = new Set();

      // Known RainbowKit backdrop test id
      document
        .querySelectorAll('div[data-testid="rk-connect-modal-backdrop"]')
        .forEach((el) => candidates.add(el));

      // Generic full-screen overlay divs created near the dialog
      const portalRoot = document.querySelector('div[data-rk][aria-hidden="false"]');
      if (portalRoot) {
        portalRoot
          .querySelectorAll('div[style*="position: fixed"][style*="inset: 0"]')
          .forEach((el) => candidates.add(el));

        // Also capture overlay-like nodes that don't contain dialogs
        portalRoot
          .querySelectorAll('div')
          .forEach((el) => {
            if (el.getAttribute('role') === 'dialog') return;
            if (el.querySelector('[role="dialog"]')) return;
            const styleAttr = el.getAttribute('style') || '';
            const looksLikeOverlay =
              styleAttr.includes('position: fixed') ||
              styleAttr.includes('inset: 0') ||
              (styleAttr.includes('top: 0') && styleAttr.includes('left: 0'));
            if (looksLikeOverlay) {
              candidates.add(el);
            }
          });
      }

      candidates.forEach((el) => {
        // Mark so we don't repeatedly process
        if (!el.getAttribute('data-rk-backdrop')) {
          el.setAttribute('data-rk-backdrop', 'patched');
        }
        // Neutralize RainbowKit's own backdrop (we'll add our own full-page layer)
        el.style.setProperty('background', 'transparent', 'important');
        el.style.setProperty('backdrop-filter', 'none', 'important');
        el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      });

      // Toggle our full-page overlay based on whether a RainbowKit dialog is open
      const isOpen = !!document.querySelector('div[data-rk][aria-hidden="false"] [role="dialog"]');
      pageOverlay.style.display = isOpen ? 'block' : 'none';
    };

    // Initial run in case modal is already present
    applyBackdropFix();

    // Observe new nodes/styles while the page is mounted
    const observer = new MutationObserver(() => applyBackdropFix());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-testid', 'aria-hidden'],
    });

    // Fallback, page-scoped CSS override
    const styleEl = document.createElement('style');
    styleEl.id = 'transfer-no-backdrop';
    styleEl.textContent = `
      /* Ensure RK backdrops are transparent; we'll supply our own */
      .transfer-page div[data-rk][aria-hidden="false"] > div[data-testid="rk-connect-modal-backdrop"],
      .transfer-page div[data-rk][aria-hidden="false"] > div[style*="position: fixed"][style*="inset: 0"] {
        background: transparent !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      /* Keep the dialog crisp */
      .transfer-page div[data-rk][aria-hidden="false"] [role="dialog"],
      .transfer-page div[data-rk][aria-hidden="false"] [role="dialog"] *,
      .transfer-page div[data-rk][aria-hidden="false"] [role="dialog"]::before,
      .transfer-page div[data-rk][aria-hidden="false"] [role="dialog"]::after {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      observer.disconnect();
      document.body.classList.remove('transfer-page');
      if (pageOverlay.parentNode) pageOverlay.parentNode.removeChild(pageOverlay);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    };
  }, []);
  const [merchant, setMerchant] = useState(''); // Merchant address for escrow

  // Chain name mapping (frontend chain names to backend chain keys)
  const chainMapping = {
    'sepolia': 'sepolia',
    'base': 'base-sepolia',
    'arbitrum': 'arbitrum-sepolia',
    'optimism': 'optimism-sepolia',
    'flow': 'flow-testnet',
  };

  // Convert transferAmounts (format: "TOKEN_CHAINID") to userPayments format
  const convertToUserPayments = () => {
    const payments = [];
    
    Object.entries(transferAmounts).forEach(([key, amount]) => {
      if (amount > 0) {
        const [tokenSymbol, chainIdStr] = key.split('_');
        const chainId = parseInt(chainIdStr);
        
        // Map chainId to chain name
        let chainKey = '';
        if (chainId === 11155111) chainKey = 'sepolia';
        else if (chainId === 84532) chainKey = 'base-sepolia';
        else if (chainId === 421614) chainKey = 'arbitrum-sepolia';
        else if (chainId === 11155420) chainKey = 'optimism-sepolia';
        else if (chainId === 545) chainKey = 'flow-testnet';
        
        if (chainKey) {
          const tokenPrice = tokenPrices[tokenSymbol]?.price || 0;
          const usdValue = (amount * tokenPrice).toFixed(2);
          
          payments.push({
            chain: chainKey,
            token: tokenSymbol,
            usdValue: usdValue,
          });
        }
      }
    });
    
    return payments;
  };

  // Convert merchant portfolio allocation to merchantPayouts format
  const convertToMerchantPayouts = () => {
    if (!portfolioData) return [];
    
    const payouts = [];
    const totalAmount = parseFloat(paymentAmount) || 0;
    
    // Iterate through portfolio data (skip walletAddress)
    Object.entries(portfolioData).forEach(([chainName, tokens]) => {
      if (chainName === 'walletAddress') return;
      
      // Map frontend chain name to backend chain key
      const chainKey = chainMapping[chainName];
      if (!chainKey) return;
      
      // Iterate through tokens in this chain
      Object.entries(tokens).forEach(([tokenSymbol, percentage]) => {
        const usdValue = ((totalAmount * percentage) / 100).toFixed(2);
        
        payouts.push({
          chain: chainKey,
          token: tokenSymbol,
          usdValue: usdValue,
        });
      });
    });
    
    return payouts;
  };

  // Execute payment with EIP-712 signature
  const executePayment = async () => {
    if (!address || !isConnected) {
      setPaymentStatus('Please connect your wallet');
      return;
    }

    if (!connectedChainId) {
      setPaymentStatus('Please connect to a supported network (Sepolia, Arbitrum, Base, Optimism, or Flow)');
      return;
    }

    if (!portfolioData || !portfolioData.walletAddress) {
      setPaymentStatus('Please scan merchant QR code first');
      return;
    }

    const userPayments = convertToUserPayments();
    const merchantPayouts = convertToMerchantPayouts();
    
    if (userPayments.length === 0) {
      setPaymentStatus('Please select tokens to pay with');
      return;
    }

    if (merchantPayouts.length === 0) {
      setPaymentStatus('Invalid merchant allocation data');
      return;
    }

    // Calculate totals
    const userTotal = userPayments.reduce((sum, p) => sum + parseFloat(p.usdValue), 0);
    const merchantTotal = merchantPayouts.reduce((sum, p) => sum + parseFloat(p.usdValue), 0);

    // Check if totals match
    if (Math.abs(userTotal - merchantTotal) > 0.01) {
      setPaymentStatus(`❌ Payment mismatch: You're paying $${userTotal.toFixed(2)} but merchant expects $${merchantTotal.toFixed(2)}`);
      return;
    }

    setPaymentLoading(true);
    setPaymentStatus('Creating payment session with EIP-712 signature...');

    try {
      // Get chain name for user feedback
      const chainNames = {
        11155111: 'Sepolia',
        421614: 'Arbitrum Sepolia',
        84532: 'Base Sepolia',
        11155420: 'Optimism Sepolia',
        545: 'Flow Testnet',
      };
      const currentChainName = chainNames[connectedChainId] || `Chain ${connectedChainId}`;

      // EIP-712 Typed Data - Use currently connected chainId
      const domain = {
        name: 'Dhalway Payment Protocol',
        version: '1',
        chainId: connectedChainId || 84532, // Use connected chain, fallback to Base Sepolia
      };

      console.log('Signing on chain:', currentChainName, 'ChainId:', connectedChainId);

      // Contract addresses by chain (same as test2.js)
      const contracts = {
        'arbitrum-sepolia': {
          tokens: { 
            'USDC': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', 
            'ETH': '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
            'LINK': '0xb1D4538B4571d411F07960EF2838Ce337FE1E80E',
          },
          vault: '0x05fF0c6Da0a07960977D8629A748F71b6117e6ea',
        },
        'base-sepolia': {
          tokens: { 
            'USDC': '0x036CbD53842c5426634e7929541eC2318f3dCF7e', 
            'ETH': '0x4200000000000000000000000000000000000006' 
          },
          vault: '0xaeD23b0F0a11d8169a1711b37B2E07203b18F36F',
        },
        'flow-testnet': {
          tokens: { 
            'USDC': '0x356ED74eE51e4aa5f1Ce9B51329fecEF728621bc', 
            'FLOW': '0xd3bF53DAC106A0290B0483EcBC89d40FcC961f3e' 
          },
          vault: '0xFc199a0ad172B8cAFF2a1e0cdAB022f9B62928e9',
        },
        'optimism-sepolia': {
          tokens: { 
            'USDC': '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', 
            'ETH': '0x4200000000000000000000000000000000000006' 
          },
          vault: '0x5aD82749A1D56BC1F11B023f0352735ea006D238',
        },
        'sepolia': {
          tokens: { 
            'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', 
            'ETH': '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
            'PYUSD': '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
            'LINK': '0x779877A7B0D9E8603169DdbD7836e478b4624789',
          },
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
        merchant: portfolioData.walletAddress,
        totalUSD: userTotal.toFixed(2),
        payments: paymentItems,
        timestamp,
        nonce,
      };

      setPaymentStatus(`Please sign to authorize payment on ${currentChainName}...`);
      
      // User signs EIP-712 structured data
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'PaymentAuthorization',
        message: value,
      });

      setPaymentStatus('✅ Signed! Creating session...');

      // Create session with signature
      const response = await fetch('/api/session/create-eip712', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          merchantAddress: portfolioData.walletAddress,
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
      setPaymentStatus('✅ Signature verified! Executing payment...');

      // Execute payment
      const executeResponse = await fetch('/api/payment/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data.sessionId,
          userPayments,
          merchantAddress: portfolioData.walletAddress,
          merchantPayouts,
        }),
      });

      const executeData = await executeResponse.json();

      if (executeData.error) {
        throw new Error(executeData.error);
      }

      setPaymentResults(executeData);
      setPaymentStatus('✅ Payment completed successfully!');
      setShowResultsModal(true);

    } catch (error) {
      if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
        setPaymentStatus('❌ Payment cancelled - Signature rejected');
      } else {
        setPaymentStatus('❌ Error: ' + error.message);
      }
      console.error('Payment error:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Function to format wallet address - show first 6 and last 4 characters
  const formatAddress = (address) => {
    if (!address) return '';
    if (address.length < 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(0, 0%, 100%, .25) 0, hsla(0, 0%, 100%, .10) 40%, hsla(0, 0%, 100%, 0) 70%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .18) 0, hsla(0, 0%, 100%, .08) 60%, transparent 90%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .15) 0, hsla(0, 0%, 100%, .06) 60%, transparent 90%)"
          translateY={-300}
          width={600}
          height={1200}
          smallWidth={300}
          duration={9}
          xOffset={120}
        />
      </div>
      <div className="relative z-50">
        <Header showNavigation={true} />
        <main className={`px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto ${
          !isConnected 
            ? 'flex items-center justify-center h-[calc(100vh-120px)]' 
            : 'pt-3 pb-6 sm:pt-4 sm:pb-8'
        }`}>
        <div className={!isConnected ? '' : 'space-y-4 sm:space-y-5'}>
          {/* Prompt to scan QR code if no portfolio data */}
          {!portfolioData && isConnected && (
            <div className="w-full flex justify-center">
              <button
                onClick={() => setShowScanner(true)}
                className="glass-card p-12 hover:bg-white/10 transition-all duration-300 cursor-pointer group relative overflow-hidden border-2 border-white/20 hover:border-white/40 aspect-square"
                style={{ width: '220px', height: '220px' }}
              >
                <div className="relative z-10 flex items-center justify-center h-full">
                  <ScanLine 
                    className="w-32 h-32 text-white/80 group-hover:text-white group-hover:scale-110 transition-all duration-300" 
                    strokeWidth={1.5}
                  />
                </div>
              </button>
            </div>
          )}

          {/* Portfolio Info from QR Code */}
          {portfolioData && (
            <div className="w-full space-y-4">
              <div className="glass-card flex flex-col justify-start p-4 sm:p-8 relative max-w-6xl mx-auto w-full" style={{ maxWidth: '1000px' }}>
                <div className="text-center">
                  <p className="text-base text-white/70 mb-3">Recipient Wallet:</p>
                  <p className="text-4xl sm:text-6xl font-bold text-white mb-6 font-mono break-all">{formatAddress(portfolioData.walletAddress)}</p>
                </div>
              </div>
              
              {/* Merchant Payment Preferences */}
              <div className="glass-card p-4 sm:p-6 relative max-w-6xl mx-auto w-full" style={{ maxWidth: '1000px' }}>
                <h3 className="text-white font-semibold text-lg mb-3">Merchant Payment Preferences:</h3>
                <div className="space-y-2">
                  {Object.entries(portfolioData).map(([chainName, tokens]) => {
                    if (chainName === 'walletAddress') return null;
                    return (
                      <div key={chainName} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <p className="text-white/90 font-medium text-sm mb-2 capitalize">{chainName}</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(tokens).map(([tokenSymbol, percentage]) => (
                            <div key={tokenSymbol} className="bg-white/10 px-3 py-1 rounded text-xs text-white/80">
                              {tokenSymbol}: {percentage}%
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}


          {/* Show confirmed amount if set */}
          {isAmountSet && (
            <div className="w-full">
              <div className="glass-card flex flex-col justify-start p-8 relative max-w-6xl mx-auto w-full" style={{ maxWidth: '1000px' }}>
                <div className="text-center">
                  <p className="text-base text-white/70 mb-3">Payment Amount:</p>
                  <p className="text-6xl font-bold text-white mb-6">${parseFloat(paymentAmount).toFixed(2)}</p>
                  <button
                    onClick={() => {
                      setShowAmountModal(true);
                    }}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-200"
                  >
                    Change Amount
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Token Balance - Show tokens but hide controls until amount is set */}
          <div className="w-full transition-all duration-300">
            <TokenBalance 
              transferAmounts={transferAmounts}
              setTransferAmounts={setTransferAmountsWithLimit}
              tokenPrices={tokenPrices}
              pricesLoading={pricesLoading}
              pricesError={pricesError}
              maxPaymentAmount={parseFloat(paymentAmount) || 0}
              currentTotalUSD={calculateTotalUSDValue()}
              isAmountSet={isAmountSet}
            />
          </div>

          {/* Payment Button - Show when amount is set and tokens are selected */}
          {isAmountSet && calculateTotalUSDValue() > 0 && (
            <div className="w-full transition-all duration-300">
              <div className="glass-card p-6 relative max-w-6xl mx-auto w-full" style={{ maxWidth: '1000px' }}>
                <div className="text-center space-y-4">
                  <p className="text-white/70 text-sm">
                    You're paying: ${calculateTotalUSDValue().toFixed(2)}
                  </p>
                  <button
                    onClick={executePayment}
                    disabled={paymentLoading || !portfolioData}
                    className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white font-bold transition-all duration-200 text-lg"
                  >
                    {paymentLoading ? '⏳ Processing Payment...' : '💳 Pay Now'}
                  </button>
                  {paymentStatus && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      paymentStatus.includes('❌') ? 'bg-red-500/20 border border-red-500/50' :
                      paymentStatus.includes('✅') ? 'bg-green-500/20 border border-green-500/50' :
                      'bg-blue-500/20 border border-blue-500/50'
                    }`}>
                      <p className="text-white text-sm">{paymentStatus}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        </main>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 py-12">
          {/* Enhanced Backdrop */}
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setShowScanner(false)}
          />
          
          {/* Scanner Container - Clean and Compact */}
          <div className="relative z-10 w-full max-w-2xl">
            <div className="glass-card p-5 border-2 border-white/20 shadow-2xl">
              {/* Header - Compact */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-white">Scan QR Code</h3>
                <button
                  onClick={() => setShowScanner(false)}
                  className="text-white/70 hover:text-white hover:bg-white/10 transition-all text-2xl leading-none w-9 h-9 rounded-lg flex items-center justify-center"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              
              {/* QR Scanner Component */}
              <div>
                <QRScanner onScan={handleQRScan} />
              </div>
              
              {/* Footer - Compact */}
              <div className="mt-3 flex justify-center">
                <button
                  onClick={() => setShowScanner(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Amount Modal */}
      {showAmountModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Enhanced Backdrop */}
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setShowAmountModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-md">
            <div className="glass-card p-6 border-2 border-white/20 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Enter Payment Amount</h3>
                <button
                  onClick={() => setShowAmountModal(false)}
                  className="text-white/70 hover:text-white hover:bg-white/10 transition-all text-2xl leading-none w-9 h-9 rounded-lg flex items-center justify-center"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              
              {/* Content */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 text-lg">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={paymentAmount}
                      onChange={handlePaymentAmountChange}
                      onKeyDown={handlePaymentAmountKeyDown}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 pl-8 py-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-white/40"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    const amount = parseFloat(paymentAmount);
                    if (!amount || amount <= 0) {
                      alert('Please enter a valid payment amount');
                      return;
                    }
                    setIsAmountSet(true);
                    setShowAmountModal(false);
                  }}
                  className="w-full px-6 py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-semibold transition-all duration-200"
                >
                  Confirm Amount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Results Modal */}
      {showResultsModal && paymentResults && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setShowResultsModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-3xl my-8">
            <div className="glass-card p-6 border-2 border-white/20 shadow-2xl max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">📊 Payment Results</h3>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="text-white/70 hover:text-white hover:bg-white/10 transition-all text-2xl leading-none w-9 h-9 rounded-lg flex items-center justify-center"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              
              {/* Results Content */}
              <div className="space-y-3">
                {paymentResults.steps?.map((step, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm mb-1">{step.description}</p>
                        <p className={`text-xs ${
                          step.status.includes('✅') ? 'text-green-400' :
                          step.status.includes('❌') ? 'text-red-400' :
                          step.status.includes('⏳') ? 'text-yellow-400' :
                          'text-white/70'
                        }`}>
                          {step.status}
                        </p>
                      </div>
                      <div className="ml-3">
                        {step.phase === 'collection' && <span className="text-2xl">💰</span>}
                        {step.phase === 'bridging' && <span className="text-2xl">🌉</span>}
                        {step.phase === 'settlement' && <span className="text-2xl">💸</span>}
                        {step.phase === 'waiting' && <span className="text-2xl">⏳</span>}
                      </div>
                    </div>
                    
                    {/* Substeps */}
                    {step.substeps && step.substeps.length > 0 && (
                      <div className="mt-3 ml-4 space-y-1">
                        {step.substeps.map((substep, sidx) => (
                          <p key={sidx} className="text-white/60 text-xs">• {substep}</p>
                        ))}
                      </div>
                    )}
                    
                    {/* Links */}
                    <div className="mt-3 space-y-1">
                      {step.phase === 'bridging' && step.layerZeroUrl && (
                        <a 
                          href={step.layerZeroUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-green-400 text-xs hover:underline block"
                        >
                          🔗 Track on LayerZero Scan →
                        </a>
                      )}
                      
                      {step.explorerUrl && step.phase !== 'bridging' && (
                        <a 
                          href={step.explorerUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-400 text-xs hover:underline block"
                        >
                          🔍 View on Block Explorer →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                <p className="text-green-200 font-bold text-center">
                  ✅ Payment Completed: ${paymentResults.totalUSD?.toFixed(2) || '0.00'}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    // Reset form
                    setTransferAmounts({});
                    setPaymentAmount('0.00');
                    setIsAmountSet(false);
                    setPortfolioData(null);
                    setPaymentStatus('');
                    setPaymentResults(null);
                    setSessionId(null);
                  }}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-200"
                >
                  🔄 New Payment
                </button>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="flex-1 px-6 py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-semibold transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
