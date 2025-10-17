#!/bin/bash

# Interactive liquidity addition script
# Usage: ./add-liquidity.sh

echo "💧 Add Liquidity to SmartVault"
echo "=============================="
echo ""

# Ask for chain
echo "Select chain:"
echo "1) Arbitrum Sepolia"
echo "2) Base Sepolia"
echo "3) Flow Testnet"
echo "4) Optimism Sepolia"
echo "5) Ethereum Sepolia"
read -p "Enter choice (1-5): " chain_choice

case $chain_choice in
    1) 
        CHAIN_NAME="Arbitrum Sepolia"
        VAULT_ADDRESS="0x05fF0c6Da0a07960977D8629A748F71b6117e6ea"
        NETWORK="arbitrumSepolia"
        ;;
    2) 
        CHAIN_NAME="Base Sepolia"
        VAULT_ADDRESS="0xaeD23b0F0a11d8169a1711b37B2E07203b18F36F"
        NETWORK="baseSepolia"
        ;;
    3) 
        CHAIN_NAME="Flow Testnet"
        VAULT_ADDRESS="0xFc199a0ad172B8cAFF2a1e0cdAB022f9B62928e9"
        NETWORK="flowTestnet"
        ;;
    4) 
        CHAIN_NAME="Optimism Sepolia"
        VAULT_ADDRESS="0x5aD82749A1D56BC1F11B023f0352735ea006D238"
        NETWORK="optimismSepolia"
        ;;
    5) 
        CHAIN_NAME="Ethereum Sepolia"
        VAULT_ADDRESS="0x817F2c13bDBa44D8d7E7ae0d40f28b6DC43ED30d"
        NETWORK="sepolia"
        ;;
    *) 
        echo "Invalid choice!"; exit 1 
        ;;
esac

# Ask for USDC amount
read -p "Enter USDC amount (e.g., 30): " USDC_AMOUNT

# Ask for native amount
if [ "$chain_choice" = "3" ]; then
    read -p "Enter WFLOW amount (e.g., 0.012): " NATIVE_AMOUNT
else
    read -p "Enter WETH amount (e.g., 0.012): " NATIVE_AMOUNT
fi

echo ""
echo "Summary:"
echo "- Chain: $CHAIN_NAME"
echo "- Network: $NETWORK"
echo "- Vault: $VAULT_ADDRESS"
echo "- USDC: $USDC_AMOUNT"
echo "- Native: $NATIVE_AMOUNT"
echo ""
read -p "Continue? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Cancelled"
    exit 0
fi

echo ""
echo "🚀 Adding liquidity..."
echo ""

# Run the script
export VAULT=$VAULT_ADDRESS
export USDC=$USDC_AMOUNT  
export NATIVE=$NATIVE_AMOUNT
npm run liquidity -- --network $NETWORK

echo ""
echo "✅ Done!"

