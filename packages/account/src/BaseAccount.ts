import { JsonRpcProvider } from '@ethersproject/providers'
import { ethers, BigNumber, BigNumberish, Signer, BytesLike } from 'ethers'
import { ISmartAccount } from './interfaces/IBaseAccount'
import { defaultAbiCoder, keccak256, arrayify } from 'ethers/lib/utils'
import { UserOperation, ChainId } from '@biconomy/core-types'
import { calcPreVerificationGas, DefaultGasLimits } from './utils/Preverificaiton'
import { packUserOp } from '@biconomy/common'
import { DEFAULT_CALL_GAS_LIMIT, DEFAULT_VERIFICATION_GAS_LIMIT, DEFAULT_PRE_VERIFICATION_GAS, EIP1559_UNSUPPORTED_NETWORKS } from './utils/Constants'
import { IBundler, Bundler } from '@biconomy/bundler'
import { IPaymasterAPI } from '@biconomy/paymaster'
import {
    EntryPoint_v100,
    SmartAccount_v100,
} from '@biconomy/common'
import { SmartAccountConfig } from './utils/Types'
export const DEFAULT_USER_OP: UserOperation = {
    sender: ethers.constants.AddressZero,
    nonce: ethers.constants.Zero,
    initCode: ethers.utils.hexlify("0x"),
    callData: ethers.utils.hexlify("0x"),
    callGasLimit: DEFAULT_CALL_GAS_LIMIT,
    verificationGasLimit: DEFAULT_VERIFICATION_GAS_LIMIT,
    preVerificationGas: DEFAULT_PRE_VERIFICATION_GAS,
    maxFeePerGas: ethers.constants.Zero,
    maxPriorityFeePerGas: ethers.constants.Zero,
    paymasterAndData: ethers.utils.hexlify("0x"),
    signature: ethers.utils.hexlify("0x"),
}

export abstract class SmartAccount implements ISmartAccount {
    bundler!: IBundler
    paymaster!: IPaymasterAPI
    initCode: string = '0x'
    proxy!: SmartAccount_v100
    provider!: JsonRpcProvider
    entryPoint!: EntryPoint_v100
    chainId!: ChainId
    signer!: Signer

    constructor(readonly smartAccountConfig: SmartAccountConfig) {
        const { bundlerUrl, epAddress } = smartAccountConfig
        if (bundlerUrl)
            this.bundler = new Bundler({
                bundlerUrl,
                epAddress
            })
    }

    async estimateUserOpGas(userOp: UserOperation): Promise<UserOperation> {
        if (!userOp.callData)
            throw new Error("calldata is not present for estimation")
        if (!this.bundler) {
            // if no bundler url is provided run offchain logic to assign following values of user
            // maxFeePerGas, maxPriorityFeePerGas, verificationGasLimit, callGasLimit, preVerificationGas
            const feeData = await this.provider.getFeeData()
            if (EIP1559_UNSUPPORTED_NETWORKS.includes(this.chainId)) {
                // assign gasPrice to both maxFeePerGas and maxPriorityFeePerGas in case chain does not support Type2 transaction
                userOp.maxFeePerGas = userOp.maxPriorityFeePerGas = feeData.gasPrice ?? await this.provider.getGasPrice()
            } else {
                if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas)
                    throw new Error("Unable to get maxFeePerGas and maxPriorityFeePerGas from provider")
                userOp.maxFeePerGas = feeData.maxFeePerGas
                userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
            }
            userOp.verificationGasLimit = await this.getVerificationGasLimit()
            userOp.callGasLimit = await this.provider.estimateGas({
                from: this.smartAccountConfig.epAddress,
                to: userOp.sender,
                data: userOp.callData
            })
            userOp.preVerificationGas = this.getPreVerificationGas(userOp)
        }
        const userOpGasEstimatesResonse = await this.bundler.getUserOpGasFields(userOp, this.chainId)
        console.log('userOpGasEstimatesResonse ', userOpGasEstimatesResonse);
        const { callGasLimit, verificationGasLimit, preVerificationGas, gasPrice, maxFeePerGas, maxPriorityFeePerGas } = userOpGasEstimatesResonse.result
        if (gasPrice)
            userOp.maxFeePerGas = userOp.maxPriorityFeePerGas = gasPrice
        else {
            userOp.maxFeePerGas = maxFeePerGas
            userOp.maxPriorityFeePerGas = maxPriorityFeePerGas
        }
        userOp.verificationGasLimit = verificationGasLimit
        userOp.callGasLimit = callGasLimit
        userOp.preVerificationGas = preVerificationGas
        return userOp
    }

    async getPaymasterAndData(userOp: UserOperation): Promise<UserOperation> {
        console.log('paymaster state ', this.paymaster);
        if (this.paymaster) {
            userOp.paymasterAndData = await this.paymaster.getPaymasterAndData(userOp)
        }
        return userOp
    }

    nonce(): Promise<BigNumber> {
        return this.proxy.nonce()
    }

    async signUserOpHash(userOpHash: string, signer: Signer): Promise<string> {
        if (!signer)
            throw new Error("No signer provided to sign userOp")
        return await signer.signMessage(arrayify(userOpHash))
    }

    getPreVerificationGas(userOp: Partial<UserOperation>): number {
        return calcPreVerificationGas(userOp)
    }

    async getVerificationGasLimit(): Promise<BigNumberish> {
        // Verification gas should be max(initGas(wallet deployment) + validateUserOp + validatePaymasterUserOp , postOp)    
        const initGas = await this.estimateCreationGas()
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

    async getUserOpHash(userOp: UserOperation): Promise<string> {
        const userOpHash = keccak256(packUserOp(userOp, true))
        const enc = defaultAbiCoder.encode(
            ['bytes32', 'address', 'uint256'],
            [userOpHash, this.entryPoint.address, this.chainId]
        )
        return keccak256(enc)
    }

    getSmartAccountAddress(): string {
        return this.proxy.address
    }

    async estimateCreationGas(): Promise<BigNumberish> {
        const deployerAddress = this.initCode.substring(0, 42)
        const deployerCallData = '0x' + this.initCode.substring(42)
        return await this.provider.estimateGas({ to: deployerAddress, data: deployerCallData })
    }

    async signUserOp(userOp: UserOperation): Promise<UserOperation> {
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
        console.log(userOp);
        return userOp
    }

    async sendUserOp(userOp: UserOperation): Promise<void> {
        if (!this.bundler)
            throw new Error('Bundler url is not provided')
        await this.bundler.sendUserOp(userOp, this.chainId)
    }
    async sendSignedUserOp(userOp: UserOperation): Promise<void> {
        let userOperation = await this.signUserOp(userOp)
        await this.sendUserOp(userOperation)
    }
}