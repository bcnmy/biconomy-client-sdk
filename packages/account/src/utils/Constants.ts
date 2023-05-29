import { ethers } from 'ethers'
import { ChainId } from '@biconomy/core-types'

export const DEFAULT_VERIFICATION_GAS_LIMIT = ethers.BigNumber.from(300000)
export const DEFAULT_CALL_GAS_LIMIT = ethers.BigNumber.from(60000)
export const DEFAULT_PRE_VERIFICATION_GAS = ethers.BigNumber.from(21000)

export const EIP1559_UNSUPPORTED_NETWORKS: Array<ChainId> = [97, 56, 1442, 1101]
