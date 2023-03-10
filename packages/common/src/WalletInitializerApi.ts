import { InitializerDto } from '@biconomy/core-types'
import NodeClient, { ISmartAccount } from '@biconomy/node-client'
import { Contract } from 'ethers'

import * as _ from 'lodash'

export async function getInitializers(
    initializerDto: InitializerDto
  ): Promise<ISmartAccount> {    
    const { chainId, owner,  txServiceUrl} = initializerDto

    const smartAccountInfo = await new NodeClient({txServiceUrl}).getSmartAccountsByOwner({
      owner: owner,
      chainId
    })
    if (!smartAccountInfo.data || smartAccountInfo.data.length == 0){
      throw new Error("No Smart Account Found against supplied EOA");      
    }
    // check wallet is deployed on not
    let wallet = _.filter(smartAccountInfo.data, {chainId: chainId, 'isDeployed': true})
    if (!wallet){
    // filtering wallet base on deployed status and latest deployed wallet on chain
    let walletLists = _.filter(smartAccountInfo.data, {'isDeployed': true})
    walletLists = _.orderBy(walletLists, ['createdAt'], 'desc')
    return walletLists[0]
    }
    return wallet[0]
}

export async function deployCounterFactualEncodedData(initializerDto: InitializerDto){
  let { index, owner } = initializerDto
  index = index ? index : 0
  const walletInfo = await getInitializers(initializerDto)
  const implementation = new Contract(walletInfo.implementationAddress, [
    'function init(address _owner, address _handler)'
  ])
   const initializer = implementation.interface.encodeFunctionData("init", [
    owner,
    walletInfo.handlerAddress,
  ]);
  // these would be deployCounterfactualWallet
  const factory = new Contract(walletInfo.factoryAddress, [
    'function deployCounterFactualWallet(address _implementation, bytes memory initializer, uint256 _index) returns(address)'
  ])
  const encodedData = factory.interface.encodeFunctionData('deployCounterFactualWallet', [
    walletInfo.implementationAddress,
    initializer,
    index
  ])
  return encodedData
}