export const DEFAULT_ENTRYPOINT_ADDRESS = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'
export const DEFAULT_ECDSA_OWNERSHIP_MODULE = '0xd9cf3caaa21db25f16ad6db43eb9932ab77c8e76'
export const DEFAULT_SESSION_KEY_MODULE = '0x0000000000000000000000000000000000000000'

export const ENTRYPOINT_ADDRESSES = {
  '0x27a4db290b89ae3373ce4313cbeae72112ae7da9': 'V0_0_5',
  '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789': 'V0_0_6'
}

// similarly others here or in module / signer classes
// Mapping / Reverse mapping of version -> module address can be kept here

export const ERC20_ABI = [
  'function transfer(address to, uint256 value) external returns (bool)',
  'function transferFrom(address from, address to, uint256 value) external returns (bool)',
  'function approve(address spender, uint256 value) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)'
]
