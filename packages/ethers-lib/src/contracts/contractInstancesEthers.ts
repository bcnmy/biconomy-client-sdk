import { Signer } from '@ethersproject/abstract-signer'
import { SmartWalletSV100__factory as SmartWalletMasterCopy_V1_0_0 } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletSV100__factory'
import { MultiSendSV100__factory as MultiSend_V1_0_0 } from '../../typechain/src/ethers-v5/v1.0.0/factories/MultiSendSV100__factory'
import { SmartWalletFacoryContractSV100__factory as SmartWalletFactory_V1_0_0 } from '../../typechain/src/ethers-v5/v1.0.0/factories/SmartWalletFacoryContractSV100__factory'
import SmartWalletContractEthers from './SmartWallet/SmartWalletContractEthers'
import MultiSendEthersContract from './MultiSend/MultiSendEthersContract'
import SmartWalletFacoryContractEthers from './SmartWalletFactory/SmartWalletProxyFactoryEthersContract'

export function getSafeContractInstance(
  contractAddress: string,
  signer: Signer
): | SmartWalletContractEthers{

  let safeContract = SmartWalletMasterCopy_V1_0_0.connect(contractAddress, signer)
  return new SmartWalletContractEthers(safeContract)
    }

export function getMultiSendContractInstance(
  contractAddress: string,
  signer: Signer
): MultiSendEthersContract{
  
  let multiSendContract = MultiSend_V1_0_0.connect(contractAddress, signer)
  return new MultiSendEthersContract(multiSendContract)
}

export function getSafeProxyFactoryContractInstance(
  contractAddress: string,
  signer: Signer
): SmartWalletFacoryContractEthers{
  let walletFactoryContract = SmartWalletFactory_V1_0_0.connect(contractAddress, signer)
  return new SmartWalletFacoryContractEthers(walletFactoryContract)
}
