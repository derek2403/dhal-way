const hre = require("hardhat");

// Token addresses (same as deployAll.js)
const TOKENS = {
  arbitrumSepolia: { usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', weth: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73' },
  baseSepolia: { usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', weth: '0x4200000000000000000000000000000000000006' },
  sepolia: { usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', weth: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' },
  optimismSepolia: { weth: '0x4200000000000000000000000000000000000006', usdc: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7' },
  flowTestnet: { usdc: '0x356ED74eE51e4aa5f1Ce9B51329fecEF728621bc', weth: '0xd3bF53DAC106A0290B0483EcBC89d40FcC961f3e' },
};

async function main() {
  console.log("💧 Adding Liquidity to SmartVault\n");

  const [deployer] = await hre.ethers.getSigners();
  
  const VAULT = process.env.VAULT || "PASTE_VAULT_ADDRESS";
  const tokens = TOKENS[hre.network.name];
  
  // Get amounts from command line or use defaults
  const usdcAmount = process.env.USDC || "30"; // Default 30 USDC
  const nativeAmount = process.env.NATIVE || process.env.WETH || process.env.WFLOW || "0.012"; // Default 0.012
  
  const USDC_AMOUNT = hre.ethers.parseUnits(usdcAmount, 6);
  const NATIVE_AMOUNT = hre.ethers.parseUnits(nativeAmount, 18);
  
  const isFlow = hre.network.name === 'flowTestnet';
  const nativeSymbol = isFlow ? 'WFLOW' : 'WETH';

  console.log("Network:", hre.network.name);
  console.log("Vault:", VAULT);
  console.log("Adding liquidity:");
  console.log("- USDC:", hre.ethers.formatUnits(USDC_AMOUNT, 6));
  console.log(`- ${nativeSymbol}:`, hre.ethers.formatUnits(NATIVE_AMOUNT, 18));
  console.log("");

  const ERC20_ABI = ["function balanceOf(address) view returns (uint256)", "function approve(address, uint256) returns (bool)"];
  const VAULT_ABI = ["function addLiquidity(uint256, uint256)"];

  const vault = new hre.ethers.Contract(VAULT, VAULT_ABI, deployer);
  const usdc = new hre.ethers.Contract(tokens.usdc, ERC20_ABI, deployer);
  const wrappedNative = new hre.ethers.Contract(tokens.weth, ERC20_ABI, deployer);

  // Wrap native token (ETH or FLOW)
  console.log(`💫 Wrapping ${isFlow ? 'FLOW' : 'ETH'} to ${nativeSymbol}...`);
  const wrapContract = new hre.ethers.Contract(tokens.weth, ["function deposit() payable"], deployer);
  const wrapTx = await wrapContract.deposit({ value: NATIVE_AMOUNT });
  await wrapTx.wait();
  console.log("✅ Wrapped");

  // Approve
  console.log("Approving tokens...");
  await (await usdc.approve(VAULT, USDC_AMOUNT)).wait();
  await (await wrappedNative.approve(VAULT, NATIVE_AMOUNT)).wait();
  console.log("✅ Approved");

  // Add liquidity (handle token order based on addresses)
  console.log("Adding liquidity...");
  
  // Determine correct order: token0 is the lower address
  let amount0, amount1;
  if (tokens.usdc < tokens.weth) {
    // USDC is token0
    amount0 = USDC_AMOUNT;
    amount1 = NATIVE_AMOUNT;
  } else {
    // WETH is token0 (like on Optimism)
    amount0 = NATIVE_AMOUNT;
    amount1 = USDC_AMOUNT;
  }
  
  console.log(`Order: token0=${amount0}, token1=${amount1}`);
  const tx = await vault.addLiquidity(amount0, amount1);
  await tx.wait();
  
  console.log("✅ Liquidity added!");
  console.log(`🎉 SmartVault ready on ${hre.network.name}!`);
  console.log(`   Pool: 30 USDC / 0.012 ${nativeSymbol}`);
}

main().then(() => process.exit(0)).catch(console.error);

