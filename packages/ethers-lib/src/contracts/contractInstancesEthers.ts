import { Signer } from '@ethersproject/abstract-signer'
import { SmartWalletContract__factory as SmartWalletContract } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletContract__factory'
import { MultiSendContract__factory as MultiSendContract } from '../../typechain/src/ethers-v5/v1.0.0/factories/MultiSendContract__factory'
import { SmartWalletFactoryContract__factory as SmartWalletFactoryContract } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletFactoryContract__factory'
import SmartWalletContractEthers from './SmartWallet/SmartWalletContractEthers'
import MultiSendEthersContract from './MultiSend/MultiSendEthersContract'
import SmartWalletFacoryContractEthers from './SmartWalletFactory/SmartWalletProxyFactoryEthersContract'
import { JsonRpcProvider } from '@ethersproject/providers'

export function getSmartWalletContractInstance(
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
): SmartWalletContractEthers {
  let safeContract = SmartWalletContract.connect(contractAddress, provider)
  return new SmartWalletContractEthers(safeContract)
}

// Review
export function getMultiSendContractInstance(
  contractAddress: string,
  // signer: Signer
  provider: JsonRpcProvider
): MultiSendEthersContract {
  let multiSendContract = MultiSendContract.connect(contractAddress, provider)
  return new MultiSendEthersContract(multiSendContract)
}

export function getSmartWalletFactoryContractInstance(
  contractAddress: string,
  provider: JsonRpcProvider
): SmartWalletFacoryContractEthers {
  let walletFactoryContract = SmartWalletFactoryContract.connect(contractAddress, provider)
  return new SmartWalletFacoryContractEthers(walletFactoryContract)
}
