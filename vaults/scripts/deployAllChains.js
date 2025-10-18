/**
 * Deploy SmartVault to ALL chains in one command
 * 
 * Usage: npm run deploy-all
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const CHAINS = ['arbitrumSepolia', 'baseSepolia', 'flowTestnet', 'optimismSepolia', 'sepolia'];

async function deployToChain(chain) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Deploying to ${chain}...`);
  console.log('='.repeat(60));
  
  try {
    const { stdout, stderr } = await execPromise(`npx hardhat run scripts/deployAll.js --network ${chain}`);
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    // Extract address from output
    const match = stdout.match(/0x[a-fA-F0-9]{40}/);
    if (match) {
      return { chain, address: match[0], success: true };
    }
    return { chain, success: false, error: 'No address found' };
  } catch (error) {
    console.error(`❌ Error on ${chain}:`, error.message);
    return { chain, success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Deploying SmartVault to ALL chains\n');
  
  const results = [];
  
  for (const chain of CHAINS) {
    const result = await deployToChain(chain);
    results.push(result);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(r => {
    if (r.success) {
      console.log(`✅ ${r.chain.padEnd(20)} ${r.address}`);
    } else {
      console.log(`❌ ${r.chain.padEnd(20)} Failed: ${r.error}`);
    }
  });
  
  console.log('\n📝 Next Steps:');
  console.log('Add liquidity to each vault:');
  results.forEach(r => {
    if (r.success) {
      console.log(`VAULT=${r.address} USDC=30 NATIVE=0.012 npm run liquidity -- --network ${r.chain}`);
    }
  });
}

main().catch(console.error);

