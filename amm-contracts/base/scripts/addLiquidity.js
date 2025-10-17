const hre = require("hardhat");

async function main() {
  console.log("💧 Adding Liquidity to SimplePair on Base Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  const PAIR_ADDRESS = process.env.PAIR_ADDRESS || "0x6202F3a11109CC62eb9dad8A7b01A9ea3F239d1f";
  const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const WETH = "0x4200000000000000000000000000000000000006";

  // 30 USDC + equivalent WETH
  const USDC_AMOUNT = hre.ethers.parseUnits("29", 6);
  const ETH_PRICE = 2500;
  const wethNeeded = 29 / ETH_PRICE;
  const WETH_AMOUNT = hre.ethers.parseUnits(wethNeeded.toString(), 18);

  console.log("Adding liquidity:");
  console.log("- USDC:", hre.ethers.formatUnits(USDC_AMOUNT, 6));
  console.log("- WETH:", hre.ethers.formatUnits(WETH_AMOUNT, 18), `(at $${ETH_PRICE}/ETH)`);
  console.log("");

  // ABIs
  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address, uint256) returns (bool)",
    "function transfer(address, uint256) returns (bool)"
  ];

  const PAIR_ABI = [
    "function addLiquidity(uint256 amount0, uint256 amount1)",
    "function getReserves() view returns (uint256, uint256)"
  ];

  const pair = new hre.ethers.Contract(PAIR_ADDRESS, PAIR_ABI, deployer);
  const usdc = new hre.ethers.Contract(USDC, ERC20_ABI, deployer);
  const weth = new hre.ethers.Contract(WETH, ERC20_ABI, deployer);

  const usdcBalance = await usdc.balanceOf(deployer.address);
  
  console.log("Your USDC balance:", hre.ethers.formatUnits(usdcBalance, 6));

  if (usdcBalance < USDC_AMOUNT) {
    console.log("❌ Insufficient USDC!");
    return;
  }

  console.log("💫 Wrapping ETH to WETH...");
  const wethWrapABI = ["function deposit() payable"];
  const wethWrap = new hre.ethers.Contract(WETH, wethWrapABI, deployer);
  const wrapTx = await wethWrap.deposit({ value: WETH_AMOUNT });
  await wrapTx.wait();
  console.log(`✅ Wrapped ${hre.ethers.formatUnits(WETH_AMOUNT, 18)} ETH to WETH`);
  console.log("");

  console.log("Approving tokens...");
  const approveTx0 = await usdc.approve(PAIR_ADDRESS, USDC_AMOUNT);
  await approveTx0.wait();
  console.log("✅ USDC approved");

  const approveTx1 = await weth.approve(PAIR_ADDRESS, WETH_AMOUNT);
  await approveTx1.wait();
  console.log("✅ WETH approved");
  console.log("");

  console.log("Adding liquidity...");
  const tx = await pair.addLiquidity(USDC_AMOUNT, WETH_AMOUNT);
  await tx.wait();
  console.log("✅ Liquidity added!");
  console.log("");

  const reserves = await pair.getReserves();
  console.log("Pool Reserves:");
  console.log("- USDC:", hre.ethers.formatUnits(reserves[0], 6));
  console.log("- WETH:", hre.ethers.formatUnits(reserves[1], 18));
  console.log("");
  console.log("🎉 Pool ready on Base Sepolia!");
}

main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });

