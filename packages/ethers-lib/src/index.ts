import EthersAdapter, { EthersAdapterConfig } from './EthersAdapter'
import { IEthersTransactionOptions, IEthersTransactionResult } from './types'

export { SmartWalletContractV100__factory as SmartWalletFactoryContract100 } from '../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletContractV100__factory'
export { SmartWalletContractV101__factory as SmartWalletFactoryContract101 } from '../typechain/src/ethers-v5/v1.0.1/factories/SmartWalletContractV101__factory'

export { MultiSendContractV100__factory as MultiSendContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/MultiSendContractV100__factory'
export { MultiSendContractV101__factory as MultiSendContractV101 } from '../typechain/src/ethers-v5/v1.0.1/factories/MultiSendContractV101__factory'

export { MultiSendCallOnlyContractV100__factory as MultiSendCallOnlyContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/MultiSendCallOnlyContractV100__factory'
export { MultiSendCallOnlyContractV101__factory as MultiSendCallOnlyContractV101 } from '../typechain/src/ethers-v5/v1.0.1/factories/MultiSendCallOnlyContractV101__factory'

export { SmartWalletFactoryContractV100__factory as SmartWalletFactoryContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletFactoryContractV100__factory'
export { SmartWalletFactoryContractV101__factory as SmartWalletFactoryContractV101 } from '../typechain/src/ethers-v5/v1.0.1/factories/SmartWalletFactoryContractV101__factory'

export { EntryPointContractV100__factory as EntryPointFactoryContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/EntryPointContractV100__factory'
export { EntryPointContractV101__factory as EntryPointFactoryContractV101 } from '../typechain/src/ethers-v5/v1.0.1/factories/EntryPointContractV101__factory'

export { EntryPointContractV100 } from '../typechain/src/ethers-v5/v1.0.0/EntryPointContractV100'
export { EntryPointContractV101 } from '../typechain/src/ethers-v5/v1.0.1/EntryPointContractV101'

export { SmartWalletContractV101 } from '../typechain/src/ethers-v5/v1.0.1/SmartWalletContractV101'

import EntryPointEthersContract_v1_0_0 from './contracts/EntryPointContract/v1.0.0/EntryPointEthersContract'
import EntryPointEthersContract_v1_0_1 from './contracts/EntryPointContract/v1.0.1/EntryPointEthersContract'

export default EthersAdapter
export {
  EthersAdapterConfig,
  IEthersTransactionOptions,
  IEthersTransactionResult,
  EntryPointEthersContract_v1_0_0,
  EntryPointEthersContract_v1_0_1
}
