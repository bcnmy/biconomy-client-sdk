import { Signer } from '@ethersproject/abstract-signer'
import { SmartWalletContract__factory as SmartWalletContract } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletContract__factory'
import { MultiSendContract__factory as MultiSendContract } from '../../typechain/src/ethers-v5/v1.0.0/factories/MultiSendContract__factory'
import { SmartWalletFactoryContract__factory as SmartWalletFactoryContract } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletFactoryContract__factory'
import SmartWalletContractEthers from './SmartWallet/SmartWalletContractEthers'
import MultiSendEthersContract from './MultiSend/MultiSendEthersContract'
import SmartWalletFacoryContractEthers from './SmartWalletFactory/SmartWalletProxyFactoryEthersContract'

export function getSafeContractInstance(
  contractAddress: string,
  signer: Signer
): | SmartWalletContractEthers{

  let safeContract = SmartWalletContract.connect(contractAddress, signer)
  return new SmartWalletContractEthers(safeContract)
    }

export function getMultiSendContractInstance(
  contractAddress: string,
  signer: Signer
): MultiSendEthersContract{
  
  let multiSendContract = MultiSendContract.connect(contractAddress, signer)
  return new MultiSendEthersContract(multiSendContract)
}

export function getSafeProxyFactoryContractInstance(
  contractAddress: string,
  signer: Signer
): SmartWalletFacoryContractEthers{
  let walletFactoryContract = SmartWalletFactoryContract.connect(contractAddress, signer)
  return new SmartWalletFacoryContractEthers(walletFactoryContract)
}
