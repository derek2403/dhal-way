import "@/styles/globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import React, { useEffect } from 'react';

import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
  Theme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  baseSepolia,
  optimismSepolia as optimismSepoliaBase,
  sepolia as sepoliaBase,
  arbitrumSepolia as arbitrumSepoliaBase
} from 'wagmi/chains';

// Custom chain definitions for testnets with colored icons
const flowEVMTestnet = {
  id: 545,
  name: 'Flow EVM Testnet',
  nativeCurrency: { name: 'Flow', symbol: 'FLOW', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.evm.nodes.onflow.org'] },
    public: { http: ['https://testnet.evm.nodes.onflow.org'] }
  },
  blockExplorers: {
    default: { name: 'Flow Diver', url: 'https://testnet.flowdiver.io' }
  },
  iconUrl: '/icons/flow-flow-logo.svg',
  testnet: true
};

const baseTestnet = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
    public: { http: ['https://sepolia.base.org'] }
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' }
  },
  iconUrl: '/icons/base.png',
  testnet: true
};

// Override default chains with colored Ethereum icons
const sepolia = {
  ...sepoliaBase,
  iconUrl: '/icons/ethereum-eth-logo-colored.svg'
};

const arbitrumSepolia = {
  ...arbitrumSepoliaBase,
  iconUrl: '/icons/arbitrum-arb-logo.svg'
};

const optimismSepolia = {
  ...optimismSepoliaBase,
  iconUrl: '/icons/optimism-ethereum-op-logo.svg'
};

// React Query client for data fetching
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

// Configure wagmi with chains and RainbowKit settings
const config = getDefaultConfig({
  appName: 'dhal-way',
  projectId: '1',
  chains: [sepolia, flowEVMTestnet, optimismSepolia, arbitrumSepolia, baseSepolia],
  ssr: true,
});

const queryClient = new QueryClient();
import { Nunito } from "next/font/google";

const nunito = Nunito({ subsets: ["latin"], display: "swap" });

// Error Boundary Component to catch React errors gracefully
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Only log non-analytics errors to avoid spam
    if (!error.message.includes('Analytics SDK') && 
        !error.message.includes('Failed to fetch') &&
        !error.stack.includes('cca-lite.coinbase.com')) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Reset error state and continue rendering
      this.setState({ hasError: false });
    }
    return this.props.children;
  }
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', function(event) {
    // Check if it's an analytics-related error
    const isAnalyticsError = event.reason && (
      event.reason.message?.includes('Analytics SDK') ||
      event.reason.message?.includes('Failed to fetch') ||
      event.reason.stack?.includes('cca-lite.coinbase.com') ||
      event.reason.stack?.includes('pulse.walletconnect.org')
    );
    
    if (isAnalyticsError) {
      // Prevent the error from showing in console/UI
      event.preventDefault();
      return false;
    }
  });

  // Override console.error for specific analytics errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorMessage = args.join(' ');
    
    // Filter out known analytics errors
    if (errorMessage.includes('Analytics SDK') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('cca-lite.coinbase.com') ||
        errorMessage.includes('pulse.walletconnect.org')) {
      return; // Don't log these errors
    }
    
    // Log all other errors normally
    originalConsoleError.apply(console, args);
  };
}

// Create custom glassmorphism theme for RainbowKit modals
// This theme applies to both network selection and account modals
const glassmorphismTheme = darkTheme({
  accentColor: 'rgba(255, 255, 255, 0.15)',
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'large',
});

// Modal background and borders - more transparent for all modals
glassmorphismTheme.colors.modalBackground = 'rgba(255, 255, 255, 0.08)';
glassmorphismTheme.colors.modalBorder = 'rgba(255, 255, 255, 0.3)';
glassmorphismTheme.colors.modalText = 'rgba(255, 255, 255, 0.95)';
glassmorphismTheme.colors.modalTextDim = 'rgba(255, 255, 255, 0.7)';
glassmorphismTheme.colors.modalTextSecondary = 'rgba(255, 255, 255, 0.85)';

// Modal backdrop overlay
glassmorphismTheme.colors.modalBackdrop = 'rgba(0, 0, 0, 0.5)';

// Close button styling
glassmorphismTheme.colors.closeButton = 'rgba(255, 255, 255, 0.3)';
glassmorphismTheme.colors.closeButtonBackground = 'rgba(255, 255, 255, 0.1)';

// Menu items for network selection
glassmorphismTheme.colors.menuItemBackground = 'rgba(255, 255, 255, 0.1)';
glassmorphismTheme.colors.actionButtonBorder = 'rgba(255, 255, 255, 0.2)';
glassmorphismTheme.colors.actionButtonSecondaryBackground = 'rgba(255, 255, 255, 0.1)';

// Profile/Account modal - more transparent to match network modal
glassmorphismTheme.colors.profileAction = 'rgba(255, 255, 255, 0.05)';
glassmorphismTheme.colors.profileActionHover = 'rgba(255, 255, 255, 0.12)';
glassmorphismTheme.colors.profileForeground = 'rgba(255, 255, 255, 0.08)';

// Connect button styling
glassmorphismTheme.colors.connectButtonBackground = 'rgba(255, 255, 255, 0.12)';
glassmorphismTheme.colors.connectButtonText = 'rgba(255, 255, 255, 0.95)';
glassmorphismTheme.colors.connectButtonInnerBackground = 'rgba(255, 255, 255, 0.08)';

// General borders and error states
glassmorphismTheme.colors.generalBorder = 'rgba(255, 255, 255, 0.2)';
glassmorphismTheme.colors.generalBorderDim = 'rgba(255, 255, 255, 0.1)';
glassmorphismTheme.colors.error = 'rgba(239, 68, 68, 0.9)';

// Enhanced backdrop blur for all modals
if (glassmorphismTheme.blurs) {
  glassmorphismTheme.blurs.modalOverlay = 'blur(24px)';
}

// Modal shadow for depth
if (glassmorphismTheme.shadows) {
  glassmorphismTheme.shadows.dialog = '0 8px 32px rgba(0, 0, 0, 0.3)';
}

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <div className={nunito.className}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider theme={glassmorphismTheme}>
              <Component {...pageProps} />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </div>
    </ErrorBoundary>
  );
}
