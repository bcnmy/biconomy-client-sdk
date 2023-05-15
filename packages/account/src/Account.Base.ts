import { JsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, BigNumberish, Signer } from 'ethers'
import { IAccount } from './interfaces/IAccount.interface'
import { defaultAbiCoder, keccak256, arrayify } from 'ethers/lib/utils'
import { UserOperation } from '@biconomy/core-types'
import { calcPreVerificationGas, DefaultGasLimits } from './utils/Preverificaiton.gas'
import { packUserOp } from '@biconomy/common'
import {
    EntryPoint_v100,
    SmartAccount_v100,
} from '@biconomy/common'
export class Account implements IAccount {
    private initCode!: string
    private proxy!: SmartAccount_v100
    provider!: JsonRpcProvider
    entryPoint!: EntryPoint_v100

    constructor() {
    }
    setInitCode(_initCode: string) {
        this.initCode = _initCode
    }
    getInitCode(): string {
        return this.initCode
    }
    setProxy(_proxy: SmartAccount_v100) {
        this.proxy = _proxy
    }
    setProvider(_provider: JsonRpcProvider) {
        this.provider = _provider
    }
    setEntryPoint(_entryPoint: EntryPoint_v100) {
        this.entryPoint = _entryPoint
    }
    nonce(): Promise<BigNumber> {
        return this.proxy.nonce()
    }

    async signUserOpHash(userOpHash: string, signer: Signer): Promise<string> {
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
        const chainId = await this.provider.getNetwork().then((net) => net.chainId)
        const userOpHash = keccak256(packUserOp(userOp, true))
        const enc = defaultAbiCoder.encode(
            ['bytes32', 'address', 'uint256'],
            [userOpHash, this.entryPoint.address, chainId]
        )
        return keccak256(enc)
    }

    getAccountAddress(): string {
        return this.proxy.address
    }

    async estimateCreationGas(): Promise<BigNumberish> {
        const deployerAddress = this.initCode.substring(0, 42)
        const deployerCallData = '0x' + this.initCode.substring(42)
        return await this.provider.estimateGas({ to: deployerAddress, data: deployerCallData })
    }

}