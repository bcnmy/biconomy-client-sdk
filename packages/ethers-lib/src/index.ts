import EvmNetworkManager, { EthersAdapterConfig } from './EvmNetworkManager'
import { IEthersTransactionOptions, IEthersTransactionResult } from './Types'

export { SmartWalletContractV100__factory as SmartWalletFactoryV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletContractV100__factory'

export { MultiSendContractV100__factory as MultiSendContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/MultiSendContractV100__factory'

export { MultiSendCallOnlyContractV100__factory as MultiSendCallOnlyContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/MultiSendCallOnlyContractV100__factory'

export { SmartWalletFactoryContractV100__factory as SmartWalletContractFactoryV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletFactoryContractV100__factory'

export { EntryPointContractV100__factory as EntryPointFactoryContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/EntryPointContractV100__factory'

export { EntryPointContractV100 } from '../typechain/src/ethers-v5/v1.0.0/EntryPointContractV100'

export { SmartWalletContractV100 } from '../typechain/src/ethers-v5/v1.0.0/SmartWalletContractV100'

export {
  SmartWalletFactoryContractV100,
  SmartWalletFactoryContractV100Interface
} from '../typechain/src/ethers-v5/v1.0.0/SmartWalletFactoryContractV100'

import EntryPointEthersContract_v1_0_0 from './contracts/EntryPointContract/v1.0.0/EntryPointEthersContract'

export default EvmNetworkManager
export {
  EthersAdapterConfig,
  IEthersTransactionOptions,
  IEthersTransactionResult,
  EntryPointEthersContract_v1_0_0
}
