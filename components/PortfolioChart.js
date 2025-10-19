import React from 'react'
import { Pie } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import { PieChart, Target, RotateCcw, QrCode } from 'lucide-react'
import Image from 'next/image'

// PortfolioChart component - displays payment preferences as a pie chart
// Allows user to generate QR codes and reset preferences
const PortfolioChart = ({ 
  totalAllocation, 
  chartData, 
  chartOptions, 
  generateQRCode, 
  generateDetailedQRCode,
  resetSelection, 
  selectedChains,
  chains 
}) => {
  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-sm">
          <PieChart className="w-3 h-3 text-white/70" />
        </div>
        <h3 className="text-lg font-bold text-white/90">Payment Preferences</h3>
      </div>
      
      <div className="flex-1 mb-4 flex items-center justify-center">
        {totalAllocation > 0 ? (
          <Pie data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center border border-dashed border-white/20 rounded-xl bg-white/5 p-8 backdrop-blur-sm">
            <div className="text-center text-white/60 max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
                <PieChart className="w-10 h-10 text-white/40" />
              </div>
              <h3 className="text-lg font-semibold text-white/80 mb-3">Select tokens to set payment preferences</h3>
              <p className="text-sm text-white/50 leading-relaxed">Choose from available tokens on the right to specify how you want to receive payments</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Chart Legend - Shows color mapping for tokens */}
      {totalAllocation > 0 && chartData.labels && chartData.labels.length > 0 && (
        <div className="mb-3 overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/40 [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.4)_transparent]">
          <div className="flex gap-2 min-w-min">
            {chartData.labels.map((label, index) => {
              const tokenInfo = chartData.tokenInfo[index];
              const color = chartData.datasets[0].backgroundColor[index];
              const percentage = chartData.datasets[0].data[index];
              
              // Find the chain icon for this token
              const chainInfo = tokenInfo ? chains?.find(c => c.id === tokenInfo.chain) : null;
              
              return (
                <div 
                  key={`${label}-${index}`}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 flex-shrink-0"
                >
                  {/* Color indicator */}
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  
                  {/* Token icon with chain indicator - only show if not "No Preference" */}
                  {tokenInfo && tokenInfo.icon && (
                    <div className="w-5 h-5 flex-shrink-0 relative">
                      {/* Main token icon */}
                      <Image 
                        src={tokenInfo.icon} 
                        alt={tokenInfo.name}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                      {/* Chain icon badge at bottom right */}
                      {chainInfo && chainInfo.icon && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-black/80 border border-white/20 flex items-center justify-center">
                          <Image 
                            src={chainInfo.icon} 
                            alt={chainInfo.name}
                            width={10}
                            height={10}
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Token name and percentage */}
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="text-xs text-white/80 font-medium">
                      {tokenInfo ? tokenInfo.name : 'No Preference'}
                    </span>
                    <span className="text-xs text-white/60 font-medium">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-auto">
        <motion.button
          onClick={generateDetailedQRCode}
          disabled={Object.keys(selectedChains).length === 0}
          className="w-full px-6 py-3 bg-white/15 border border-white/20 text-white rounded-xl hover:bg-white/25 disabled:bg-white/5 disabled:border-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2 backdrop-blur-sm"
          whileHover={{ scale: Object.keys(selectedChains).length > 0 ? 1.02 : 1 }}
          whileTap={{ scale: Object.keys(selectedChains).length > 0 ? 0.98 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <motion.div
            animate={Object.keys(selectedChains).length > 0 ? { rotate: [0, 10, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Target className="w-4 h-4" />
          </motion.div>
          <span>Claim</span>
        </motion.button>
        <div className="flex gap-2">
          <motion.button
            onClick={generateQRCode}
            disabled={Object.keys(selectedChains).length === 0}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/15 text-white/80 rounded-xl hover:bg-white/20 hover:text-white disabled:bg-white/5 disabled:border-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-all duration-200 font-medium backdrop-blur-sm flex items-center justify-center space-x-2"
            whileHover={{ scale: Object.keys(selectedChains).length > 0 ? 1.02 : 1 }}
            whileTap={{ scale: Object.keys(selectedChains).length > 0 ? 0.98 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <QrCode className="w-4 h-4" />
            <span>Show QR</span>
          </motion.button>
          <motion.button
            onClick={resetSelection}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/15 text-white/80 rounded-xl hover:bg-white/20 hover:text-white transition-all duration-200 font-medium backdrop-blur-sm flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div
              whileHover={{ rotate: -180 }}
              transition={{ duration: 0.3 }}
            >
              <RotateCcw className="w-4 h-4" />
            </motion.div>
            <span>Reset</span>
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default PortfolioChart

