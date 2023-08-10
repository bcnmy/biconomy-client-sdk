import { ChainId } from '@biconomy/core-types'

// will always be latest entrypoint address
export const DEFAULT_ENTRYPOINT_ADDRESS = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'

export const DEFAULT_ECDSA_OWNERSHIP_MODULE = '0xd9cf3caaa21db25f16ad6db43eb9932ab77c8e76'

// similarly others here or in module / signer classes

export const ERC20_ABI = [
  'function transfer(address to, uint256 value) external returns (bool)',
  'function transferFrom(address from, address to, uint256 value) external returns (bool)',
  'function approve(address spender, uint256 value) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)'
]
