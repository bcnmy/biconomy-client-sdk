import { BigNumberish, ethers } from 'ethers'

export const ENTRYPOINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'

export const ERC20_ABI = [
  'function transfer(address to, uint256 value) external returns (bool)',
  'function transferFrom(address from, address to, uint256 value) external returns (bool)',
  'function approve(address spender, uint256 value) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)'
]

export const USDC_ADDRESS: { [key: number]: string } = {
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
}

export const ERC20_APPROVAL_AMOUNT: { [key: string]: BigNumberish } = {
  // Polygon
  [USDC_ADDRESS[137]]: ethers.utils.parseUnits('10') // todo: check decimals
}
