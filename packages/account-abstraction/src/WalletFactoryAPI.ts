import { Contract } from 'ethers'

// review // rename to SmartAccountFactoryAPI
export class WalletFactoryAPI {
  static deployWalletTransactionCallData(
    factoryAddress: string,
    owner: string,
    entryPoint: string,
    handler: string,
    index: number
  ): string {
    // these would be deployCounterfactualWallet
    const factory = new Contract(factoryAddress, [
      'function deployCounterFactualWallet(address _owner, address _entryPoint, address _handler, uint _index) returns(address)'
    ])
    const encodedData = factory.interface.encodeFunctionData('deployCounterFactualWallet', [
      owner,
      entryPoint,
      handler,
      index
    ])
    return encodedData
  }
}
