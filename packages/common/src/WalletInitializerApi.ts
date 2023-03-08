import { InitializerDto } from '@biconomy/core-types'
import NodeClient, { ISmartAccount } from '@biconomy/node-client'
import * as _ from 'lodash'

export async function getInitializers(
    initializerDto: InitializerDto
  ): Promise<ISmartAccount> {    
    const { index, chainId, version, owner,  txServiceUrl} = initializerDto

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