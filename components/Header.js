import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { IconHome, IconSend, IconReceipt } from "@tabler/icons-react";
import { FloatingDock } from "@/components/ui/floating-dock";

// Header component - used across all pages
// Includes logo, optional navigation dock, and wallet connect button
export const Header = ({ showNavigation = false }) => {
  // Navigation items for the floating dock
  // Icons updated for clarity: Home, Send/Pay, and Receipt/Receive
  const navItems = [
    {
      title: "Home",
      icon: <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "/",
    },
    {
      title: "Pay",
      icon: <IconSend className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "/transfer",
    },
    {
      title: "Merchant",
      icon: <IconReceipt className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "/merchant",
    },
  ];

  return (
    <header className="relative flex items-center pt-4 sm:pt-6 lg:pt-8 pb-2 sm:pb-3 lg:pb-4 px-4 sm:px-8 lg:px-16">
      {/* Logo and App Name - Left */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        <Image 
          src="/icons/dhalway_1.png"
          alt="DhalWay Logo"
          width={64}
          height={64}
          className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16"
        />
        <div className="select-none text-lg sm:text-2xl lg:text-3xl font-bold tracking-wide text-white/90">
          DhalWay
        </div>
      </div>
      
      {/* Navigation - Absolutely centered, hidden on mobile */}
      {showNavigation && (
        <div className="hidden sm:block absolute left-1/2 -translate-x-1/2">
          <FloatingDock 
            items={navItems}
            desktopClassName="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl"
          />
        </div>
      )}
      
      {/* Spacer to push connect button to the right */}
      <div className="flex-1"></div>
      
      {/* Connect Button - Right */}
      <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl p-1">
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
            const ready = mounted && authenticationStatus !== 'loading';
            const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

            return (
              <div className="relative z-10">
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                      >
                        <span className="hidden sm:inline">Connect Wallet</span>
                        <span className="sm:hidden">Connect</span>
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-red-300 hover:text-red-200 transition-colors rounded-lg hover:bg-red-500/10"
                      >
                        Wrong network
                      </button>
                    );
                  }

                  return (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                      >
                        {chain.hasIcon && (
                          <div
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full overflow-hidden flex items-center justify-center"
                            style={{ background: chain.iconBackground }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                className="w-3 h-3 sm:w-4 sm:h-4"
                              />
                            )}
                          </div>
                        )}
                        <span className="hidden md:inline">{chain.name}</span>
                      </button>

                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                      >
                        <span className="hidden sm:inline">{account.displayName}</span>
                        <span className="sm:hidden">{account.displayName.slice(0, 6)}...</span>
                        {account.displayBalance && (
                          <span className="hidden lg:inline text-white/60 ml-1">
                            ({account.displayBalance})
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
};

