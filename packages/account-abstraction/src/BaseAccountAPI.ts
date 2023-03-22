import { ethers, BigNumber, BigNumberish } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { UserOperation } from '@biconomy/core-types' // review
import { ClientConfig } from './ClientConfig' // ClientConfig is needed in this design
import { BytesLike } from "@ethersproject/bytes";
import { EntryPoint } from '@account-abstraction/contracts'

import {
  EntryPointContractV100,
  SmartWalletFactoryV100,
  SmartWalletContractV100
} from '@biconomy/ethers-lib'
import { TransactionDetailsForBatchUserOp } from './TransactionDetailsForUserOp'
import { resolveProperties } from 'ethers/lib/utils'
import { IPaymasterAPI } from '@biconomy/core-types' // only use interface
import { getUserOpHash, NotPromise, packUserOp } from '@biconomy/common'
import { GasOverheads } from './calcPreVerificationGas'

// might make use of this
export interface BaseApiParams {
  provider: Provider
  entryPointAddress: string
  accountAddress?: string
  overheads?: Partial<GasOverheads>
  paymasterAPI?: IPaymasterAPI
}
export interface UserOpResult {
  transactionHash: string
  success: boolean
}

/**
 * Base class for all Smart Wallet ERC-4337 Clients to implement.
 * Subclass should inherit 5 methods to support a specific wallet contract:
 *
 * - getAccountInitCode - return the value to put into the "initCode" field, if the account is not yet deployed. should create the account instance using a factory contract.
 * - getNonce - return current account's nonce value
 * - encodeExecute - encode the call from entryPoint through our account to the target contract.
 * - signUserOpHash - sign the hash of a UserOp.
 *
 * The user can use the following APIs:
 * - createUnsignedUserOp - given "target" and "calldata", fill userOp to perform that operation from the account.
 * - createSignedUserOp - helper to call the above createUnsignedUserOp, and then extract the userOpHash and sign it
 */

// Note: Resembles SmartAccount methods itself. Could be sperated out across smart-account & || transactions || new package and reclaim

export abstract class BaseAccountAPI {
  private senderAddress!: string
  private isDeployed = false

  // may need...
  // entryPoint connected to "zero" address. allowed to make static calls (e.g. to getSenderAddress)
  // private readonly entryPointView: EntryPoint

  /**
   * subclass MAY initialize to support custom paymaster
   */
  paymasterAPI?: IPaymasterAPI

  /**
   * our wallet contract.
   */
  accountContract!: SmartWalletContractV100 //possibly rename to account 

  /**
   * base constructor.
   * subclass SHOULD add parameters that define the owner (signer) of this wallet
   * @param provider - read-only provider for view calls
   * @param entryPointAddress - the entryPoint to send requests through (used to calculate the request-id, and for gas estimations)
   * @param accountAddress. may be empty for new wallet (using factory to determine address)
   */
  protected constructor(
    readonly provider: Provider,
    readonly entryPoint: EntryPoint, // we could just get an address : evaluate
    readonly clientConfig: ClientConfig, // review the need to get entire clientconfig
    readonly accountAddress?: string,
    readonly overheads?: Partial<GasOverheads>
  ) {
    // may need...
    // factory "connect" define the contract address. the contract "connect" defines the "from" address.
    // this.entryPointView = EntryPoint__factory.connect(entryPointAddress, provider).connect(ethers.constants.AddressZero)
  }

  // placeholder to replace paymaster
  connectPaymaster(newPaymasterAPI: IPaymasterAPI): BaseAccountAPI {
    this.paymasterAPI = newPaymasterAPI
    return this
  }

  // based on provider chainId we maintain smartWalletContract..
  async _getSmartAccountContract(): Promise<SmartWalletContractV100> {
    if (this.accountContract == null) {
      // may rename if to account factory
      this.accountContract = SmartWalletFactoryV100.connect(
        await this.getAccountAddress(),
        this.provider
      )
    }
    return this.accountContract
  }

  async init(): Promise<this> {
    // Check entry point must be deployed
    /*
    if (await this.provider.getCode(this.entryPoint.address) === '0x') {
      throw new Error(`entryPoint not deployed at ${this.entryPoint.address}`)
    }
    */
    await this.getAccountAddress()
    return this
  }

  /**
   * return the value to put into the "initCode" field, if the contract is not yet deployed.
   * this value holds the "factory" address, followed by this account's information
   */
  abstract getAccountInitCode (): Promise<string>

  /**
   * return current account's nonce.
   */
  // review : may not keep the batchId in contracts
  abstract nonce(): Promise<BigNumber>

  /**
   * create a UserOperation, filling all details (except signature)
   * - if account is not yet created, add initCode to deploy it.
   * - if gas or nonce are missing, read them from the chain (note that we can't fill gaslimit before the account is created)
   * @param info
   */
  // UserOperation = UserOperationStruct // if anything changes changes in core-types
  abstract createUnsignedUserOp(info: TransactionDetailsForBatchUserOp): Promise<UserOperation>

  /**
   * encode the call from entryPoint through our wallet to the target contract.
   * @param target
   * @param value
   * @param data
   * @param isDelegateCall // added by Biconomy
   */
  // abstract encodeExecute(
  //   target: string,
  //   value: BigNumberish,
  //   data: string,
  //   isDelegateCall: boolean
  // ): Promise<string>

  abstract encodeExecuteCall(target: string, value: BigNumberish, data: BytesLike): Promise<string>
  
  abstract encodeExecuteBatchCall(target: string[], value: BigNumberish[], data: BytesLike[]): Promise<string>

  /**
   * sign a userOp's hash (userOpHash).
   * @param userOpHash
   */
  abstract signUserOpHash (userOpHash: string): Promise<string>

  /**
   * should cover cost of putting calldata on-chain, and some overhead.
   * actual overhead depends on the expected bundle size
   */
  abstract getPreVerificationGas (userOp: Partial<UserOperation>): Promise<number>

  /**
   * return maximum gas used for verification.
   * NOTE: createUnsignedUserOp will add to this value the cost of creation, if the contract is not yet created.
   */
  abstract getVerificationGasLimit (): Promise<BigNumberish> 

  /**
   * check if the wallet is already deployed.
   */
  async checkAccountDeployed(): Promise<boolean> {
    if (this.isDeployed) {
      // already deployed. no need to check anymore.
      return this.isDeployed
    }
    const senderAddressCode = await this.provider.getCode(this.getAccountAddress())
    if (senderAddressCode.length > 2) {
      console.log(`Smart account Contract already deployed at ${this.senderAddress}`)
      this.isDeployed = true
    } else {
    }
    return this.isDeployed
  }

  /**
   * calculate the wallet address even before it is deployed
   */
  async getCounterFactualAddress(): Promise<string> {
    const initCode = await this.getAccountInitCode()
    // use entryPoint to query account address (factory can provide a helper method to do the same, but
    // this method attempts to be generic
    try {
      await this.entryPoint.callStatic.getSenderAddress(initCode)
    } catch (e: any) {
      return e.errorArgs.sender
    }
    throw new Error('must handle revert')
  }

  /**
   * return initCode value to into the UserOp.
   * (either deployment code, or empty hex if contract already deployed)
   */
  async getInitCode(): Promise<string> {
    if (!(await this.checkAccountDeployed())) {
      return await this.getAccountInitCode()
    }
    return '0x'
  }

  /**
   * ABI-encode a user operation. used for calldata cost estimation
   */
  packUserOp (userOp: NotPromise<UserOperation>): string {
    return packUserOp(userOp, false)
  }

  async encodeUserOpCallDataAndGasLimit(
    detailsForUserOp: TransactionDetailsForBatchUserOp
  ): Promise<{ callData: string; callGasLimit: BigNumber }> {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    function parseNumber(a: any): BigNumber | null {
      if (a == null || a === '') return null
      return BigNumber.from(a.toString())
    }

    let callData
    if ( detailsForUserOp.target.length == 1 )
    {
      if (detailsForUserOp && detailsForUserOp.target[0] === '' && detailsForUserOp.data[0] === '') {
        return {
          callData: '0x',
          callGasLimit: BigNumber.from('21000')
        }
      }
      const value = parseNumber(detailsForUserOp.value[0]) ?? BigNumber.from(0)
      callData = await this.encodeExecuteCall(
        detailsForUserOp.target[0],
        value,
        detailsForUserOp.data[0],
      )
    }
    else{
      callData = await this.encodeExecuteBatchCall(
        detailsForUserOp.target,
        detailsForUserOp.value,
        detailsForUserOp.data,
      )
    }

    let callGasLimit = BigNumber.from(0)

    console.log('detailsForUserOp.gasLimit ', detailsForUserOp.gasLimit);
    if (!detailsForUserOp.gasLimit){
        console.log('GasLimit is not defined');
        // TODO : error handling
        // Capture the failure and throw message
        callGasLimit = (await this.provider.estimateGas({
          from: this.entryPoint.address,
          to: this.getAccountAddress(),
          data: callData
        }))
        // if wallet is not deployed we need to multiply estimated limit to 3 times to get accurate callGasLimit
        if (!this.isDeployed)
        callGasLimit = callGasLimit.add(500000)
      }else{
        callGasLimit = BigNumber.from(detailsForUserOp.gasLimit)
      }

    return {
      callData,
      callGasLimit
    }
  }

  /**
   * return userOpHash for signing.
   * This value matches entryPoint.getUserOpHash (calculated off-chain, to avoid a view call)
   * @param userOp userOperation, (signature field ignored)
   */
  async getUserOpHash (userOp: UserOperation): Promise<string> {
    const op = await resolveProperties(userOp)
    const chainId = await this.provider.getNetwork().then(net => net.chainId)
    return getUserOpHash(op, this.entryPoint.address, chainId)
  }

  /**
   * return the wallet's address.
   * this value is valid even before deploying the wallet.
   */
  async getAccountAddress(): Promise<string> {
    if (this.senderAddress == null) {
      if (this.accountAddress != null) {
        this.senderAddress = this.accountAddress
      } else {
        this.senderAddress = await this.getCounterFactualAddress()
      }
    }
    return this.senderAddress
  }

  async estimateCreationGas (initCode?: string): Promise<BigNumberish> {
    if (initCode == null || initCode === '0x') return 0
    const deployerAddress = initCode.substring(0, 42)
    const deployerCallData = '0x' + initCode.substring(42)
    return await this.provider.estimateGas({ to: deployerAddress, data: deployerCallData })
  }

  /**
   * Sign the filled userOp.
   * @param userOp the UserOperation to sign (with signature field ignored)
   */
  async signUserOp(userOp: UserOperation): Promise<UserOperation> {
    console.log('inside signUserOp')
    const userOpHash = await this.getUserOpHash(userOp)
    const signature = await this.signUserOpHash(userOpHash)
    return {
      ...userOp,
      signature
    }
  }

  /**
   * helper method: create and sign a user operation.
   * @param info transaction details for the userOp
   */
  async createSignedUserOp (info: TransactionDetailsForBatchUserOp): Promise<UserOperation> {
    return await this.signUserOp(await this.createUnsignedUserOp(info))
  }

  /**
   * get the transaction that has this userOpHash mined, or null if not found
   * @param userOpHash returned by sendUserOpToBundler (or by getUserOpHash..)
   * @param timeout stop waiting after this timeout
   * @param interval time to wait between polls.
   * @return the transactionHash this userOp was mined, or null if not found.
   */
  async getUserOpReceipt (userOpHash: string, timeout = 30000, interval = 5000): Promise<string | null> {
    const endtime = Date.now() + timeout
    while (Date.now() < endtime) {
      // Review entryPointView -> entryPoint
      const events = await this.entryPoint.queryFilter(this.entryPoint.filters.UserOperationEvent(userOpHash))
      if (events.length > 0) {
        return events[0].transactionHash
      }
      await new Promise(resolve => setTimeout(resolve, interval))
    }
    return null
  }
}
