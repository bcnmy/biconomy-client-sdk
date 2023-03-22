import { BigNumber, BigNumberish } from 'ethers'
// import { EntryPointContractV100 } from '@biconomy/ethers-lib'
import { EntryPoint } from '@account-abstraction/contracts'
import { ClientConfig } from './ClientConfig' // added in this design
import { arrayify, hexConcat } from 'ethers/lib/utils'
import { Signer } from '@ethersproject/abstract-signer'
import { TransactionDetailsForUserOp, TransactionDetailsForBatchUserOp } from './TransactionDetailsForUserOp'
import { UserOperation } from '@biconomy/core-types'
import { BaseApiParams, BaseAccountAPI } from './BaseAccountAPI'
import { Provider } from '@ethersproject/providers'
import { BiconomyPaymasterAPI } from './BiconomyPaymasterAPI'
import { resolveProperties } from 'ethers/lib/utils'
import { calcPreVerificationGas, GasOverheads } from './calcPreVerificationGas'
import { deployCounterFactualEncodedData } from '@biconomy/common'

// may use...
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
  validateUserOpGas: 61943,
  validatePaymasterUserOpGas: 25101,
  postOpGas: 10877,
}



/**
 * An implementation of the BaseWalletAPI using the SmartWalletContract contract.
 * - contract deployer gets "entrypoint", "owner" addresses and "index" nonce
 * - owner signs requests using normal "Ethereum Signed Message" (ether's signer.signMessage())
 * - nonce method is "nonce()"
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
    // const deployWalletCallData = await WalletFactoryAPI.deployWalletTransactionCallData(
    //   this.clientConfig.txServiceUrl,
    //   (await this.provider.getNetwork()).chainId,
    //   this.factoryAddress,
    //   await this.owner.getAddress(),
    //   this.handlerAddress,
    //   this.implementationAddress,
    //   0
    // )
    const deployWalletCallData = await deployCounterFactualEncodedData({
      chainId: (await this.provider.getNetwork()).chainId,
      owner: await this.owner.getAddress(),
      txServiceUrl: this.clientConfig.txServiceUrl,
      index: this.index
    })
    return hexConcat([this.factoryAddress, deployWalletCallData])
  }

  async nonce(): Promise<BigNumber> {
    console.log('checking nonce')
    if (!(await this.checkAccountDeployed())) {
      return BigNumber.from(0)
    }
    const walletContract = await this._getSmartAccountContract()
    const nonce = await walletContract.nonce()
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


  // /**
  //  * encode a method call from entryPoint to our contract
  //  * @param target
  //  * @param value
  //  * @param data
  //  */
  // async encodeExecute(
  //   target: string,
  //   value: BigNumberish,
  //   data: string,
  //   isDelegateCall: boolean
  // ): Promise<string> {
  //   const walletContract = await this._getSmartAccountContract()

  //   return walletContract.interface.encodeFunctionData('execFromEntryPoint', [
  //     target,
  //     value,
  //     data,
  //     isDelegateCall ? 1 : 0,
  //     1000000 // gasLimit for execute call on SmartWallet.sol. TODO: estimate using requiredTxGas
  //   ])
  // }

  /**
   * should cover cost of putting calldata on-chain, and some overhead.
   * actual overhead depends on the expected bundle size
   */
  async getPreVerificationGas (userOp: Partial<UserOperation>): Promise<number> {
    const p = await resolveProperties(userOp)
    return calcPreVerificationGas(p, this.overheads)
  }

   /**
   * return maximum gas used for verification.
   * NOTE: createUnsignedUserOp will add to this value the cost of creation, if the contract is not yet created.
   */
   async getVerificationGasLimit (): Promise<BigNumberish> {
    // Verification gas should be max(initGas(wallet deployment) + validateUserOp + validatePaymasterUserOp , postOp)
    const initCode = await this.getInitCode()

    const initGas = await this.estimateCreationGas(initCode)
    console.log('initgas estimated is ', initGas)

    let verificationGasLimit = initGas;
    const validateUserOpGas = DefaultGasLimits.validatePaymasterUserOpGas + DefaultGasLimits.validateUserOpGas;
    const postOpGas = DefaultGasLimits.postOpGas;

    verificationGasLimit = BigNumber.from(validateUserOpGas).add(initGas);

    
    if(BigNumber.from(postOpGas).gt(verificationGasLimit)) {
      verificationGasLimit = postOpGas;
    }
    return verificationGasLimit
  }

  async encodeExecuteCall(target: string, value: BigNumberish, data: string): Promise<string>{
    const walletContract = await this._getSmartAccountContract()
    return walletContract.interface.encodeFunctionData('executeCall', [
      target,
      value,
      data,
    ])
  }
  async encodeExecuteBatchCall(target: string[], value: BigNumberish[], data: string[]): Promise<string>{
    const walletContract = await this._getSmartAccountContract()
    const encodeData = walletContract.interface.encodeFunctionData('executeBatchCall', [
      target,
      value,
      data,
    ])
    console.log('encodeData ', encodeData);
    return encodeData
  }

  /**
   * create a UserOperation, filling all details (except signature)
   * - if wallet is not yet created, add initCode to deploy it.
   * - if gas or nonce are missing, read them from the chain (note that we can't fill gaslimit before the wallet is created)
   * @param info
   */
  async createUnsignedUserOp(info: TransactionDetailsForBatchUserOp): Promise<UserOperation> {
    const { callData, callGasLimit } = await this.encodeUserOpCallDataAndGasLimit(info)
    console.log(callData, callGasLimit);

    const initCode = await this.getInitCode()
    
    const verificationGasLimit = BigNumber.from(await this.getVerificationGasLimit());

    let {
      maxFeePerGas,
      maxPriorityFeePerGas
    } = 
    
    info
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
      nonce: await this.nonce(),
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
      signature: ''
    }
  }

  async signUserOpHash (userOpHash: string): Promise<string> {
    return await this.owner.signMessage(arrayify(userOpHash))
  }
}
