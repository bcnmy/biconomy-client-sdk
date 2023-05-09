import EvmNetworkManager, { EthersAdapterConfig } from './EvmNetworkManager'
import { IEthersTransactionOptions, IEthersTransactionResult } from './Types'

export { SmartWalletContract_v1_0_0__factory as SmartWalletFactoryV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletContract_v1_0_0__factory'

export { MultiSendContract_v1_0_0__factory as MultiSendContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/MultiSendContract_v1_0_0__factory'

export { MultiSendCallOnlyContract_v1_0_0__factory as MultiSendCallOnlyContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/MultiSendCallOnlyContract_v1_0_0__factory'

export { SmartWalletFactoryContract_v1_0_0__factory as SmartWalletContractFactoryV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletFactoryContract_v1_0_0__factory'

export { EntryPointContract_v1_0_0__factory as EntryPointFactoryContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/EntryPointContract_v1_0_0__factory'

export { EntryPointContract_v1_0_0 as EntryPointContractV100 } from '../typechain/src/ethers-v5/v1.0.0/EntryPointContract_v1_0_0'

export { SmartWalletContract_v1_0_0 as SmartWalletContractV100 } from '../typechain/src/ethers-v5/v1.0.0/SmartWalletContract_v1_0_0'

export {
  SmartWalletFactoryContract_v1_0_0 as SmartWalletFactoryContractV100,
  SmartWalletFactoryContract_v1_0_0Interface as SmartWalletFactoryContractV100Interface
} from '../typechain/src/ethers-v5/v1.0.0/SmartWalletFactoryContract_v1_0_0'

import EntryPointEthersContract_v1_0_0 from './contracts/EntryPointContract/v1.0.0/EntryPointEthersContract'

export default EvmNetworkManager
export {
  EthersAdapterConfig,
  IEthersTransactionOptions,
  IEthersTransactionResult,
  EntryPointEthersContract_v1_0_0
}
