import { Header } from '../components/Header';
import { Spotlight } from '@/components/ui/spotlight-new';

export default function FAQ() {
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
        <main className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pt-8 pb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-8 text-center">
            Frequently Asked Questions
          </h1>
          
          <div className="space-y-6">
            {/* FAQ Item 1 */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-3">
                What is DhalWay?
              </h2>
              <p className="text-white/70 leading-relaxed">
                DhalWay is a multi-chain payment solution that allows you to send and receive cryptocurrency payments across different blockchain networks seamlessly.
              </p>
            </div>

            {/* FAQ Item 2 */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-3">
                How do I make a payment?
              </h2>
              <p className="text-white/70 leading-relaxed">
                Simply scan a merchant's QR code, enter the payment amount, select which tokens you'd like to use, and confirm the transaction. DhalWay handles the rest across multiple chains.
              </p>
            </div>

            {/* FAQ Item 3 */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-3">
                Which blockchains are supported?
              </h2>
              <p className="text-white/70 leading-relaxed">
                DhalWay currently supports Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, and Flow EVM Testnet with more chains coming soon.
              </p>
            </div>

            {/* FAQ Item 4 */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-3">
                How do I receive payments as a merchant?
              </h2>
              <p className="text-white/70 leading-relaxed">
                Navigate to the Merchant page, configure your portfolio allocation, and generate a QR code. Share this QR code with your customers to receive payments.
              </p>
            </div>

            {/* FAQ Item 5 */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-3">
                Is my wallet secure?
              </h2>
              <p className="text-white/70 leading-relaxed">
                DhalWay uses RainbowKit for secure wallet connections. We never have access to your private keys - all transactions are signed directly from your wallet.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

