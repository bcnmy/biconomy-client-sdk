import { ModuleVersion } from './Types'

export const DEFAULT_MODULE_VERSION: ModuleVersion = 'V1_0_0'

export const DEFAULT_ENTRYPOINT_ADDRESS = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'
export const ENTRYPOINT_ADDRESSES = {
  '0x27a4db290b89ae3373ce4313cbeae72112ae7da9': 'V0_0_5',
  '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789': 'V0_0_6'
}

export const ENTRYPOINT_ADDRESSES_BY_VERSION = {
  V0_0_5: '0x27a4db290b89ae3373ce4313cbeae72112ae7da9',
  V0_0_6: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'
}

export const DEFAULT_ECDSA_OWNERSHIP_MODULE = '0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e'

export const ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION = {
  V1_0_0: '0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e'
  // 'V1_0_1' : '0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e'
  // and so on
}

export const DEFAULT_SESSION_KEY_MANAGER_MODULE = '0x000000456b395c4e107e0302553B90D1eF4a32e9'

export const SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION = {
  V1_0_0: '0x000000456b395c4e107e0302553B90D1eF4a32e9'
  // 'V1_0_1' : '0x000000456b395c4e107e0302553B90D1eF4a32e9'
  // and so on
}

export const DEFAULT_MULTICHAIN_MODULE = '0x000000824dc138db84FD9109fc154bdad332Aa8E'

export const MULTICHAIN_VALIDATION_MODULE_ADDRESSES_BY_VERSION = {
  V1_0_0: '0x000000824dc138db84FD9109fc154bdad332Aa8E'
  // 'V1_0_1' : '0x000000824dc138db84FD9109fc154bdad332Aa8E'
  // and so on
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
