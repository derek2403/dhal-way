const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SimplePair to Base Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await deployer.provider.getBalance(deployer.address);
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Base Sepolia token addresses
  const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const WETH = "0x4200000000000000000000000000000000000006";

  // Sort addresses (token0 should be lower)
  const token0 = USDC < WETH ? USDC : WETH;
  const token1 = USDC < WETH ? WETH : USDC;

  console.log("Token0 (USDC):", token0);
  console.log("Token1 (WETH):", token1);
  console.log("");

  // Deploy SimplePair
  const SimplePair = await hre.ethers.getContractFactory("SimplePair");
  const pair = await SimplePair.deploy(token0, token1);
  await pair.waitForDeployment();
  
  const pairAddress = await pair.getAddress();

  console.log("✅ SimplePair deployed to:", pairAddress);
  console.log("");

  console.log("📋 Next Steps:");
  console.log("─────────────────────────────────────────────────");
  console.log("1. Add liquidity:");
  console.log(`   npm run add-liquidity`);
  console.log("");
  console.log("2. Test swap:");
  console.log(`   npm run test-swap`);
  console.log("─────────────────────────────────────────────────");
  console.log("");
  console.log("💾 Save this address:", pairAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

