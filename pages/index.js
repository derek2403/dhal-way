import { useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Header } from '../components/Header';

import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

// Aurora Background Component - creates animated gradient background
// Real Aceternity UI implementation
const AuroraBackground = ({ children, className, showRadialGradient = true, ...props }) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center bg-zinc-50 text-slate-950 dark:bg-zinc-900",
        className,
      )}
      {...props}
    >
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          "--aurora": "repeating-linear-gradient(100deg,#475569_12%,#64748b_18%,#334155_24%,#1e293b_30%,#0f172a_36%)",
          "--dark-gradient": "repeating-linear-gradient(100deg,#000_0%,#000_8%,transparent_12%,transparent_16%,#000_20%)",
          "--white-gradient": "repeating-linear-gradient(100deg,#fff_0%,#fff_8%,transparent_12%,transparent_16%,#fff_20%)",
          "--slate-600": "#475569",
          "--slate-500": "#64748b",
          "--slate-700": "#334155",
          "--slate-800": "#1e293b",
          "--slate-900": "#0f172a",
          "--black": "#000",
          "--white": "#fff",
          "--transparent": "transparent",
        }}
      >
        <div
          className={cn(
            `after:animate-aurora pointer-events-none absolute -inset-[10px] [background-image:var(--white-gradient),var(--aurora)] [background-size:250%,_180%] [background-position:50%_50%,50%_50%] opacity-40 blur-[12px] invert filter will-change-transform [--aurora:repeating-linear-gradient(100deg,var(--slate-600)_12%,var(--slate-500)_18%,var(--slate-700)_24%,var(--slate-800)_30%,var(--slate-900)_36%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_8%,var(--transparent)_12%,var(--transparent)_16%,var(--black)_20%)] [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_8%,var(--transparent)_12%,var(--transparent)_16%,var(--white)_20%)] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] after:[background-size:180%,_120%] after:[background-attachment:fixed] after:mix-blend-difference after:content-[""] dark:[background-image:var(--dark-gradient),var(--aurora)] dark:invert-0 after:dark:[background-image:var(--dark-gradient),var(--aurora)]`,
            showRadialGradient && `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`,
          )}
        ></div>
      </div>
      {children}
    </div>
  );
};

// Token Icon Component - displays a token icon
const TokenIcon = ({ src, alt }) => (
  <Image 
    src={src} 
    alt={alt} 
    width={32} 
    height={32} 
    className="w-8 h-8"
  />
);

// Token Icon with Chain overlay - displays token with small chain badge
// Similar to 1inch design
const TokenWithChain = ({ tokenSrc, chainSrc, tokenAlt, chainAlt }) => (
  <div className="relative w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 flex-shrink-0">
    <Image 
      src={tokenSrc} 
      alt={tokenAlt} 
      width={32} 
      height={32} 
      className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8"
    />
    {chainSrc && (
      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-gray-900 rounded-full p-0.5 border border-white/20 shadow-lg">
        <Image
          src={chainSrc} 
          alt={chainAlt} 
          width={14} 
          height={14} 
          className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-3 lg:h-3"
        />
      </div>
    )}
  </div>
);

