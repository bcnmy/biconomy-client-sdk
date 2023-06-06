import { ChainId } from '@biconomy/core-types'
import { EntrypointAddresses, BiconomyFactories, BiconomyImplementation } from './Types'

export const ENTRYPOINT_ADDRESSES: EntrypointAddresses = {
    '0x27a4Db290B89AE3373ce4313cBEaE72112Ae7Da9': 'V0_0_5',
    '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789': 'V0_0_6',
    default: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' // will always be latest { ENTRYPOINT_ADDRESSES }
}

export const BICONOMY_FACTORY_ADDRESSES: BiconomyFactories = {
    '0x000000F9eE1842Bb72F6BBDD75E6D3d4e3e9594C': 'V1_0_0',
    default: '0x000000F9eE1842Bb72F6BBDD75E6D3d4e3e9594C' // will always be latest { BICONOMY_FACTORY_ADDRESSES }
}

export const BICONOMY_IMPLEMENTATION_ADDRESSES: BiconomyImplementation = {
    '0x00006b7e42e01957da540dc6a8f7c30c4d816af5': 'V1_0_0',
    default: '0x00006b7e42e01957da540dc6a8f7c30c4d816af5' // will always be latest { BICONOMY_IMPLEMENTATION_ADDRESSES }
}


export const EIP1559_UNSUPPORTED_NETWORKS: Array<ChainId> = [97, 56, 1442, 1101]
