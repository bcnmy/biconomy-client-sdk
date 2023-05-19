import { ethers } from 'ethers'

export const DEFAULT_VERIFICATION_GAS_LIMIT = ethers.BigNumber.from(70000);
export const DEFAULT_CALL_GAS_LIMIT = ethers.BigNumber.from(35000);
export const DEFAULT_PRE_VERIFICATION_GAS = ethers.BigNumber.from(21000);