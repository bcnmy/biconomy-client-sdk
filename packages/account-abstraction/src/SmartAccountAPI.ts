import { BigNumber, BigNumberish } from 'ethers'
import { EntryPointContractV100 } from '@biconomy/ethers-lib'

import { ClientConfig } from './ClientConfig' // added in this design
import { arrayify, hexConcat } from 'ethers/lib/utils'
import { Signer } from '@ethersproject/abstract-signer'
import { TransactionDetailsForUserOp } from './TransactionDetailsForUserOp'
import { UserOperation } from '@biconomy/core-types'
import { BaseApiParams, BaseAccountAPI } from './BaseAccountAPI'
import { Provider } from '@ethersproject/providers'
import { WalletFactoryAPI } from './WalletFactoryAPI' // could be renamed smart account factory
import { BiconomyPaymasterAPI } from './BiconomyPaymasterAPI'
import { ZERO_ADDRESS } from '@biconomy/core-types'
import { GasOverheads } from './calcPreVerificationGas'


// may use...
export interface SmartAccountApiParams extends BaseApiParams {
  owner: Signer
  factoryAddress?: string
  index?: number
}

/**
 * An implementation of the BaseWalletAPI using the SmartWalletContract contract.
 * - contract deployer gets "entrypoint", "owner" addresses and "index" nonce
 * - owner signs requests using normal "Ethereum Signed Message" (ether's signer.signMessage())
 * - nonce method is "nonce()"
 * - execute method is "execFromEntryPoint()"
 */

// Should be maintain SmartAccountAPI
// Review
export class SmartAccountAPI extends BaseAccountAPI {
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
  constructor(
    provider: Provider,
    readonly entryPoint: EntryPointContractV100,
    readonly clientConfig: ClientConfig,
    accountAddress: string | undefined,
    readonly owner: Signer,
    readonly handlerAddress: string,
    readonly factoryAddress: string,
    readonly index = 0,
    overheads?: Partial<GasOverheads>
  ) {
    super(provider, entryPoint, clientConfig, accountAddress, overheads)
    if (clientConfig.customPaymasterAPI) {
      this.paymasterAPI = clientConfig.customPaymasterAPI
    } else {
      this.paymasterAPI = new BiconomyPaymasterAPI(
        clientConfig.biconomySigningServiceUrl,
        clientConfig.dappAPIKey
      )
    }
  }

  factory?: string

  /**
   * return the value to put into the "initCode" field, if the wallet is not yet deployed.
   * this value holds the "factory" address, followed by this wallet's information
   */
  async getAccountInitCode(): Promise<string> {
    // can rename it smart account factory
    const deployWalletCallData = WalletFactoryAPI.deployWalletTransactionCallData(
      this.factoryAddress,
      await this.owner.getAddress(),
      this.entryPoint.address,
      this.handlerAddress,
      0
    )
    return hexConcat([this.factoryAddress, deployWalletCallData])
  }

  async getNonce(batchId: number): Promise<BigNumber> {
    console.log('checking nonce')
    if (!(await this.checkAccountDeployed())) {
      return BigNumber.from(0)
    }
    const walletContract = await this._getSmartAccountContract()
    const nonce = await walletContract.getNonce(batchId)
    return nonce
  }

  // review
  // could be plain nonce method if we don't go with batch id
  /*async getNonce (): Promise<BigNumber> {
    if (await this.checkAccountDeployed()) {
      return BigNumber.from(0)
    }
    const accountContract = await this._getSmartAccountContract()
    return await accountContract.nonce()
  }*/


  /**
   * encode a method call from entryPoint to our contract
   * @param target
   * @param value
   * @param data
   */
  async encodeExecute(
    target: string,
    value: BigNumberish,
    data: string,
    isDelegateCall: boolean
  ): Promise<string> {
    const walletContract = await this._getSmartAccountContract()

    return walletContract.interface.encodeFunctionData('execFromEntryPoint', [
      target,
      value,
      data,
      isDelegateCall ? 1 : 0,
      1000000 // gasLimit for execute call on SmartWallet.sol. TODO: estimate using requiredTxGas
    ])
  }

  /**
   * create a UserOperation, filling all details (except signature)
   * - if wallet is not yet created, add initCode to deploy it.
   * - if gas or nonce are missing, read them from the chain (note that we can't fill gaslimit before the wallet is created)
   * @param info
   */
  async createUnsignedUserOp(info: TransactionDetailsForUserOp): Promise<UserOperation> {
    const { callData, callGasLimit } = await this.encodeUserOpCallDataAndGasLimit(info)
    const initCode = await this.getInitCode()
    console.log('initCode ', initCode)

    const initGas = await this.estimateCreationGas(initCode)
    console.log('initgas estimated is ', initGas)

    // Review verification gas limit
    // Test tx : https://mumbai.polygonscan.com/tx/0x4d862c501360988e77155c8a28812d1641d2fcca53d266ef3ad189e4a34fcdd0
    const verificationGasLimit = BigNumber.from(await this.getVerificationGasLimit())
    .add(initGas)

    let {
      maxFeePerGas,
      maxPriorityFeePerGas
    } = info
    if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
      const feeData = await this.provider.getFeeData()
      if (maxFeePerGas == null) {
        maxFeePerGas = feeData.maxFeePerGas ?? undefined
      }
      if (maxPriorityFeePerGas == null) {
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? undefined
      }
    }

    let partialUserOp: any = {
      sender: await this.getAccountAddress(),
      nonce: await this.getNonce(0), // TODO (nice-to-have): add batchid as param
      initCode,
      callData,
      callGasLimit,
      verificationGasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas
    }

    partialUserOp.paymasterAndData = '0x'
    const preVerificationGas = await this.getPreVerificationGas(partialUserOp)
    partialUserOp.preVerificationGas = preVerificationGas

    partialUserOp.paymasterAndData =
      this.paymasterAPI == null ? '0x' : await this.paymasterAPI.getPaymasterAndData(partialUserOp)
    return {
      ...partialUserOp,
      // preVerificationGas: this.getPreVerificationGas(partialUserOp),
      signature: ''
    }
  }

  async signUserOpHash (userOpHash: string): Promise<string> {
    return await this.owner.signMessage(arrayify(userOpHash))
  }
}
