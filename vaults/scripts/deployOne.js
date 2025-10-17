const hre = require("hardhat");

const TOKENS = {
  arbitrumSepolia: { usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', weth: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73' },
  baseSepolia: { usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', weth: '0x4200000000000000000000000000000000000006' },
  sepolia: { usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', weth: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' },
  optimismSepolia: { usdc: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', weth: '0x4200000000000000000000000000000000000006' },
  flowTestnet: { usdc: '0x356ED74eE51e4aa5f1Ce9B51329fecEF728621bc', weth: '0xd3bF53DAC106A0290B0483EcBC89d40FcC961f3e' },
};

async function main() {
  console.log("🚀 Deploying SmartVault\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await deployer.provider.getBalance(deployer.address);
  
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  const tokens = TOKENS[hre.network.name];
  const token0 = tokens.usdc < tokens.weth ? tokens.usdc : tokens.weth;
  const token1 = tokens.usdc < tokens.weth ? tokens.weth : tokens.usdc;

  console.log("Tokens:");
  console.log("- Token0 (USDC):", token0);
  console.log("- Token1 (WETH):", token1);
  console.log("");

  const SmartVault = await hre.ethers.getContractFactory("SmartVault");
  const vault = await SmartVault.deploy(token0, token1);
  await vault.waitForDeployment();
  
  const vaultAddress = await vault.getAddress();

  console.log("✅ SmartVault deployed:", vaultAddress);
}

main().then(() => process.exit(0)).catch(console.error);

