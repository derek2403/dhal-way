/**
 * Deposit USDC reserves to WAYToken
 * 
 * Each chain's WAYToken needs USDC reserves to handle burns!
 * 
 * Usage:
 * AMOUNT=100 npx hardhat run scripts/depositReserves.ts --network optimism-sepolia
 */

import hre from 'hardhat'
const { formatUnits, parseUnits } = hre.ethers.utils

async function main() {
    const amount = process.env.AMOUNT || '100'; // Default 100 USDC
    
    console.log(`💰 Depositing ${amount} USDC reserves to WAYToken`);
    console.log('═'.repeat(60));
    console.log('Network:', hre.network.name);
    console.log('');

    const [signer] = await hre.ethers.getSigners();
    console.log('Account:', signer.address);
    console.log('');

    // Get WAYToken
    const wayDeployment = await hre.deployments.get('WAYToken');
    const wayToken = await hre.ethers.getContractAt('WAYToken', wayDeployment.address);
    
    const usdcAddress = await wayToken.usdc();
    const usdc = await hre.ethers.getContractAt('IERC20', usdcAddress);

    console.log('WAYToken:', wayDeployment.address);
    console.log('USDC:', usdcAddress);
    console.log('');

    // Check balances
    const usdcBalance = await usdc.balanceOf(signer.address);
    const currentReserves = await wayToken.totalReserves();
    
    console.log('Current state:');
    console.log('- Your USDC:', formatUnits(usdcBalance, 6));
    console.log('- WAY reserves:', formatUnits(currentReserves, 6), 'USDC');
    console.log('');

    const depositAmount = parseUnits(amount, 6);

    if (usdcBalance < depositAmount) {
        console.log('❌ Insufficient USDC!');
        console.log(`Need: ${amount} USDC`);
        console.log(`Have: ${formatUnits(usdcBalance, 6)} USDC`);
        return;
    }

    // Approve
    console.log(`Approving ${amount} USDC...`);
    const approveTx = await usdc.approve(wayDeployment.address, depositAmount);
    await approveTx.wait();
    console.log('✅ Approved');
    console.log('');

    // Deposit
    console.log(`Depositing ${amount} USDC as reserves...`);
    const depositTx = await wayToken.depositReserves(depositAmount);
    console.log('Transaction:', depositTx.hash);
    await depositTx.wait();
    console.log('✅ Deposited!');
    console.log('');

    // Check final reserves
    const finalReserves = await wayToken.totalReserves();
    console.log('Final reserves:', formatUnits(finalReserves, 6), 'USDC');
    console.log('');
    console.log('═'.repeat(60));
    console.log(`✅ WAYToken on ${hre.network.name} now has reserves!`);
    console.log('   Can now handle burns and settlements ✅');
    console.log('═'.repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

