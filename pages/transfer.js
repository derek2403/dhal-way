import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { Header } from '../components/Header';
import { Spotlight } from '@/components/ui/spotlight-new';
import AtomicTransfer from '../components/AtomicTransfer';
import TokenBalance from '../components/TokenBalance';
import AtomicEscrowTransfer from '../components/AtomicEscrowTransfer';
import QRScanner from '../components/QRScanner';

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
  const { isConnected } = useAccount();
  const [transferAmounts, setTransferAmounts] = useState({});
  const [tokenPrices, setTokenPrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [pricesError, setPricesError] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  
  // Payment amount configuration - user specified
  const [paymentAmount, setPaymentAmount] = useState(''); // User input amount
  const [isAmountSet, setIsAmountSet] = useState(false); // Track if amount is confirmed
  const [showScanner, setShowScanner] = useState(false); // Show QR scanner modal

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
    } catch (error) {
      // If JSON parsing fails, try parsing as URL (detailed QR format)
      try {
        const url = new URL(scannedData);
        const portfolioParam = url.searchParams.get('portfolio');
        if (portfolioParam) {
          const parsedPortfolio = JSON.parse(decodeURIComponent(portfolioParam));
          setPortfolioData(parsedPortfolio);
          setShowScanner(false);
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

  // Effect to lock/unlock body scroll when scanner modal is open
  useEffect(() => {
    if (showScanner) {
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
  }, [showScanner]);

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
            <div className="w-full">
              <div className="glass-card flex flex-col justify-start p-6 sm:p-8 relative max-w-2xl mx-auto w-full text-center">
                <h3 className="text-2xl font-bold mb-4 text-white">Scan QR Code to Start Payment</h3>
                <p className="text-white/70 mb-6">
                  Please scan the QR code from the merchant to begin selecting your payment tokens.
                </p>
                <button
                  onClick={() => setShowScanner(true)}
                  className="mx-auto px-8 py-4 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-semibold transition-all duration-200 text-lg"
                >
                  Open QR Scanner
                </button>
              </div>
            </div>
          )}

          {/* Portfolio Info from QR Code */}
          {portfolioData && (
            <div className="w-full">
              <div className="glass-card flex flex-col justify-start p-6 relative max-w-6xl mx-auto w-full" style={{ maxWidth: '1000px' }}>
                <h3 className="text-xl font-bold mb-4 text-white">Scanned Portfolio</h3>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-white/70 mb-2">Recipient Wallet:</p>
                  <p className="text-white font-mono text-sm break-all">{portfolioData.walletAddress}</p>
                  
                  {Object.keys(portfolioData).length > 1 && (
                    <div className="mt-4">
                      <p className="text-sm text-white/70 mb-2">Portfolio Allocation:</p>
                      <div className="space-y-2">
                        {Object.entries(portfolioData).map(([chain, tokens]) => {
                          if (chain === 'walletAddress' || typeof tokens !== 'object') return null;
                          return (
                            <div key={chain} className="text-sm">
                              <span className="text-white/90 capitalize">{chain}: </span>
                              {Object.entries(tokens).map(([token, percentage], index, arr) => (
                                <span key={token} className="text-white/70">
                                  {token} ({percentage}%){index < arr.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Amount Input - Show only after QR is scanned */}
          {portfolioData && !isAmountSet && (
            <div className="w-full">
              <div className="glass-card flex flex-col justify-start p-6 relative max-w-6xl mx-auto w-full" style={{ maxWidth: '1000px' }}>
                <h3 className="text-xl font-bold mb-4 text-white">Enter Payment Amount</h3>
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <p className="text-sm text-white/70 mb-4">How much would you like to pay?</p>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-sm text-white/70 mb-2">Amount (USD)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 text-lg">$</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 pl-8 py-3 text-white text-lg placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
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
                      }}
                      className="px-6 py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-semibold transition-all duration-200 whitespace-nowrap"
                    >
                      Confirm Amount
                    </button>
                  </div>
                  {paymentAmount && parseFloat(paymentAmount) > 0 && (
                    <p className="text-sm text-white/50 mt-3">
                      You will be able to select tokens worth ${parseFloat(paymentAmount).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Show confirmed amount if set */}
          {isAmountSet && (
            <div className="w-full">
              <div className="glass-card flex flex-col justify-start p-4 relative max-w-6xl mx-auto w-full" style={{ maxWidth: '1000px' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Payment Amount:</p>
                    <p className="text-2xl font-bold text-white">${parseFloat(paymentAmount).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAmountSet(false);
                      setTransferAmounts({});
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-all duration-200"
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

          {/* Atomic Transfer - Hide until amount is set */}
          <div className="w-full transition-all duration-300">
            <AtomicTransfer 
              transferAmounts={transferAmounts}
              isAmountSet={isAmountSet}
            />
          </div>
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
    </div>
  );
}
