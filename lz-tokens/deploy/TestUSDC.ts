import assert from 'assert'
import { type DeployFunction } from 'hardhat-deploy/types'

const contractName = 'TestUSDC'

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre

    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')

    // Only deploy on Flow testnet
    if (hre.network.name !== 'flow-testnet') {
        console.log(`Skipping TestUSDC on ${hre.network.name}`)
        return
    }

    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer}`)

    const { address } = await deploy(contractName, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    console.log(`✅ TestUSDC deployed on Flow: ${address}`)
    console.log(`📝 Update hardhat.config.ts:`)
    console.log(`   usdcAddress: '${address}'`)
}

deploy.tags = [contractName]

export default deploy

