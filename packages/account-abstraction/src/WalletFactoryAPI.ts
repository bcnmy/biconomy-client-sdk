import { Contract } from 'ethers'
import { Logger, getWalletInfo } from '@biconomy-devx/common'
import { ChainId } from '@biconomy-devx/core-types'
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
    if (walletInfo.isDeployed) {
      handlerAddress = walletInfo.handlerAddress
      implementationAddress = walletInfo.implementationAddress
      Logger.log(handlerAddress, implementationAddress)
    }
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
