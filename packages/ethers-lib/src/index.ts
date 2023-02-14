import EvmNetworkManager, { EthersAdapterConfig } from './EvmNetworkManager'
import { IEthersTransactionOptions, IEthersTransactionResult } from './Types'

export { SmartWalletContractV100__factory as SmartWalletFactoryV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletContractV100__factory'
export { SmartWalletContractV101__factory as SmartWalletFactoryV101 } from '../typechain/src/ethers-v5/v1.0.1/factories/SmartWalletContractV101__factory'
export { SmartWalletContractV102__factory as SmartWalletFactoryV102 } from '../typechain/src/ethers-v5/v1.0.2/factories/SmartWalletContractV102__factory'

export { MultiSendContractV100__factory as MultiSendContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/MultiSendContractV100__factory'
export { MultiSendContractV101__factory as MultiSendContractV101 } from '../typechain/src/ethers-v5/v1.0.1/factories/MultiSendContractV101__factory'
export { MultiSendContractV102__factory as MultiSendContractV102 } from '../typechain/src/ethers-v5/v1.0.2/factories/MultiSendContractV102__factory'

export { MultiSendCallOnlyContractV100__factory as MultiSendCallOnlyContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/MultiSendCallOnlyContractV100__factory'
export { MultiSendCallOnlyContractV101__factory as MultiSendCallOnlyContractV101 } from '../typechain/src/ethers-v5/v1.0.1/factories/MultiSendCallOnlyContractV101__factory'
export { MultiSendCallOnlyContractV102__factory as MultiSendCallOnlyContractV102 } from '../typechain/src/ethers-v5/v1.0.2/factories/MultiSendCallOnlyContractV102__factory'

export { SmartWalletFactoryContractV100__factory as SmartWalletFactoryFactoryContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletFactoryContractV100__factory'
export { SmartWalletFactoryContractV101__factory as SmartWalletFactoryFactoryContractV101 } from '../typechain/src/ethers-v5/v1.0.1/factories/SmartWalletFactoryContractV101__factory'
export { SmartWalletFactoryContractV102__factory as SmartWalletFactoryFactoryContractV102 } from '../typechain/src/ethers-v5/v1.0.2/factories/SmartWalletFactoryContractV102__factory'

export { EntryPointContractV100__factory as EntryPointFactoryContractV100 } from '../typechain/src/ethers-v5/v1.0.0/factories/EntryPointContractV100__factory'
export { EntryPointContractV101__factory as EntryPointFactoryContractV101 } from '../typechain/src/ethers-v5/v1.0.1/factories/EntryPointContractV101__factory'
export { EntryPointContractV102__factory as EntryPointFactoryContractV102 } from '../typechain/src/ethers-v5/v1.0.2/factories/EntryPointContractV102__factory'

export { EntryPointContractV100 } from '../typechain/src/ethers-v5/v1.0.0/EntryPointContractV100'
export { EntryPointContractV101 } from '../typechain/src/ethers-v5/v1.0.1/EntryPointContractV101'
export { EntryPointContractV102 } from '../typechain/src/ethers-v5/v1.0.2/EntryPointContractV102'

export { SmartWalletContractV101 } from '../typechain/src/ethers-v5/v1.0.1/SmartWalletContractV101'
export { SmartWalletContractV102 } from '../typechain/src/ethers-v5/v1.0.2/SmartWalletContractV102'
export { SmartWalletContractV100 } from '../typechain/src/ethers-v5/v1.0.0/SmartWalletContractV100'

export { SmartWalletFactoryContractV101 } from '../typechain/src/ethers-v5/v1.0.1/SmartWalletFactoryContractV101'
export { SmartWalletFactoryContractV102 } from '../typechain/src/ethers-v5/v1.0.2/SmartWalletFactoryContractV102'
export { SmartWalletFactoryContractV100 } from '../typechain/src/ethers-v5/v1.0.0/SmartWalletFactoryContractV100'

import EntryPointEthersContract_v1_0_0 from './contracts/EntryPointContract/v1.0.0/EntryPointEthersContract'
import EntryPointEthersContract_v1_0_1 from './contracts/EntryPointContract/v1.0.1/EntryPointEthersContract'
import EntryPointEthersContract_v1_0_2 from './contracts/EntryPointContract/v1.0.2/EntryPointEthersContract'

export default EvmNetworkManager
export {
  EthersAdapterConfig,
  IEthersTransactionOptions,
  IEthersTransactionResult,
  EntryPointEthersContract_v1_0_0,
  EntryPointEthersContract_v1_0_1,
  EntryPointEthersContract_v1_0_2
}
