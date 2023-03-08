import { Contract } from 'ethers'
import { getInitializers } from '@biconomy/common'
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
    const walletInfo = await getInitializers({
      chainId,
      version: '1.0.0',
      owner,
      txServiceUrl,
      index
    })
    console.log('walletInfo ', walletInfo);
    if ( walletInfo.isDeployed ){
      handlerAddress = walletInfo.handler
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
    // these would be deployCounterfactualWallet
    const factory = new Contract(factoryAddress, [
      'function deployCounterFactualWallet(address _implementation, bytes memory initializer, uint256 _index) returns(address)'
    ])
    const encodedData = factory.interface.encodeFunctionData('deployCounterFactualWallet', [
      implementationAddress,
      initializer,
      index
    ])
    return encodedData
  }
}
