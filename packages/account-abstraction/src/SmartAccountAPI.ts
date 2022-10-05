import { BigNumber, BigNumberish } from 'ethers'
import {
  SimpleWallet,
  SimpleWallet__factory,  
} from '@account-abstraction/contracts'

import { arrayify, hexConcat } from 'ethers/lib/utils'
import { Signer } from '@ethersproject/abstract-signer'
import { BaseWalletAPI } from './BaseWalletAPI'
import { Provider } from '@ethersproject/providers'
import { WalletFactoryAPI } from './WalletFactoryAPI'

/**
 * An implementation of the BaseWalletAPI using the SimpleWallet contract.
 * - contract deployer gets "entrypoint", "owner" addresses and "index" nonce
 * - owner signs requests using normal "Ethereum Signed Message" (ether's signer.signMessage())
 * - nonce method is "nonce()"
 * - execute method is "execFromEntryPoint()"
 */

// Should be maintain SmartAccountAPI 
// Review
export class SmartAccountAPI extends BaseWalletAPI {
  /**
   * base constructor.
   * subclass SHOULD add parameters that define the owner (signer) of this wallet
   * @param provider - read-only provider for view calls
   * @param entryPointAddress - the entryPoint to send requests through (used to calculate the request-id, and for gas estimations)
   * @param walletAddress optional wallet address, if connecting to an existing contract.
   * @param owner the signer object for the wallet owner
   * @param factoryAddress address of contract "factory" to deploy new contracts
   * @param index nonce value used when creating multiple wallets for the same owner
   */
  constructor (
    provider: Provider, // may be removed in further development
    entryPointAddress: string,
    walletAddress: string | undefined,
    readonly owner: Signer,
    readonly handlerAddress: string,
    readonly factoryAddress: string,
    readonly index = 0
  ) {
    super(provider, entryPointAddress, walletAddress)
  }

  /**
   * our wallet contract.
   * should support the "execFromSingleton" and "nonce" methods
   */
  walletContract?: SimpleWallet

  factory?: string

  async _getWalletContract (): Promise<SimpleWallet> {
    if (this.walletContract == null) {
      this.walletContract = SimpleWallet__factory.connect(await this.getWalletAddress(), this.provider)
    }
    return this.walletContract
  }

  /**
   * return the value to put into the "initCode" field, if the wallet is not yet deployed.
   * this value holds the "factory" address, followed by this wallet's information
   */
  async getWalletInitCode (): Promise<string> {
    const deployWalletCallData = WalletFactoryAPI.deployWalletTransactionCallData(this.factoryAddress, await this.owner.getAddress(), this.entryPointAddress, this.handlerAddress, 0)
    return hexConcat([
      this.factoryAddress,
      deployWalletCallData
    ])
  }

  async getNonce (): Promise<BigNumber> {
    if (await this.checkWalletPhantom()) {
      return BigNumber.from(0)
    }
    const walletContract = await this._getWalletContract()
    return await walletContract.nonce()
  }
    /**
   * encode a method call from entryPoint to our contract
   * @param target
   * @param value
   * @param data
   */
     async encodeExecute (target: string, value: BigNumberish, data: string): Promise<string> {
      const walletContract = await this._getWalletContract()
      return walletContract.interface.encodeFunctionData(
        'execFromEntryPoint',
        [
          target,
          value,
          data
        ])
    }
  // TODO: May be need to move this to ERC4337EthersPrivider
  async signRequestId (requestId: string): Promise<string> {
    return await this.owner.signMessage(arrayify(requestId))
  }
}
