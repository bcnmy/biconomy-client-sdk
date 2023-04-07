import { InitializerDto } from '@biconomy-devx/core-types'
import NodeClient, { ISmartAccount } from '@biconomy-devx/node-client'
import { Contract } from 'ethers'

import * as _ from 'lodash'

export async function getWalletInfo(initializerDto: InitializerDto): Promise<ISmartAccount> {
  const { chainId, owner, txServiceUrl } = initializerDto

  const smartAccountInfo = await new NodeClient({ txServiceUrl }).getSmartAccountsByOwner({
    owner: owner,
    chainId
  })
  if (!smartAccountInfo.data || smartAccountInfo.data.length == 0) {
    throw new Error('No Smart Account Found against supplied EOA')
  }
  const walletInfo = smartAccountInfo.data
  if (walletInfo.length === 0) throw new Error('No Wallet Info Found against supplied data')
  // check wallet is deployed on not
  const wallet = _.filter(walletInfo, { isDeployed: true })
  if (wallet.length > 0) {
    // filtering wallet base on deployed status and latest deployed wallet on chain
    let walletLists = _.filter(wallet, { chainId: chainId })
    if (walletLists.length > 0) {
      return walletLists[0]
    }
    walletLists = wallet.sort((objA, objB) => objB.createdAt - objA.createdAt)
    return walletLists[0]
  }
  return walletInfo[0]
}

export async function deployCounterFactualEncodedData(initializerDto: InitializerDto) {
  let { index } = initializerDto
  index = index ? index : 0
  const walletInfo = await getWalletInfo(initializerDto)
  // these would be deployCounterFactualAccount
  const factory = new Contract(walletInfo.factoryAddress, [
    'function deployCounterFactualAccount(address _owner, uint256 _index) returns(address)'
  ])
  const encodedData = factory.interface.encodeFunctionData('deployCounterFactualAccount', [
    walletInfo.owner,
    index
  ])
  return encodedData
}
