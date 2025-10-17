import React from 'react'
import { Pie } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import { PieChart, Target, RotateCcw, QrCode } from 'lucide-react'

// PortfolioChart component - displays payment preferences as a pie chart
// Allows user to generate QR codes and reset preferences
const PortfolioChart = ({ 
  totalAllocation, 
  chartData, 
  chartOptions, 
  generateQRCode, 
  generateDetailedQRCode,
  resetSelection, 
  selectedChains 
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

