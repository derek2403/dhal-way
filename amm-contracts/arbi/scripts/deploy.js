const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SimplePair to Arbitrum Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await deployer.provider.getBalance(deployer.address);
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Arbitrum Sepolia token addresses
  const USDC = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
  const WETH = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";

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
  console.log("1. Add liquidity to the pool:");
  console.log(`   npx hardhat run scripts/addLiquidity.js --network arbitrumSepolia`);
  console.log("");
  console.log("2. Test a swap:");
  console.log(`   npx hardhat run scripts/testSwap.js --network arbitrumSepolia`);
  console.log("");
  console.log("3. Update your frontend with pool address:");
  console.log(`   const POOL_ADDRESS = "${pairAddress}";`);
  console.log("─────────────────────────────────────────────────");
  console.log("");
  console.log("💾 Save this address:", pairAddress);
  console.log("");
  console.log("📝 Add to .env file:");
  console.log(`   PAIR_ADDRESS=${pairAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

