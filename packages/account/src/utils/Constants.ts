import { ChainId } from '@biconomy/core-types'

export const epAddresses = {
    'V0_0_5': '0x27a4Db290B89AE3373ce4313cBEaE72112Ae7Da9',
    'V0_0_6': '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    default: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
}

export const factoryAddresses = {
    'V2_0_0': '0x000000F9eE1842Bb72F6BBDD75E6D3d4e3e9594C',
    default: '0x000000F9eE1842Bb72F6BBDD75E6D3d4e3e9594C'
}


export const EIP1559_UNSUPPORTED_NETWORKS: Array<ChainId> = [97, 56, 1442, 1101]