export default function LandingPage() {
  // Prevent page scrolling on landing page
  useEffect(() => {
    // Keep reference to any existing inline styles so we can restore on unmount
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    // Allow scrolling on mobile/tablet; lock scroll on desktop (>= lg breakpoint)
    const updateOverflow = () => {
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches; // Tailwind lg
      document.documentElement.style.overflow = isDesktop ? 'hidden' : '';
      document.body.style.overflow = isDesktop ? 'hidden' : '';
    };

    updateOverflow();
    window.addEventListener('resize', updateOverflow);
    window.addEventListener('orientationchange', updateOverflow);

    return () => {
      window.removeEventListener('resize', updateOverflow);
      window.removeEventListener('orientationchange', updateOverflow);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);


  return (
    <>
      <Head>
        <title>DhalWay - Universal Cross‑Chain Payments</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AuroraBackground className="relative isolate grid h-dvh grid-rows-[auto,1fr] overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-black">
        {/* Header with Logo, Navigation and Connect Button */}
        <div className="absolute top-0 left-0 right-0 z-40">
          <Header showNavigation={true} />
        </div>

        {/* Main Heading - Below header */}
        <div className="pointer-events-none absolute top-[12%] sm:top-[14%] lg:top-[16%] left-0 right-0 flex items-center justify-center z-30 px-4">
          <TextGenerateEffect 
            words="Any tokens.|Any chains.|Both ways."
            className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-black text-center max-w-4xl leading-tight text-white"
            duration={0.5}
            filter={true}
            staggerDelay={0.5}
            splitByPipe={true}
          />
        </div>

        {/* Payment Cards - Shows example of user paying vs merchant receiving */}
        <div className="pointer-events-none absolute top-[20%] sm:top-[22%] lg:bottom-0 left-0 right-0 flex items-center justify-center lg:pb-20">
          <div className="flex flex-col items-center gap-1.5 sm:gap-2.5 max-w-4xl w-full px-2 sm:px-4">
            {/* Payment Cards Container */}
            <div className="flex gap-1.5 sm:gap-3 lg:gap-6 flex-col lg:flex-row w-full max-w-4xl justify-center">
              {/* Payment Breakdown Card - LEFT SIDE */}
              <div className="animate-card-left glass-card landing-mobile-card flex flex-col justify-start p-2 sm:p-3 lg:p-4 relative flex-1 max-w-full lg:max-w-xs mx-auto w-full">
                <BorderBeam 
                  size={120}
                  duration={4}
                  colorFrom="#ffffff"
                  colorTo="#ffffff80"
                  delay={0}
                />
                <div className="text-white/90">
                  <h2 className="text-xs sm:text-sm lg:text-base font-semibold text-white mb-1.5 sm:mb-2 lg:mb-3 text-center">User Pays</h2>
                  
                  <div className="space-y-1 sm:space-y-1.5 lg:space-y-2 mb-1.5 sm:mb-2 lg:mb-3">
                {/* ETH Payment on Base */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-1 sm:p-1.5 lg:p-2 border border-white/10">
                  <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/ethereum-eth-logo-colored.svg" 
                      chainSrc="/icons/base.png" 
                      tokenAlt="ETH" 
                      chainAlt="Base"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-[10px] sm:text-xs lg:text-sm font-medium">ETH</span>
                      <span className="text-white/50 text-[8px] sm:text-[10px] lg:text-xs">on Base</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-medium text-[10px] sm:text-xs lg:text-base">0.0024 ETH</span>
                    <span className="text-white/60 text-[8px] sm:text-[10px] lg:text-sm block">$10</span>
                  </div>
                </div>

                {/* FLOW Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-1 sm:p-1.5 lg:p-2 border border-white/5">
                  <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/flow-flow-logo.svg" 
                      chainSrc="/icons/flow-flow-logo.svg" 
                      tokenAlt="FLOW" 
                      chainAlt="Flow"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-[10px] sm:text-xs lg:text-sm font-medium">FLOW</span>
                      <span className="text-white/50 text-[8px] sm:text-[10px] lg:text-xs">on Flow</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-medium text-[10px] sm:text-xs lg:text-base">66.3 FLOW</span>
                    <span className="text-white/60 text-[8px] sm:text-[10px] lg:text-sm block">$20</span>
                  </div>
                </div>

                {/* USDC Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-1 sm:p-1.5 lg:p-2 border border-white/5">
                  <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/usd-coin-usdc-logo.svg" 
                      chainSrc="/icons/arbitrum-arb-logo.svg" 
                      tokenAlt="USDC" 
                      chainAlt="Arbitrum"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-[10px] sm:text-xs lg:text-sm font-medium">USDC</span>
                      <span className="text-white/50 text-[8px] sm:text-[10px] lg:text-xs">on Arbitrum</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-medium text-[10px] sm:text-xs lg:text-base">30.0 USDC</span>
                    <span className="text-white/60 text-[8px] sm:text-[10px] lg:text-sm block">$30</span>
                  </div>
                </div>

                {/* ETH Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-1 sm:p-1.5 lg:p-2 border border-white/5">
                  <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/ethereum-eth-logo-colored.svg" 
                      chainSrc="/icons/arbitrum-arb-logo.svg" 
                      tokenAlt="ETH" 
                      chainAlt="Arbitrum"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-[10px] sm:text-xs lg:text-sm font-medium">ETH</span>
                      <span className="text-white/50 text-[8px] sm:text-[10px] lg:text-xs">on Arbitrum</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-medium text-[10px] sm:text-xs lg:text-base">0.005 ETH</span>
                    <span className="text-white/60 text-[8px] sm:text-[10px] lg:text-sm block">$20</span>
                  </div>
                </div>

                {/* PayPal USD Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-1 sm:p-1.5 lg:p-2 border border-white/5">
                  <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/paypal-usd-pyusd-logo.svg" 
                      chainSrc="/icons/ethereum-eth-logo-colored.svg" 
                      tokenAlt="PYUSD" 
                      chainAlt="Ethereum Sepolia"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-[10px] sm:text-xs lg:text-sm font-medium">PYUSD</span>
                      <span className="text-white/50 text-[8px] sm:text-[10px] lg:text-xs">on Ethereum Sepolia</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-medium text-[10px] sm:text-xs lg:text-base">20.0 PYUSD</span>
                    <span className="text-white/60 text-[8px] sm:text-[10px] lg:text-sm block">$20</span>
                  </div>
                </div>
              </div>

                  <div className="border-t border-white/20 pt-1.5 sm:pt-2 lg:pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-[10px] sm:text-xs lg:text-base">Total Payment</span>
                      <span className="text-white font-bold text-xs sm:text-base lg:text-lg">$100.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated Transition Arrow - Desktop */}
              <div className="animate-transition hidden lg:flex items-center justify-center flex-shrink-0">
                <div className="relative flex items-center">
                  {/* Flowing dots */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0.3s'}}></div>
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0.6s'}}></div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="ml-4 relative">
                    <svg 
                      width="40" 
                      height="20" 
                      viewBox="0 0 40 20" 
                      className="text-white/60 animate-flow-arrow"
                    >
                      <defs>
                        <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 0.6}} />
                          <stop offset="50%" style={{stopColor: '#ffffff', stopOpacity: 0.4}} />
                          <stop offset="100%" style={{stopColor: '#ffffff', stopOpacity: 0.2}} />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M2 10 L30 10 M24 4 L30 10 L24 16" 
                        stroke="url(#arrowGradient)" 
                        strokeWidth="2" 
                        fill="none" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  
                  {/* More flowing dots */}
                  <div className="ml-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0.9s'}}></div>
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '1.2s'}}></div>
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '1.5s'}}></div>
                  </div>
                </div>
                
                {/* Conversion label */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/40 whitespace-nowrap">
                  Swaps & Bridges
                </div>
              </div>

              {/* Mobile Transition (vertical) */}
              <div className="animate-transition lg:hidden flex flex-col items-center justify-center py-1 sm:py-2">
                <div className="relative flex flex-col items-center">
                  {/* Flowing dots */}
                  <div className="flex flex-col items-center gap-1.5 my-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0s'}}></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0.3s'}}></div>
                  </div>
                  
                  {/* Vertical Arrow */}
                  <svg 
                    width="16" 
                    height="32" 
                    viewBox="0 0 20 40" 
                    className="text-white/60 animate-flow-arrow sm:w-[20px] sm:h-[40px]"
                  >
                    <defs>
                      <linearGradient id="arrowGradientVertical" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 0.6}} />
                        <stop offset="50%" style={{stopColor: '#ffffff', stopOpacity: 0.4}} />
                        <stop offset="100%" style={{stopColor: '#ffffff', stopOpacity: 0.2}} />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M10 2 L10 30 M4 24 L10 30 L16 24" 
                      stroke="url(#arrowGradientVertical)" 
                      strokeWidth="2" 
                      fill="none" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                  
                  {/* More flowing dots */}
                  <div className="flex flex-col items-center gap-1.5 my-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0.9s'}}></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '1.2s'}}></div>
                  </div>
                </div>
              </div>

              {/* Merchant Received Card - RIGHT SIDE */}
              <div className="animate-card-right glass-card landing-mobile-card flex flex-col justify-start p-2 sm:p-3 lg:p-4 relative flex-1 max-w-full lg:max-w-xs mx-auto w-full">
                <BorderBeam 
                  size={120}
                  duration={4}
                  colorFrom="#ffffff80"
                  colorTo="#ffffff"
                  delay={2}
                />
                <div className="text-white/90">
              <h2 className="text-xs sm:text-sm lg:text-base font-semibold text-white mb-1.5 sm:mb-2 lg:mb-3 text-center">Merchant Receives</h2>
              
              <div className="space-y-1 sm:space-y-1.5 lg:space-y-2 mb-1.5 sm:mb-2 lg:mb-3">
                {/* ETH Received */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-1 sm:p-1.5 lg:p-2 border border-white/5">
                  <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/ethereum-eth-logo-colored.svg" 
                      chainSrc="/icons/ethereum-eth-logo-colored.svg" 
                      tokenAlt="ETH" 
                      chainAlt="Ethereum"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-[10px] sm:text-xs lg:text-sm font-medium">ETH</span>
                      <span className="text-white/50 text-[8px] sm:text-[10px] lg:text-xs">on Ethereum</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-medium text-[10px] sm:text-xs lg:text-base">0.012 ETH</span>
                    <span className="text-white/60 text-[8px] sm:text-[10px] lg:text-sm block">$50</span>
                  </div>
                </div>

                {/* SOL Received */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-1 sm:p-1.5 lg:p-2 border border-white/5">
                  <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/solana-sol-logo.svg" 
                      chainSrc="/icons/solana-sol-logo.svg" 
                      tokenAlt="SOL" 
                      chainAlt="Solana"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-[10px] sm:text-xs lg:text-sm font-medium">SOL</span>
                      <span className="text-white/50 text-[8px] sm:text-[10px] lg:text-xs">on Solana</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-medium text-[10px] sm:text-xs lg:text-base">0.148 SOL</span>
                    <span className="text-white/60 text-[8px] sm:text-[10px] lg:text-sm block">$30</span>
                  </div>
                </div>

                {/* PYUSD Received */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-1 sm:p-1.5 lg:p-2 border border-white/5">
                  <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/paypal-usd-pyusd-logo.svg" 
                      chainSrc="/icons/arbitrum-arb-logo.svg" 
                      tokenAlt="PYUSD" 
                      chainAlt="Arbitrum"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-[10px] sm:text-xs lg:text-sm font-medium">PYUSD</span>
                      <span className="text-white/50 text-[8px] sm:text-[10px] lg:text-xs">on Arbitrum</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-medium text-[10px] sm:text-xs lg:text-base">20.0 PYUSD</span>
                    <span className="text-white/60 text-[8px] sm:text-[10px] lg:text-sm block">$20</span>
                  </div>
                </div>
              </div>

                  <div className="border-t border-white/20 pt-1.5 sm:pt-2 lg:pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-[10px] sm:text-xs lg:text-base">Total Received</span>
                      <span className="text-white font-bold text-xs sm:text-base lg:text-lg">$100.00</span>
                    </div>
                  </div>

                  <div className="mt-1.5 sm:mt-2 lg:mt-4 text-[8px] sm:text-[10px] lg:text-xs text-white/60 text-center">
                    Customizable allocation rules
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero - empty content area */}
        <main id="home" className="relative mx-auto flex w-full max-w-6xl items-center justify-center px-6 h-full">
          {/* Content is now in the glassmorphism cards above */}
        </main>

        {/* Footer note (non-scroll, stays within viewport) */}
        <div id="about" className="pointer-events-none mb-2 sm:mb-4 lg:mb-6 mt-auto text-center text-[8px] sm:text-[10px] lg:text-xs text-white/50 px-4">
          Chain‑agnostic. Developer‑friendly. Minimal UX friction.
    </div>
      </AuroraBackground>
    </>
  );
}
