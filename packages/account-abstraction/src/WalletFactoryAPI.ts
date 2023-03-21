import { Contract } from 'ethers'
import { Logger, getWalletInfo } from '@biconomy/common'
import { ChainId } from '@biconomy/core-types'
// review // rename to SmartAccountFactoryAPI
export class WalletFactoryAPI {
  static async deployWalletTransactionCallData(
    txServiceUrl: string,
    chainId: ChainId,
    factoryAddress: string,
    owner: string,
    handlerAddress: string,
    implementationAddress: string,
    index: number
  ): Promise<string> {
    const walletInfo = await getWalletInfo({
      chainId,
      owner,
      txServiceUrl,
      index
    })
    Logger.log('walletInfo ', walletInfo)
    if ( walletInfo.isDeployed ){
      handlerAddress = walletInfo.handlerAddress
      implementationAddress = walletInfo.implementationAddress
    }
    const implementation = new Contract(implementationAddress, [
      'function init(address _owner, address _handler)'
    ])
    // const walletInterface = SmartWalletFactoryContractV100Interface.getInterface()
    const initializer = implementation.interface.encodeFunctionData("init", [
      owner,
      handlerAddress,
    ]);
    // these would be deployCounterFactualAccount
    const factory = new Contract(factoryAddress, [
      'function deployCounterFactualAccount(address _owner, uint256 _index) returns(address)'
    ])
    const encodedData = factory.interface.encodeFunctionData('deployCounterFactualAccount', [
      owner,
      index
    ])
    return encodedData
  }
}
