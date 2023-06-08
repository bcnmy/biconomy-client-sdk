import { BigNumber, BigNumberish } from 'ethers'
// import { EntryPointContractV100 } from '@biconomy/ethers-lib'
import { EntryPoint } from '@account-abstraction/contracts'
import { ClientConfig } from './ClientConfig' // added in this design
import { arrayify, hexConcat } from 'ethers/lib/utils'
import { Signer } from '@ethersproject/abstract-signer'
import { TransactionDetailsForBatchUserOp } from './TransactionDetailsForUserOp'
import { UserOperation, UserOpGasFields } from '@biconomy/core-types'
import { BaseApiParams, BaseAccountAPI } from './BaseAccountAPI'
import { Provider } from '@ethersproject/providers'
import { BiconomyVerifyingPaymasterAPI } from './BiconomyVerifyingPaymasterAPI'
import { PaymasterAPI } from './PaymasterAPI'
import { resolveProperties } from 'ethers/lib/utils'
import { calcPreVerificationGas, GasOverheads } from './calcPreVerificationGas'
import { Transaction, PaymasterServiceDataType } from '@biconomy/core-types'
import {
  Logger,
  deployCounterFactualEncodedData,
  EIP1559_UNSUPPORTED_NETWORKS
} from '@biconomy/common'
import { HttpRpcClient } from './HttpRpcClient'
import { BiconomyTokenPaymasterAPI } from './BiconomyTokenPaymasterAPI'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export interface SmartAccountApiParams extends BaseApiParams {
  owner: Signer
  factoryAddress?: string
  index?: number
}

export interface VerificationGasLimits {
  /**
   * per userOp gasLimit for validateUserOp()
   * called from entrypoint to the account
   * should consider max execution
   */
  validateUserOpGas: number

  /**
   * per userOp gasLimit for validatePaymasterUserOp()
   * called from entrypoint to the paymaster
   * should consider max execution
   */
  validatePaymasterUserOpGas: number

  /**
   * per userOp gasLimit for postOp()
   * called from entrypoint to the paymaster
   * should consider max execution for paymaster/s this account may use
   */
  postOpGas: number
}

export const DefaultGasLimits: VerificationGasLimits = {
  validateUserOpGas: 100000,
  validatePaymasterUserOpGas: 100000,
  postOpGas: 10877
}

