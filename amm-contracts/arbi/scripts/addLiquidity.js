const hre = require("hardhat");

async function main() {
  console.log("💧 Adding Liquidity to SimplePair...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // ⚠️ UPDATE THIS with your deployed SimplePair address!
  const PAIR_ADDRESS = process.env.PAIR_ADDRESS || "0x0D53281E8003082e7911ce4ac76ee6327A733B9b";
  
  const USDC = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
  const WETH = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";

  // Amounts to add
  const USDC_AMOUNT = hre.ethers.parseUnits("30", 6); // 30 USDC
  
  // Calculate WETH needed based on ETH price
  // 1 ETH = $2500, so 30 USDC = 30/2500 = 0.012 ETH
  const ETH_PRICE = 2500;
  const wethNeeded = 30 / ETH_PRICE; // 0.012 ETH
  const WETH_AMOUNT = hre.ethers.parseUnits(wethNeeded.toString(), 18);

  console.log("Adding liquidity:");
  console.log("- USDC:", hre.ethers.formatUnits(USDC_AMOUNT, 6));
  console.log("- WETH:", hre.ethers.formatUnits(WETH_AMOUNT, 18), `(at $${ETH_PRICE}/ETH)`);
  console.log("");

  // Get contract instances
  const pair = await hre.ethers.getContractAt("SimplePair", PAIR_ADDRESS);
  const usdc = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", USDC);
  const weth = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", WETH);

  // Check balances
  const usdcBalance = await usdc.balanceOf(deployer.address);
  const wethBalance = await weth.balanceOf(deployer.address);
  
  console.log("Your balances:");
  console.log("- USDC:", hre.ethers.formatUnits(usdcBalance, 6));
  console.log("- WETH:", hre.ethers.formatUnits(wethBalance, 18));
  console.log("");

  if (usdcBalance < USDC_AMOUNT) {
    console.log("❌ Insufficient USDC balance!");
    console.log(`Need: ${hre.ethers.formatUnits(USDC_AMOUNT, 6)} USDC`);
    console.log(`Have: ${hre.ethers.formatUnits(usdcBalance, 6)} USDC`);
    console.log("Get USDC from faucet or bridge from Ethereum Sepolia");
    return;
  }

  // Always wrap ETH to get WETH (simpler than checking balance)
  console.log("💫 Wrapping ETH to WETH...");
  const ethBalance = await deployer.provider.getBalance(deployer.address);
  
  if (ethBalance < WETH_AMOUNT) {
    console.log("❌ Insufficient ETH to wrap!");
    console.log(`Need: ${hre.ethers.formatUnits(WETH_AMOUNT, 18)} ETH`);
    console.log(`Have: ${hre.ethers.formatUnits(ethBalance, 18)} ETH`);
    return;
  }
  
  const wethContract = await hre.ethers.getContractAt(
    ["function deposit() payable"],
    WETH
  );
  const wrapTx = await wethContract.deposit({ value: WETH_AMOUNT });
  await wrapTx.wait();
  console.log(`✅ Wrapped ${hre.ethers.formatUnits(WETH_AMOUNT, 18)} ETH to WETH`);
  console.log("");

  // Approve pair to spend tokens
  console.log("Approving tokens...");
  const approveTx0 = await usdc.approve(PAIR_ADDRESS, USDC_AMOUNT);
  await approveTx0.wait();
  console.log("✅ USDC approved");

  const approveTx1 = await weth.approve(PAIR_ADDRESS, WETH_AMOUNT);
  await approveTx1.wait();
  console.log("✅ WETH approved");
  console.log("");

  // Add liquidity
  console.log("Adding liquidity...");
  const tx = await pair.addLiquidity(USDC_AMOUNT, WETH_AMOUNT);
  console.log("Transaction hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Liquidity added!");
  console.log("");

  // Check reserves
  const reserves = await pair.getReserves();
  console.log("Pool Reserves:");
  console.log("- USDC:", hre.ethers.formatUnits(reserves[0], 6));
  console.log("- WETH:", hre.ethers.formatUnits(reserves[1], 18));
  console.log("");
  console.log("🎉 Pool is ready for swaps!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

