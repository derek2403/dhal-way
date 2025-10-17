/**
 * Complete Test: 10 USDC on Flow → 10 USDC on Base
 * 
 * Flow:
 * 1. Mint 10 WAY on Flow (locks 10 USDC)
 * 2. Bridge 10 WAY from Flow to Base
 * 3. Burn 10 WAY on Base (get 10 USDC)
 * 
 * Usage:
 * npx hardhat run scripts/testFlowToBase.ts --network flow-testnet
 */

import hre from 'hardhat'
const { formatUnits, parseUnits, hexZeroPad } = hre.ethers.utils
const { BigNumber } = hre.ethers

async function main() {
    console.log('🚀 Complete Test: 10 USDC Flow → 10 USDC Base\n')
    console.log('════════════════════════════════════════════════════\n')

    const [signer] = await hre.ethers.getSigners()
    console.log('Using account:', signer.address)
    console.log('')

    // ════════════════════════════════════════════════════════════
    // STEP 1: Mint WAY on Flow (Lock USDC)
    // ════════════════════════════════════════════════════════════
    
    console.log('Step 1: Mint 10 WAY on Flow')
    console.log('───────────────────────────────────────────────────')

    const wayDeployment = await hre.deployments.get('WAYToken')
    const wayAddressFlow = wayDeployment.address
    const wayTokenFlow = await hre.ethers.getContractAt('WAYToken', wayAddressFlow)
    console.log('WAYToken (Flow):', wayAddressFlow)

    const usdcAddressFlow = await wayTokenFlow.usdc()
    const usdcFlow = await hre.ethers.getContractAt('IERC20', usdcAddressFlow)
    console.log('USDC (Flow):', usdcAddressFlow)
    console.log('')

    // Check Flow USDC balance
    const usdcBalanceFlow = await usdcFlow.balanceOf(signer.address)
    console.log('Your USDC on Flow:', formatUnits(usdcBalanceFlow, 6))

    const mintAmount = parseUnits('10', 6) // 10 USDC

    if (usdcBalanceFlow < mintAmount) {
        console.log('❌ Insufficient USDC on Flow!')
        console.log('Need: 10 USDC')
        return
    }

    // Approve USDC
    console.log('Approving USDC...')
    const approveTx = await usdcFlow.approve(wayAddressFlow, mintAmount)
    await approveTx.wait()
    console.log('✅ Approved')

    // Mint WAY
    console.log('Minting 10 WAY...')
    const mintTx = await wayTokenFlow.mint(signer.address, mintAmount)
    await mintTx.wait()
    console.log('✅ Minted 10 WAY on Flow!')
    
    const wayBalanceFlow = await wayTokenFlow.balanceOf(signer.address)
    console.log('Your WAY on Flow:', formatUnits(wayBalanceFlow, 6)) // WAY has 6 decimals like USDC!
    console.log('')

    // ════════════════════════════════════════════════════════════
    // STEP 2: Bridge 10 WAY from Flow to Base
    // ════════════════════════════════════════════════════════════
    
    console.log('Step 2: Bridge 10 WAY from Flow to Base')
    console.log('───────────────────────────────────────────────────')

    const BASE_EID = 40245 // Base Sepolia endpoint ID

    // Build send parameters
    const sendParam = {
        dstEid: BASE_EID,
        to: hexZeroPad(signer.address, 32), // bytes32 format
        amountLD: mintAmount,
        minAmountLD: mintAmount, // No slippage for exact amount
        extraOptions: '0x',
        composeMsg: '0x',
        oftCmd: '0x',
    }

    // Get quote for LayerZero fee
    console.log('Getting LayerZero fee quote...')
    const feeQuote = await wayTokenFlow.quoteSend(sendParam, false)
    console.log('LayerZero fee:', formatUnits(feeQuote.nativeFee, 18), 'FLOW')
    console.log('')

    // Send WAY tokens
    console.log('Sending 10 WAY from Flow to Base...')
    const sendTx = await wayTokenFlow.send(
        sendParam,
        { nativeFee: feeQuote.nativeFee, lzTokenFee: 0 },
        signer.address,
        { value: feeQuote.nativeFee }
    )

    console.log('Transaction hash:', sendTx.hash)
    console.log('⏳ Waiting for confirmation...')
    await sendTx.wait()
    
    console.log('✅ Bridge transaction sent!')
    console.log('🔗 Track on LayerZero Scan:')
    console.log(`   https://testnet.layerzeroscan.com/tx/${sendTx.hash}`)
    console.log('')
    console.log('⏰ Waiting 30-60 seconds for cross-chain delivery...')
    console.log('   (You can check Base manually or wait)')
    console.log('')

    // ════════════════════════════════════════════════════════════
    // STEP 3: Instructions for Base
    // ════════════════════════════════════════════════════════════
    
    console.log('Step 3: Burn 10 WAY on Base (Manual or Scripted)')
    console.log('───────────────────────────────────────────────────')
    console.log('')
    console.log('After cross-chain delivery completes (~1 min):')
    console.log('')
    console.log('Option A: Use Frontend')
    console.log('  1. Visit http://localhost:3000/way-token-test')
    console.log('  2. Switch to Base Sepolia')
    console.log('  3. You should see 10 WAY balance')
    console.log('  4. Click "Burn WAY" → Get 10 USDC on Base ✅')
    console.log('')
    console.log('Option B: Run burn script')
    console.log('  npx hardhat run scripts/burnOnBase.ts --network base-sepolia')
    console.log('')
    console.log('════════════════════════════════════════════════════')
    console.log('📊 Summary:')
    console.log('✅ Locked 10 USDC on Flow')
    console.log('✅ Minted 10 WAY on Flow')
    console.log('🔄 Bridging 10 WAY to Base (in progress)')
    console.log('⏳ Wait for delivery, then burn on Base')
    console.log('════════════════════════════════════════════════════')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })

