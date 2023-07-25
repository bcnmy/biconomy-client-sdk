import { JsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, Signer, BytesLike } from 'ethers'
import { ISmartAccount } from './interfaces/ISmartAccount'
import { defaultAbiCoder, keccak256, arrayify } from 'ethers/lib/utils'
import { UserOperation, ChainId } from '@biconomy/core-types'
import { calcPreVerificationGas, DefaultGasLimits } from './utils/Preverificaiton'
import { packUserOp } from '@biconomy/common'

import { IBundler, UserOpResponse } from '@biconomy/bundler'
import { IPaymaster, PaymasterAndDataResponse } from '@biconomy/paymaster'
import { EntryPoint_v100, SmartAccount_v100, Logger } from '@biconomy/common'
import { SmartAccountConfig, Overrides } from './utils/Types'

type UserOperationKey = keyof UserOperation

export abstract class SmartAccount implements ISmartAccount {
  bundler!: IBundler
  paymaster!: IPaymaster
  initCode = '0x'
  proxy!: SmartAccount_v100
  owner!: string
  provider!: JsonRpcProvider
  entryPoint!: EntryPoint_v100
  chainId!: ChainId
  signer!: Signer
  smartAccountConfig: SmartAccountConfig

  constructor(_smartAccountConfig: SmartAccountConfig) {
    this.smartAccountConfig = _smartAccountConfig
  }

  setEntryPointAddress(entryPointAddress: string) {
    this.smartAccountConfig.entryPointAddress = entryPointAddress
  }

  private validateUserOp(
    userOp: Partial<UserOperation>,
    requiredFields: UserOperationKey[]
  ): boolean {
    for (const field of requiredFields) {
      if (!userOp[field]) {
        throw new Error(`${field} is missing`)
      }
    }
    return true
  }

  isProxyDefined(): boolean {
    if (!this.proxy) throw new Error('Proxy is undefined')

    return true
  }

  isSignerDefined(): boolean {
    if (!this.signer) throw new Error('Signer is undefined')

    return true
  }

  isProviderDefined(): boolean {
    if (!this.provider) throw new Error('Provider is undefined')

    return true
  }

  abstract getDummySignature(): string

  async calculateUserOpGasValues(userOp: Partial<UserOperation>): Promise<Partial<UserOperation>> {
    if (!this.provider) throw new Error('Provider is not present for making rpc calls')
    const feeData = await this.provider.getFeeData()
    userOp.maxFeePerGas =
      userOp.maxFeePerGas ??
      feeData.maxFeePerGas ??
      feeData.gasPrice ??
      (await this.provider.getGasPrice())
    userOp.maxPriorityFeePerGas =
      userOp.maxPriorityFeePerGas ??
      feeData.maxPriorityFeePerGas ??
      feeData.gasPrice ??
      (await this.provider.getGasPrice())
    if (userOp.initCode)
      userOp.verificationGasLimit =
        userOp.verificationGasLimit ?? (await this.getVerificationGasLimit(userOp.initCode))
    userOp.callGasLimit =
      userOp.callGasLimit ??
      (await this.provider.estimateGas({
        from: this.smartAccountConfig.entryPointAddress,
        to: userOp.sender,
        data: userOp.callData
      }))
    userOp.preVerificationGas = userOp.preVerificationGas ?? this.getPreVerificationGas(userOp)
    return userOp
  }

  async estimateUserOpGas(
    userOp: Partial<UserOperation>,
    overrides?: Overrides,
    skipBundlerGasEstimation?: boolean
  ): Promise<Partial<UserOperation>> {
    const requiredFields: UserOperationKey[] = ['sender', 'nonce', 'initCode', 'callData']
    this.validateUserOp(userOp, requiredFields)

    let finalUserOp = userOp
    const skipBundlerCall = skipBundlerGasEstimation ?? false
    // Override gas values in userOp if provided in overrides params
    if (overrides) {
      userOp = { ...userOp, ...overrides }
    }

    Logger.log('userOp in estimation', userOp)

    if (!this.bundler || skipBundlerCall) {
      if (!this.provider) throw new Error('Provider is not present for making rpc calls')
      // if no bundler url is provided run offchain logic to assign following values of UserOp
      // maxFeePerGas, maxPriorityFeePerGas, verificationGasLimit, callGasLimit, preVerificationGas
      finalUserOp = await this.calculateUserOpGasValues(userOp)
    } else {
      delete userOp.maxFeePerGas
      delete userOp.maxPriorityFeePerGas
      // Making call to bundler to get gas estimations for userOp
      const {
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas
      } = await this.bundler.estimateUserOpGas(userOp)
      if (
        !userOp.maxFeePerGas &&
        !userOp.maxPriorityFeePerGas &&
        (!maxFeePerGas || !maxPriorityFeePerGas)
      ) {
        const feeData = await this.provider.getFeeData()
        finalUserOp.maxFeePerGas =
          feeData.maxFeePerGas ?? feeData.gasPrice ?? (await this.provider.getGasPrice())
        finalUserOp.maxPriorityFeePerGas =
          feeData.maxPriorityFeePerGas ?? feeData.gasPrice ?? (await this.provider.getGasPrice())
      } else {
        finalUserOp.maxFeePerGas = maxFeePerGas ?? userOp.maxFeePerGas
        finalUserOp.maxPriorityFeePerGas = maxPriorityFeePerGas ?? userOp.maxPriorityFeePerGas
      }
      finalUserOp.verificationGasLimit = verificationGasLimit ?? userOp.verificationGasLimit
      finalUserOp.callGasLimit = callGasLimit ?? userOp.callGasLimit
      finalUserOp.preVerificationGas = preVerificationGas ?? userOp.preVerificationGas
    }
    return finalUserOp
  }

  async isAccountDeployed(address: string): Promise<boolean> {
    this.isProviderDefined()
    let contractCode
    try {
      contractCode = await this.provider.getCode(address)
      return contractCode !== '0x'
    } catch (error) {
      throw error
    }
  }

  // Would only be used if paymaster is attached
  async getPaymasterAndData(userOp: Partial<UserOperation>): Promise<string> {
    if (this.paymaster) {
      const paymasterAndDataResponse: PaymasterAndDataResponse =
        await this.paymaster.getPaymasterAndData(userOp)
      return paymasterAndDataResponse.paymasterAndData
    }
    return '0x'
  }

  nonce(): Promise<BigNumber> {
    this.isProxyDefined()
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

    const initGas = await this.estimateCreationGas(initCode as string)
    const validateUserOpGas = BigNumber.from(
      DefaultGasLimits.validatePaymasterUserOpGas + DefaultGasLimits.validateUserOpGas
    )
    const postOpGas = BigNumber.from(DefaultGasLimits.postOpGas)

    let verificationGasLimit = BigNumber.from(validateUserOpGas).add(initGas)

    if (BigNumber.from(postOpGas).gt(verificationGasLimit)) {
      verificationGasLimit = postOpGas
    }
    return verificationGasLimit
  }

  async getUserOpHash(userOp: Partial<UserOperation>): Promise<string> {
    const userOpHash = keccak256(packUserOp(userOp, true))
    const enc = defaultAbiCoder.encode(
      ['bytes32', 'address', 'uint256'],
      [userOpHash, this.entryPoint.address, this.chainId]
    )
    return keccak256(enc)
  }

  abstract getSmartAccountAddress(accountIndex: number): Promise<string>

  async estimateCreationGas(initCode: string): Promise<BigNumber> {
    if (initCode == null || initCode === '0x') return BigNumber.from('0')
    const deployerAddress = initCode.substring(0, 42)
    const deployerCallData = '0x' + initCode.substring(42)
    return await this.provider.estimateGas({ to: deployerAddress, data: deployerCallData })
  }

  async signUserOp(userOp: Partial<UserOperation>): Promise<UserOperation> {
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
    if (signature.slice(0, 2) !== '0x') {
      signature = '0x' + signature
    }
    userOp.signature = signature
    return userOp as UserOperation
  }

  /**
   *
   * @param userOp
   * @description This function call will take 'unsignedUserOp' as an input, sign it with the owner key, and send it to the bundler.
   * @returns Promise<UserOpResponse>
   */
  async sendUserOp(userOp: Partial<UserOperation>): Promise<UserOpResponse> {
    Logger.log('userOp received in base account ', userOp)
    delete userOp.signature
    const userOperation = await this.signUserOp(userOp)
    const bundlerResponse = await this.sendSignedUserOp(userOperation)
    return bundlerResponse
  }

  /**
   *
   * @param userOp
   * @description This function call will take 'signedUserOp' as input and send it to the bundler
   * @returns
   */
  async sendSignedUserOp(userOp: UserOperation): Promise<UserOpResponse> {
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
    Logger.log('userOp validated')
    if (!this.bundler) throw new Error('Bundler is not provided')
    Logger.log('userOp being sent to the bundler', userOp)
    const bundlerResponse = await this.bundler.sendUserOp(userOp)
    return bundlerResponse
  }
}
