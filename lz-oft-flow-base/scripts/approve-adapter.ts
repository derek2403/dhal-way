import { ethers } from 'hardhat'
import { IERC20__factory } from '@layerzerolabs/oft-evm'

/**
 * Helper script to approve the OFT Adapter to spend your ERC20 tokens (USDC)
 * Run this before sending tokens through the adapter
 * 
 * Usage:
 * npx hardhat run scripts/approve-adapter.ts --network base-sepolia
 */

async function main() {
    const [signer] = await ethers.getSigners()
    
    // Load the actual deployed address from deployments
    const hre = require('hardhat')
    const oftAdapterAddress = (await hre.deployments.get('MyOFTAdapter')).address
    
    // Load token address from network config
    const tokenAddress = hre.network.config.oftAdapter?.tokenAddress
    
    if (!tokenAddress || tokenAddress === '0xYourTokenAddressHere') {
        console.error('❌ Error: Token address not configured in hardhat.config.ts')
        console.log('Please set TOKEN_ADDRESS in your .env file or update hardhat.config.ts')
        process.exit(1)
    }
    
    // Connect to the token contract
    const token = IERC20__factory.connect(tokenAddress, signer)
    
    console.log('═══════════════════════════════════════════')
    console.log('🔓 Approving OFT Adapter to spend tokens')
    console.log('═══════════════════════════════════════════')
    console.log('Your address:', signer.address)
    console.log('Token:', tokenAddress)
    console.log('Adapter:', oftAdapterAddress)
    console.log('Network:', hre.network.name)
    console.log('')
    
    // Check current balance
    const balance = await token.balanceOf(signer.address)
    console.log('Your token balance:', ethers.utils.formatUnits(balance, 6), 'USDC')
    
    if (balance.eq(0)) {
        console.warn('⚠️  Warning: You have 0 tokens. Make sure to get some USDC before bridging.')
    }
    
    // Check current allowance
    const currentAllowance = await token.allowance(signer.address, oftAdapterAddress)
    console.log('Current allowance:', ethers.utils.formatUnits(currentAllowance, 6), 'USDC')
    console.log('')
    
    // Approve maximum amount (for testing purposes)
    // In production, you might want to approve only specific amounts
    const maxApproval = ethers.constants.MaxUint256
    
    console.log('🔄 Sending approval transaction...')
    console.log('Amount: MAX (unlimited approval)')
    console.log('')
    
    const tx = await token.approve(oftAdapterAddress, maxApproval)
    console.log('Transaction hash:', tx.hash)
    console.log('⏳ Waiting for confirmation...')
    
    await tx.wait()
    
    console.log('')
    console.log('✅ Approval successful!')
    console.log('═══════════════════════════════════════════')
    
    // Check new allowance
    const newAllowance = await token.allowance(signer.address, oftAdapterAddress)
    console.log('New allowance:', ethers.utils.formatUnits(newAllowance, 6), 'USDC')
    console.log('')
    console.log('📝 Next steps:')
    console.log('1. Bridge your USDC to Arbitrum Sepolia:')
    console.log('')
    console.log('   npx hardhat lz:oft:send \\')
    console.log('     --src-eid 40245 \\')
    console.log('     --dst-eid 40231 \\')
    console.log('     --amount 10 \\')
    console.log('     --to 0xYourRecipientAddress')
    console.log('')
    console.log('2. Track your transaction on LayerZero Scan:')
    console.log('   https://layerzeroscan.com/')
    console.log('═══════════════════════════════════════════')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
