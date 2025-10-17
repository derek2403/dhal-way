/**
 * Burn WAY on Base to get USDC
 * 
 * Run this AFTER receiving WAY from Flow
 * 
 * Usage:
 * npx hardhat run scripts/burnOnBase.ts --network base-sepolia
 */

import hre from 'hardhat'
const { formatUnits, parseUnits } = hre.ethers.utils

async function main() {
    console.log('🔥 Burning WAY on Base to get USDC\n')

    const [signer] = await hre.ethers.getSigners()
    console.log('Using account:', signer.address)
    console.log('')

    // Get deployed WAYToken on Base
    const wayDeployment = await hre.deployments.get('WAYToken')
    const wayAddress = wayDeployment.address
    const wayToken = await hre.ethers.getContractAt('WAYToken', wayAddress)
    console.log('WAYToken (Base):', wayAddress)

    const usdcAddress = await wayToken.usdc()
    const usdc = await hre.ethers.getContractAt('IERC20', usdcAddress)
    console.log('USDC (Base):', usdcAddress)
    console.log('')

    // Check balances before
    const wayBalance = await wayToken.balanceOf(signer.address)
    const usdcBalanceBefore = await usdc.balanceOf(signer.address)
    
    console.log('Your balances on Base:')
    console.log('- WAY:', formatUnits(wayBalance, 6)) // WAY has 6 decimals like USDC!
    console.log('- USDC:', formatUnits(usdcBalanceBefore, 6))
    console.log('')

    if (wayBalance === 0n) {
        console.log('❌ No WAY tokens on Base!')
        console.log('Did the bridge from Flow complete?')
        console.log('Check LayerZero Scan for delivery status')
        return
    }

    // Burn all WAY (or 10 if you have more)
    const burnAmount = wayBalance < parseUnits('10', 6) 
        ? wayBalance 
        : parseUnits('10', 6)

    console.log(`Burning ${formatUnits(burnAmount, 6)} WAY...`)
    const burnTx = await wayToken.burn(signer.address, burnAmount)
    console.log('Transaction hash:', burnTx.hash)
    await burnTx.wait()
    console.log('✅ Burned!')
    console.log('')

    // Check balances after
    const wayBalanceAfter = await wayToken.balanceOf(signer.address)
    const usdcBalanceAfter = await usdc.balanceOf(signer.address)

    console.log('Final balances on Base:')
    console.log('- WAY:', formatUnits(wayBalanceAfter, 6)) // WAY has 6 decimals!
    console.log('- USDC:', formatUnits(usdcBalanceAfter, 6))
    console.log('')

    const usdcReceived = usdcBalanceAfter - usdcBalanceBefore
    console.log('🎉 Complete!')
    console.log(`✅ Received ${formatUnits(usdcReceived, 6)} USDC on Base!`)
    console.log('')
    console.log('════════════════════════════════════════════════════')
    console.log('Full Flow Success:')
    console.log('✅ 10 USDC on Flow → 10 WAY on Flow')
    console.log('✅ 10 WAY on Flow → 10 WAY on Base (bridged)')
    console.log('✅ 10 WAY on Base → 10 USDC on Base')
    console.log('════════════════════════════════════════════════════')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })

