import { BigNumber, BigNumberish } from 'ethers'
import { EntryPointContractV101 } from '@biconomy/ethers-lib'

import { ClientConfig } from './ClientConfig'
import { arrayify, hexConcat } from 'ethers/lib/utils'
import { Signer } from '@ethersproject/abstract-signer'
import { TransactionDetailsForUserOp } from './TransactionDetailsForUserOp'
import { UserOperation } from '@biconomy/core-types'
import { BaseWalletAPI } from './BaseWalletAPI'
import { Provider } from '@ethersproject/providers'
import { WalletFactoryAPI } from './WalletFactoryAPI'
import { BiconomyPaymasterAPI } from './BiconomyPaymasterAPI'
import { ZERO_ADDRESS } from '@biconomy/core-types'

/**
 * An implementation of the BaseWalletAPI using the SmartWalletContract contract.
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
  constructor(
    provider: Provider,
    readonly entryPoint: EntryPointContractV101,
    readonly clientConfig: ClientConfig,
    walletAddress: string | undefined,
    readonly owner: Signer,
    readonly handlerAddress: string,
    readonly factoryAddress: string,
    readonly index = 0
  ) {
    super(provider, entryPoint, clientConfig, walletAddress)
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
  async getWalletInitCode(): Promise<string> {
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
    if (await this.checkWalletPhantom()) {
      return BigNumber.from(0)
    }
    const walletContract = await this._getWalletContract()
    const nonce = await walletContract.getNonce(batchId)
    return nonce
  }
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
    const walletContract = await this._getWalletContract()

    return walletContract.interface.encodeFunctionData('execFromEntryPoint', [
      target,
      value,
      data,
      isDelegateCall ? 1 : 0,
      1000000 // gasLimit for execute call on SmartWallet.sol. TODO: estimate using requiredTxGas
    ])
  }

  async signRequestId(requestId: string): Promise<string> {
    return await this.owner.signMessage(arrayify(requestId))
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

    let verificationGasLimit = BigNumber.from(await this.getVerificationGasLimit())
    if (initCode.length > 2) {
      // add creation to required verification gas
      // using entry point static for gas estimation
      const entryPointStatic = this.entryPoint.connect(ZERO_ADDRESS)
      const initGas = await entryPointStatic.estimateGas.getSenderAddress(initCode, {
        from: ZERO_ADDRESS
      })
      verificationGasLimit = verificationGasLimit.add(initGas)
    }

    let { maxFeePerGas, maxPriorityFeePerGas } = info
    if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
      const feeData = await this.provider.getFeeData()
      if (maxFeePerGas == null) {
        maxFeePerGas = feeData.maxFeePerGas ?? undefined
      }
      if (maxPriorityFeePerGas == null) {
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? undefined
      }
    }

    if(!maxFeePerGas || !maxPriorityFeePerGas) {
      const gasFee = await this.provider.getGasPrice() // Could be from bundler/ oracle
      maxFeePerGas = gasFee
      maxPriorityFeePerGas = gasFee
    }

    const partialUserOp: any = {
      sender: await this.getWalletAddress(),
      nonce: await this.getNonce(0), // TODO (nice-to-have): add batchid as param
      initCode,
      callData,
      callGasLimit,
      verificationGasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas
    }

    partialUserOp.paymasterAndData =
      this.paymasterAPI == null ? '0x' : await this.paymasterAPI.getPaymasterAndData(partialUserOp)
    return {
      ...partialUserOp,
      preVerificationGas: this.getPreVerificationGas(partialUserOp),
      signature: ''
    }
  }
}
