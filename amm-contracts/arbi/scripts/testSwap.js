const hre = require("hardhat");

async function main() {
  console.log("🔄 Testing Swap on SimplePair...\n");

  const [user] = await hre.ethers.getSigners();
  console.log("Testing with account:", user.address);

  // ⚠️ UPDATE THIS with your deployed SimplePair address!
  const PAIR_ADDRESS = process.env.PAIR_ADDRESS || "0x0D53281E8003082e7911ce4ac76ee6327A733B9b";
  
  const USDC = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
  const WETH = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";

  // Test swap: 0.001 WETH → USDC
  const WETH_AMOUNT = hre.ethers.parseUnits("0.001", 18);

  const pair = await hre.ethers.getContractAt("SimplePair", PAIR_ADDRESS);
  const weth = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", WETH);
  const usdc = await hre.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", USDC);

  // Check pool reserves
  const reserves = await pair.getReserves();
  console.log("Pool Reserves:");
  console.log("- USDC:", hre.ethers.formatUnits(reserves[0], 6));
  console.log("- WETH:", hre.ethers.formatUnits(reserves[1], 18));
  console.log("");

  // Get quote
  const expectedOut = await pair.getAmountOut1(WETH_AMOUNT);
  console.log("Swapping:", hre.ethers.formatUnits(WETH_AMOUNT, 18), "WETH");
  console.log("Expected to receive:", hre.ethers.formatUnits(expectedOut, 6), "USDC");
  console.log("");

  // Check WETH balance
  const wethBalance = await weth.balanceOf(user.address);
  console.log("Your WETH balance:", hre.ethers.formatUnits(wethBalance, 18));
  
  if (wethBalance < WETH_AMOUNT) {
    console.log("⚠️ Wrapping ETH to WETH...");
    const wethContract = await hre.ethers.getContractAt(
      ["function deposit() payable"],
      WETH
    );
    const wrapTx = await wethContract.deposit({ value: WETH_AMOUNT });
    await wrapTx.wait();
    console.log("✅ Wrapped!");
    console.log("");
  }

  // Approve pair
  console.log("Approving WETH...");
  const approveTx = await weth.approve(PAIR_ADDRESS, WETH_AMOUNT);
  await approveTx.wait();
  console.log("✅ Approved");
  console.log("");

  // Execute swap
  console.log("Executing swap...");
  const balanceBefore = await usdc.balanceOf(user.address);
  
  const minOut = (expectedOut * 95n) / 100n; // 5% slippage
  
  const tx = await pair.swapToken1ForToken0(WETH_AMOUNT, minOut);
  
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  
  const balanceAfter = await usdc.balanceOf(user.address);
  const received = balanceAfter - balanceBefore;
  
  console.log("✅ Swap successful!");
  console.log("Received:", hre.ethers.formatUnits(received, 6), "USDC");
  console.log("");
  console.log("🎉 Test complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

