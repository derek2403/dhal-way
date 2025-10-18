/**
 * Test Smart Account - Batch Transaction Demo
 * 
 * Shows how to batch multiple operations in ONE transaction
 * using your CDP Smart Account
 * 
 * Usage:
 * node testSmartAccount.js
 */

import { CdpClient } from "@coinbase/cdp-sdk";
import { encodeFunctionData, parseUnits } from "viem";
import dotenv from "dotenv";

dotenv.config();

// Contract addresses (Base Sepolia)
const WAY_TOKEN = '0xaFBbb476e98AD3BF169d2d4b4B85152774b16C1D';
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// ABIs
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
];

const WAY_ABI = [
  {
    name: 'mint',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  }
];

async function main() {
    console.log('⚡ Smart Account Batch Transaction Demo');
    console.log('═'.repeat(60));

    const cdp = new CdpClient();

    // Get your smart account
    const smartAccount = await cdp.evm.getAccount({
        name: "DhalwaySmartAccount"
    });

    console.log('Smart Account:', smartAccount.address);
    console.log('');

    const amount = parseUnits('0.01', 6); // 0.01 USDC

    // Prepare batch calls
    const calls = [
        {
            to: USDC,
            value: '0x0',
            data: encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [WAY_TOKEN, amount]
            })
        },
        {
            to: WAY_TOKEN,
            value: '0x0',
            data: encodeFunctionData({
                abi: WAY_ABI,
                functionName: 'mint',
                args: [smartAccount.address, amount]
            })
        }
    ];

    console.log('Batch Operations:');
    console.log('  1. Approve 0.01 USDC');
    console.log('  2. Mint 0.01 WAY');
    console.log('');
    console.log('Sending batch transaction...');

    try {
        // Send batch user operation
        const result = await cdp.evm.sendUserOperation({
            smartAccount,
            network: "base-sepolia",
            calls,
        });

        console.log('✅ Batch transaction complete!');
        console.log('  Transaction:', result.transactionHash);
        console.log('  Link: https://sepolia.basescan.org/tx/' + result.transactionHash);
        console.log('');
        console.log('🎉 Approved + Minted in ONE transaction!');
        console.log('✅ Gas sponsored (free for you!)');

    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('insufficient')) {
            console.log('');
            console.log('⚠️  Smart Account needs USDC!');
            console.log('Transfer some USDC to:', smartAccount.address);
        }
    }
}

main().catch(console.error);

