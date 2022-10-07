import { JsonRpcProvider } from '@ethersproject/providers'

// import { EntryPoint__factory } from '@account-abstraction/contracts'

import { EntryPointFactoryContractV101 } from '@biconomy-sdk/ethers-lib'

import { ClientConfig } from './ClientConfig'
import { SmartAccountAPI } from './SmartAccountAPI'
import { ERC4337EthersProvider } from './ERC4337EthersProvider'
import { HttpRpcClient } from './HttpRpcClient'
import { Signer } from '@ethersproject/abstract-signer'
import { ContractUtils } from '@biconomy-sdk/transactions'

// TODO: Update in the context of SmartAccount and WalletFactory aka deployer
// Might need smart account state for contract addresses

// To be used in SmartAccount to init 4337 provider
export async function newProvider (
  originalProvider: JsonRpcProvider,
  contractUtils: ContractUtils, 
  config: ClientConfig,
  originalSigner: Signer = originalProvider.getSigner(),
  walletAddress: string,
  fallbackHandlerAddress: string,
  factoryAddress: string

): Promise<ERC4337EthersProvider> {
  const entryPoint = EntryPointFactoryContractV101.connect(config.entryPointAddress, originalProvider)
  // Initial SimpleWallet instance is not deployed and exists just for the interface
  // const simpleWalletDeployer = await DeterministicDeployer.deploy(SimpleWalletDeployer__factory.bytecode)
  const smartWalletAPI = new SmartAccountAPI(originalProvider, contractUtils, entryPoint, walletAddress, originalSigner, fallbackHandlerAddress, factoryAddress, 0)
  const httpRpcClient = new HttpRpcClient(config.bundlerUrl, config.entryPointAddress, config.chainId)
  return await new ERC4337EthersProvider(
    config,
    originalSigner,
    originalProvider,
    httpRpcClient,
    entryPoint,
    smartWalletAPI
  ).init()
}
