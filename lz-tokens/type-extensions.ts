import 'hardhat/types/config'
import 'hardhat/types/runtime'

declare module 'hardhat/types/config' {
    export interface HttpNetworkUserConfig {
        usdcAddress?: string
    }

    export interface HardhatNetworkUserConfig {
        usdcAddress?: string
    }
}

declare module 'hardhat/types/runtime' {
    export interface HttpNetworkConfig {
        usdcAddress?: string
    }

    export interface HardhatNetworkConfig {
        usdcAddress?: string
    }
}
