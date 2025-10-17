import 'dotenv/config'
import 'hardhat-deploy'
import '@nomiclabs/hardhat-ethers'
import '@layerzerolabs/toolbox-hardhat'
import { HardhatUserConfig, HttpNetworkAccountsUserConfig } from 'hardhat/types'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import './type-extensions'

const MNEMONIC = process.env.MNEMONIC
const PRIVATE_KEY = process.env.PRIVATE_KEY

const accounts: HttpNetworkAccountsUserConfig | undefined = MNEMONIC
    ? { mnemonic: MNEMONIC }
    : PRIVATE_KEY
      ? [PRIVATE_KEY]
      : undefined

if (accounts == null) {
    console.warn('Could not find MNEMONIC or PRIVATE_KEY. Transactions will not be possible.')
}

const config: HardhatUserConfig = {
    paths: {
        cache: 'cache/hardhat',
    },
    solidity: {
        compilers: [
            {
                version: '0.8.22',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        'arbitrum-sepolia': {
            eid: EndpointId.ARBSEP_V2_TESTNET,
            url: process.env.RPC_URL_ARB_SEPOLIA || 'https://sepolia-rollup.arbitrum.io/rpc',
            accounts,
            usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // USDC on Arbitrum Sepolia
        },
        'base-sepolia': {
            eid: EndpointId.BASESEP_V2_TESTNET,
            url: process.env.RPC_URL_BASE_SEPOLIA || 'https://sepolia.base.org',
            accounts,
            usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
        },
        'sepolia': {
            eid: EndpointId.SEPOLIA_V2_TESTNET,
            url: process.env.SEPOLIA_RPC || 'https://rpc.sepolia.org',
            accounts,
            usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC on Ethereum Sepolia
        },
        'optimism-sepolia': {
            eid: EndpointId.OPTSEP_V2_TESTNET,
            url: process.env.RPC_URL_OP_SEPOLIA || 'https://sepolia.optimism.io',
            accounts,
            usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', // USDC on OP Sepolia
        },
        'flow-testnet': {
            eid: EndpointId.FLOW_V2_TESTNET,
            url: process.env.RPC_URL_FLOW || 'https://testnet.evm.nodes.onflow.org',
            accounts,
            usdcAddress: '0x356ED74eE51e4aa5f1Ce9B51329fecEF728621bc'
        },
        hardhat: {
            allowUnlimitedContractSize: true,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
}

export default config
