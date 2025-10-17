import assert from 'assert'
import { type DeployFunction } from 'hardhat-deploy/types'

const contractName = 'WAYToken'

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre

    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')

    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer}`)

    // Get LayerZero Endpoint V2 for this chain
    const endpointV2Deployment = await hre.deployments.get('EndpointV2')

    // Get USDC address for this chain from network config
    const usdcAddress = (hre.network.config as any).usdcAddress
    
    if (!usdcAddress) {
        console.error(`❌ USDC address not configured for ${hre.network.name}`)
        console.log('Add usdcAddress to network config in hardhat.config.ts')
        return
    }

    console.log(`USDC address: ${usdcAddress}`)

    // Deploy WAYToken
    const { address } = await deploy(contractName, {
        from: deployer,
        args: [
            'WAY',                    // name
            'WAY',                          // symbol
            usdcAddress,                    // USDC address on this chain
            endpointV2Deployment.address,   // LayerZero's EndpointV2 address
            deployer,                       // owner/delegate
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    console.log(`✅ Deployed WAYToken on ${hre.network.name}: ${address}`)
    console.log(`   Backed by USDC: ${usdcAddress}`)
}

deploy.tags = [contractName]

export default deploy

