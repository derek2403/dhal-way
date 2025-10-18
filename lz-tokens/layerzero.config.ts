import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools'
import { OAppEnforcedOption } from '@layerzerolabs/toolbox-hardhat'
import type { OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

/**
 * WAY Token Configuration
 * 
 * Deploy WAYToken (regular OFT) on ALL chains
 * Connect them all together via LayerZero
 * 
 * NO OFT Adapter needed!
 * Each WAYToken deployment holds its own USDC reserves
 */

const arbitrumContract: OmniPointHardhat = {
    eid: EndpointId.ARBSEP_V2_TESTNET,
    contractName: 'WAYToken',
}

const baseContract: OmniPointHardhat = {
    eid: EndpointId.BASESEP_V2_TESTNET,
    contractName: 'WAYToken',
}

const sepoliaContract: OmniPointHardhat = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'WAYToken',
}

const optimismContract: OmniPointHardhat = {
    eid: EndpointId.OPTSEP_V2_TESTNET,
    contractName: 'WAYToken',
}

// Optional: Add Flow EVM when you have USDC address
const flowContract: OmniPointHardhat = {
     eid: EndpointId.FLOW_V2_TESTNET,
     contractName: 'WAYToken',
}

// Enforced options for OFT transfers
const EVM_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1, // SEND type
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 80000,
        value: 0,
    },
]

/**
 * Pathways: Connect all chains to each other
 * 
 * With TwoWayConfig, declaring [A, B] automatically creates:
 * - A → B pathway
 * - B → A pathway
 * 
 * So we need to declare each unique pair once
 */
const pathways: TwoWayConfig[] = [
    // Arbitrum ↔ Base
    [
        arbitrumContract,
        baseContract,
        [['LayerZero Labs'], []], // Required DVNs
        [1, 1], // Block confirmations
        [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
    ],
    // Arbitrum ↔ Sepolia
    [
        arbitrumContract,
        sepoliaContract,
        [['LayerZero Labs'], []],
        [1, 1],
        [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
    ],
    // Arbitrum ↔ Optimism
    [
        arbitrumContract,
        optimismContract,
        [['LayerZero Labs'], []],
        [1, 1],
        [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
    ],
    // Base ↔ Sepolia
    [
        baseContract,
        sepoliaContract,
        [['LayerZero Labs'], []],
        [1, 1],
        [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
    ],
    // Base ↔ Optimism
    [
        baseContract,
        optimismContract,
        [['LayerZero Labs'], []],
        [1, 1],
        [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
    ],
    // Sepolia ↔ Optimism
    [
        sepoliaContract,
        optimismContract,
        [['LayerZero Labs'], []],
        [1, 1],
        [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
    ],
    // Add Flow connections
    [
        arbitrumContract,
        flowContract,
        [['LayerZero Labs'], []],
        [1, 1],
        [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
    ],
    [
        baseContract,
        flowContract,
        [['LayerZero Labs'], []],
        [1, 1],
        [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
    ],
    [
        sepoliaContract,
        flowContract,
        [['LayerZero Labs'], []],
        [1, 1],
        [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
    ],
    [
        optimismContract,
        flowContract,
        [['LayerZero Labs'], []],
        [1, 1],
        [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
    ],
]

export default async function () {
    const connections = await generateConnectionsConfig(pathways)
    return {
        contracts: [
            { contract: arbitrumContract },
            { contract: baseContract },
            { contract: sepoliaContract },
            { contract: optimismContract },
            { contract: flowContract },
        ],
        connections,
    }
}
