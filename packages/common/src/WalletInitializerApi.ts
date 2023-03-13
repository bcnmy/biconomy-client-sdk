import { InitializerDto } from '@biconomy/core-types'
import NodeClient, { ISmartAccount } from '@biconomy/node-client'
import { Contract } from 'ethers'

import * as _ from 'lodash'

export async function getInitializers(
  initializerDto: InitializerDto
): Promise<ISmartAccount> {
  const { chainId, owner, txServiceUrl } = initializerDto

  const smartAccountInfo = await new NodeClient({ txServiceUrl }).getSmartAccountsByOwner({
    owner: owner,
    chainId
  })
  if (!smartAccountInfo.data || smartAccountInfo.data.length == 0) {
    throw new Error("No Smart Account Found against supplied EOA");
  }
  // check wallet is deployed on not
  let wallet = _.filter(smartAccountInfo.data, { chainId: chainId, 'isDeployed': true })
  if (!wallet) {
    // filtering wallet base on deployed status and latest deployed wallet on chain
    let walletLists = _.filter(smartAccountInfo.data, { 'isDeployed': true })
    walletLists = _.orderBy(walletLists, ['createdAt'], 'desc')
    return walletLists[0]
  }
  return wallet[0]
}

export async function deployCounterFactualEncodedData(initializerDto: InitializerDto) {
  let { index } = initializerDto
  index = index ? index : 0
  const walletInfo = await getInitializers(initializerDto)
  // these would be deployCounterfactualWallet
  const factory = new Contract(walletInfo.factoryAddress, [
    'function deployCounterFactualWallet(address _owner, uint256 _index) returns(address)'
  ])
  const encodedData = factory.interface.encodeFunctionData('deployCounterFactualWallet', [
    walletInfo.owner,
    index
  ])
  return encodedData
}

export async function updateImplementationEncodedData(implementationAddress: string) {
  const implementation = new Contract(implementationAddress, [
    'function updateImplementation(address _implementation)'
  ])
  const encodedData = implementation.interface.encodeFunctionData("updateImplementation", [
    implementationAddress
  ]);
  return encodedData
}

export async function fallbackHandlerEncodedData(implementationAddress: string, handler: string) {
  const implementation = new Contract(implementationAddress, [
    'function setFallbackHandler(address handler)'
  ])
  const encodedData = implementation.interface.encodeFunctionData("setFallbackHandler", [
    handler
  ]);
  return encodedData
}