/**
 * An implementation of the BaseAccountAPI using the (biconomy) SmartAccount contract.
 * - contract deployer gets "entrypoint", "owner" addresses and "index" nonce
 * - owner signs requests using normal "Ethereum Signed Message" (ether's signer.signMessage())
 * - nonce method is "nonce()"
 */
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
    readonly httpRpcClient: HttpRpcClient,
    provider: Provider,
    readonly entryPoint: EntryPoint,
    readonly clientConfig: ClientConfig,
    accountAddress: string | undefined,
    readonly implementationAddress: string,
    readonly owner: Signer,
    readonly handlerAddress: string,
    readonly factoryAddress: string,
    readonly index = 0,
    overheads?: Partial<GasOverheads>
  ) {
    super(provider, entryPoint, clientConfig, accountAddress, overheads)
    if (!clientConfig.paymasterAPI) {
      this.paymasterAPI = undefined
    } else {
      // here it would either directly accept the instance
      this.paymasterAPI = clientConfig.paymasterAPI
    }
  }

  factory?: string

  /**
   * return the value to put into the "initCode" field, if the wallet is not yet deployed.
   * this value holds the "factory" address, followed by this wallet's information
   */
  async getAccountInitCode(): Promise<string> {
    const deployWalletCallData = await deployCounterFactualEncodedData({
      chainId: (await this.provider.getNetwork()).chainId, // Could be this.clientConfig.chainId
      owner: await this.owner.getAddress(),
      txServiceUrl: this.clientConfig.txServiceUrl,
      index: this.index
    })
    return hexConcat([this.factoryAddress, deployWalletCallData])
  }

  async nonce(): Promise<BigNumber> {
    Logger.log('checking nonce')
    if (!(await this.checkAccountDeployed())) {
      return BigNumber.from(0)
    }
    const walletContract = await this._getSmartAccountContract()
    const nonce = await walletContract.nonce()
    return nonce
  }

  /**
   * should cover cost of putting calldata on-chain, and some overhead.
   * actual overhead depends on the expected bundle size
   */
  async getPreVerificationGas(userOp: Partial<UserOperation>): Promise<number> {
    const p = await resolveProperties(userOp)
    return calcPreVerificationGas(p, this.overheads)
  }

  /**
   * return maximum gas used for verification.
   * NOTE: createUnsignedUserOp will add to this value the cost of creation, if the contract is not yet created.
   */
  async getVerificationGasLimit(): Promise<BigNumberish> {
    // Verification gas should be max(initGas(wallet deployment) + validateUserOp + validatePaymasterUserOp , postOp)
    const initCode = await this.getInitCode()

    const initGas = await this.estimateCreationGas(initCode)
    console.log('initgas estimated is ', initGas)

    let verificationGasLimit = initGas
    const validateUserOpGas =
      DefaultGasLimits.validatePaymasterUserOpGas + DefaultGasLimits.validateUserOpGas
    const postOpGas = DefaultGasLimits.postOpGas

    verificationGasLimit = BigNumber.from(validateUserOpGas).add(initGas)

    if (BigNumber.from(postOpGas).gt(verificationGasLimit)) {
      verificationGasLimit = postOpGas
    }
    return verificationGasLimit
  }

  async encodeExecuteCall(target: string, value: BigNumberish, data: string): Promise<string> {
    const walletContract = await this._getSmartAccountContract()
    return walletContract.interface.encodeFunctionData('executeCall', [target, value, data])
  }
  async encodeExecuteBatchCall(
    target: string[],
    value: BigNumberish[],
    data: string[]
  ): Promise<string> {
    const walletContract = await this._getSmartAccountContract()
    const encodeData = walletContract.interface.encodeFunctionData('executeBatchCall', [
      target,
      value,
      data
    ])
    Logger.log('encodeData ', encodeData)
    return encodeData
  }

  /**
   * create a UserOperation, filling all details (except signature)
   * - if wallet is not yet created, add initCode to deploy it.
   * - if gas or nonce are missing, read them from the chain (note that we can't fill gaslimit before the wallet is created)
   * @param info
   */
  async createUnsignedUserOp(info: TransactionDetailsForBatchUserOp): Promise<UserOperation> {
    Logger.log('info.paymasterServiceData', info.paymasterServiceData)

    if (
      info.paymasterServiceData &&
      info.paymasterServiceData.tokenPaymasterData &&
      info.paymasterServiceData.tokenPaymasterData.feeTokenAddress &&
      info.paymasterServiceData.tokenPaymasterData.feeTokenAddress != '' &&
      info.paymasterServiceData.tokenPaymasterData.feeTokenAddress != ZERO_ADDRESS
    ) {
      if (this.paymasterAPI instanceof BiconomyTokenPaymasterAPI) {
        // update calldata accordingly by checking allowance then batching token approval request
        const erc20Address = info.paymasterServiceData.tokenPaymasterData.feeTokenAddress
        Logger.log('erc20 address', erc20Address)
        const approveTx: Transaction = await this.paymasterAPI.createTokenApprovalRequest(
          erc20Address,
          this.provider
        )

        // May not need to do this always depnding on already given allowance..
        // ToDO ^
        if (approveTx.to && approveTx.data && approveTx.value) {
          info.target.unshift(approveTx.to)
          info.data.unshift(arrayify(approveTx.data)) // review
          info.value.unshift(approveTx.value)
        }
      }
    }

    const { callData, callGasLimit } = await this.encodeUserOpCallDataAndGasLimit(info)
    console.log(callData, callGasLimit)
    Logger.log('call gas limit for updated batch is ', callGasLimit.toString())

    const initCode = await this.getInitCode()

    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const partialUserOp: any = {
      sender: await this.getAccountAddress(),
      nonce: (await this.nonce()).toHexString(),
      initCode,
      callData,
      paymasterAndData: '0x'
    }

    let { maxFeePerGas, maxPriorityFeePerGas } = info
    const chainId = this.clientConfig.chainId
    if (EIP1559_UNSUPPORTED_NETWORKS.includes(chainId) && (maxFeePerGas || maxPriorityFeePerGas)) {
      throw new Error('EIP1559 is not supported on this network')
    }

    let feeData: UserOpGasFields | undefined
    try {
      feeData = await this.httpRpcClient.getUserOpGasAndGasPrices(partialUserOp)

      // only uodate if not provided by the user
      if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
        if (feeData.maxFeePerGas) {
          // if type 2 transaction, use the gas prices from the user or the default gas price
          maxFeePerGas = maxFeePerGas ?? BigNumber.from(feeData.maxFeePerGas)
          maxPriorityFeePerGas =
            maxPriorityFeePerGas ?? BigNumber.from(feeData.maxPriorityFeePerGas)
        } else {
          maxFeePerGas = maxFeePerGas ?? BigNumber.from(feeData.gasPrice)
          maxPriorityFeePerGas = maxPriorityFeePerGas ?? BigNumber.from(feeData.gasPrice)
        }
      }
    } catch (e: any) {
      Logger.log('error getting feeData', e.message)
      Logger.log('setting manual data')

      // fallback userOp update
      partialUserOp.nonce = await this.nonce()
      partialUserOp.callGasLimit = callGasLimit
      // only fetch getFeeData if not provided by the user
      if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
        const fallbackFeeData = await this.provider.getFeeData()
        Logger.log('EIP1559 fallbackFeeData', fallbackFeeData)
        if (EIP1559_UNSUPPORTED_NETWORKS.includes(chainId)) {
          maxFeePerGas =
            fallbackFeeData.gasPrice ?? (await this.provider.getGasPrice()) ?? undefined
          maxPriorityFeePerGas =
            fallbackFeeData.gasPrice ?? (await this.provider.getGasPrice()) ?? undefined
        }
        if (maxFeePerGas == null) {
          maxFeePerGas = fallbackFeeData.maxFeePerGas ?? undefined // ethers.BigNumber.from('100000000000')
        }
        if (maxPriorityFeePerGas == null) {
          maxPriorityFeePerGas = fallbackFeeData.maxPriorityFeePerGas ?? undefined // ethers.BigNumber.from('35000000000')
        }
      }
    }
    Logger.log('feeData', feeData)

    partialUserOp.maxFeePerGas = parseInt(maxFeePerGas?.toString() || '0')
    partialUserOp.maxPriorityFeePerGas = parseInt(maxPriorityFeePerGas?.toString() || '0')
    partialUserOp.callGasLimit = feeData?.callGasLimit ?? callGasLimit
    partialUserOp.verificationGasLimit =
      feeData?.verificationGasLimit ?? (await this.getVerificationGasLimit())
    partialUserOp.preVerificationGas =
      feeData?.preVerificationGas ?? (await this.getPreVerificationGas(partialUserOp))

    partialUserOp.paymasterAndData = !this.paymasterAPI
      ? '0x'
      : await this.paymasterAPI.getPaymasterAndData(partialUserOp, info.paymasterServiceData)
    return {
      ...partialUserOp,
      signature: ''
    }
  }

  async signUserOpHash(userOpHash: string): Promise<string> {
    return await this.owner.signMessage(arrayify(userOpHash))
  }
}
