import { JsonRpcProvider } from '@ethersproject/providers'
import { ethers, BigNumber, Signer, BytesLike } from 'ethers'
import { ISmartAccount } from './interfaces/IBaseAccount'
import { defaultAbiCoder, keccak256, arrayify, isBytesLike } from 'ethers/lib/utils'
import { UserOperation, ChainId } from '@biconomy/core-types'
import { calcPreVerificationGas, DefaultGasLimits } from './utils/Preverificaiton'
import { packUserOp } from '@biconomy/common'
import {
  DEFAULT_CALL_GAS_LIMIT,
  DEFAULT_VERIFICATION_GAS_LIMIT,
  DEFAULT_PRE_VERIFICATION_GAS,
  EIP1559_UNSUPPORTED_NETWORKS
} from './utils/Constants'
import { IBundler, UserOpResponse } from '@biconomy/bundler'
import { IPaymasterAPI } from '@biconomy/paymaster'
import { EntryPoint_v100, SmartAccount_v100 } from '@biconomy/common'
import { SmartAccountConfig } from './utils/Types'
export const DEFAULT_USER_OP: UserOperation = {
  sender: ethers.constants.AddressZero,
  nonce: ethers.constants.Zero,
  initCode: ethers.utils.hexlify('0x'),
  callData: ethers.utils.hexlify('0x'),
  callGasLimit: DEFAULT_CALL_GAS_LIMIT,
  verificationGasLimit: DEFAULT_VERIFICATION_GAS_LIMIT,
  preVerificationGas: DEFAULT_PRE_VERIFICATION_GAS,
  maxFeePerGas: ethers.constants.Zero,
  maxPriorityFeePerGas: ethers.constants.Zero,
  paymasterAndData: ethers.utils.hexlify('0x'),
  signature: ethers.utils.hexlify('0x')
}
type UserOperationKey = keyof UserOperation

export abstract class SmartAccount implements ISmartAccount {
  bundler!: IBundler
  paymaster!: IPaymasterAPI
  initCode: string = '0x'
  proxy!: SmartAccount_v100
  provider!: JsonRpcProvider
  entryPoint!: EntryPoint_v100
  chainId!: ChainId
  signer!: Signer

  constructor(readonly smartAccountConfig: SmartAccountConfig) {}

  private validateUserOp(userOp: UserOperation, requiredFields: UserOperationKey[]): boolean {
    for (let field of requiredFields) {
      if (!userOp[field]) {
        throw new Error(`${userOp[field]} is missing or have invalid value`)
      }
    }
    return true
  }

  isProxyDefine(): boolean {
    if (!this.proxy) throw new Error('Proxy is undefined')

    return true
  }

  isSignerDefine(): boolean {
    if (!this.signer) throw new Error('Signer is undefined')

    return true
  }

  isProviderDefine(): boolean {
    if (!this.provider) throw new Error('Provider is undefined')

    return true
  }

  async estimateUserOpGas(userOp: UserOperation): Promise<UserOperation> {
    const requiredFields: UserOperationKey[] = [
      'sender',
      'nonce',
      'initCode',
      'callData',
      'callGasLimit',
      'paymasterAndData'
    ]
    this.validateUserOp(userOp, requiredFields)
    if (!this.bundler) {
      if (!this.provider) throw new Error('Provider is not present for making rpc calls')
      // if no bundler url is provided run offchain logic to assign following values of user
      // maxFeePerGas, maxPriorityFeePerGas, verificationGasLimit, callGasLimit, preVerificationGas
      const feeData = await this.provider.getFeeData()
      if (EIP1559_UNSUPPORTED_NETWORKS.includes(this.chainId)) {
        // assign gasPrice to both maxFeePerGas and maxPriorityFeePerGas in case chain does not support Type2 transaction
        userOp.maxFeePerGas = userOp.maxPriorityFeePerGas =
          feeData.gasPrice ?? (await this.provider.getGasPrice())
      } else {
        if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas)
          throw new Error('Unable to get maxFeePerGas and maxPriorityFeePerGas from provider')
        userOp.maxFeePerGas = feeData.maxFeePerGas
        userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
      }
      userOp.verificationGasLimit = await this.getVerificationGasLimit(userOp.initCode)
      userOp.callGasLimit = await this.provider.estimateGas({
        from: this.smartAccountConfig.epAddress,
        to: userOp.sender,
        data: userOp.callData
      })
      userOp.preVerificationGas = this.getPreVerificationGas(userOp)
    } else {
      // Making call to bundler to get gas estimations for userOp
      const gasEstimationResponse = await this.bundler.getUserOpGasFields(userOp, this.chainId)
      const {
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas
      } = gasEstimationResponse.result
      if (gasPrice) userOp.maxFeePerGas = userOp.maxPriorityFeePerGas = gasPrice
      else {
        userOp.maxFeePerGas = maxFeePerGas
        userOp.maxPriorityFeePerGas = maxPriorityFeePerGas
      }
      userOp.verificationGasLimit = verificationGasLimit
      userOp.callGasLimit = callGasLimit
      userOp.preVerificationGas = preVerificationGas
    }
    return userOp
  }

  async getPaymasterAndData(userOp: UserOperation): Promise<UserOperation> {
    if (this.paymaster) {
      userOp.paymasterAndData = await this.paymaster.getPaymasterAndData(userOp)
    }
    return userOp
  }

  nonce(): Promise<BigNumber> {
    this.isProxyDefine()
    return this.proxy.nonce()
  }

  async signUserOpHash(userOpHash: string, signer?: Signer): Promise<string> {
    if (signer) {
      return signer.signMessage(arrayify(userOpHash))
    }
    if (this.signer) {
      return this.signer.signMessage(arrayify(userOpHash))
    }
    throw new Error('No signer provided to sign userOp')
  }

  getPreVerificationGas(userOp: Partial<UserOperation>): BigNumber {
    return calcPreVerificationGas(userOp)
  }

  async getVerificationGasLimit(initCode: BytesLike): Promise<BigNumber> {
    // Verification gas should be max(initGas(wallet deployment) + validateUserOp + validatePaymasterUserOp , postOp)
    const initGas = await this.estimateCreationGas(initCode)
    console.log('initgas estimated is ', initGas)

    let verificationGasLimit = initGas
    const validateUserOpGas = BigNumber.from(
      DefaultGasLimits.validatePaymasterUserOpGas + DefaultGasLimits.validateUserOpGas
    )
    const postOpGas = BigNumber.from(DefaultGasLimits.postOpGas)

    verificationGasLimit = BigNumber.from(validateUserOpGas).add(initGas)

    if (BigNumber.from(postOpGas).gt(verificationGasLimit)) {
      verificationGasLimit = postOpGas
    }
    return verificationGasLimit
  }

  async getUserOpHash(userOp: UserOperation): Promise<string> {
    const userOpHash = keccak256(packUserOp(userOp, true))
    const enc = defaultAbiCoder.encode(
      ['bytes32', 'address', 'uint256'],
      [userOpHash, this.entryPoint.address, this.chainId]
    )
    return keccak256(enc)
  }

  abstract getSmartAccountAddress(accountIndex: number): Promise<string>

  async estimateCreationGas(initCode: BytesLike): Promise<BigNumber> {
    if (!initCode) throw new Error('Init code is not present for account creation gas estimation')
    if (isBytesLike(initCode)) {
      initCode = ethers.utils.toUtf8String(initCode)
    }
    const deployerAddress = initCode.substring(0, 42)
    const deployerCallData = '0x' + initCode.substring(42)
    return await this.provider.estimateGas({ to: deployerAddress, data: deployerCallData })
  }

  async signUserOp(userOp: UserOperation): Promise<UserOperation> {
    const requiredFields: UserOperationKey[] = [
      'sender',
      'nonce',
      'initCode',
      'callData',
      'callGasLimit',
      'verificationGasLimit',
      'preVerificationGas',
      'maxFeePerGas',
      'maxPriorityFeePerGas',
      'paymasterAndData'
    ]
    this.validateUserOp(userOp, requiredFields)
    const userOpHash = await this.getUserOpHash(userOp)
    let signature = await this.signUserOpHash(userOpHash, this.signer)
    const potentiallyIncorrectV = parseInt(signature.slice(-2), 16)
    if (![27, 28].includes(potentiallyIncorrectV)) {
      const correctV = potentiallyIncorrectV + 27
      signature = signature.slice(0, -2) + correctV.toString(16)
    }
    if (signature.slice(0, 2) !== '0x') signature = '0x' + signature
    console.log('userOp signature: ', signature)
    userOp.signature = signature
    console.log(userOp)
    return userOp
  }

  async sendUserOp(userOp: UserOperation): Promise<UserOpResponse> {
    const requiredFields: UserOperationKey[] = [
      'sender',
      'nonce',
      'initCode',
      'callData',
      'callGasLimit',
      'verificationGasLimit',
      'preVerificationGas',
      'maxFeePerGas',
      'maxPriorityFeePerGas',
      'paymasterAndData',
      'signature'
    ]
    this.validateUserOp(userOp, requiredFields)
    if (!this.bundler) throw new Error('Bundler url is not provided')
    const bundlerResponse = await this.bundler.sendUserOp(userOp, this.chainId)
    return bundlerResponse
  }
  async sendSignedUserOp(userOp: UserOperation): Promise<UserOpResponse> {
    let userOperation = await this.signUserOp(userOp)
    const bundlerResponse = await this.sendUserOp(userOperation)
    return bundlerResponse
  }
}
