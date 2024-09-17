import {
    type Address,
    concat,
    concatHex,
    decodeAbiParameters,
    encodeAbiParameters,
    encodeFunctionData,
    getAddress,
    parseAbi,
    parseAbiParameters
} from "viem"
import type { Hex } from "viem"
import type { NexusSmartAccount } from "../../account/NexusSmartAccount.js"
import { OWNABLE_VALIDATOR_ADDRESS, SENTINEL_ADDRESS, UserOperationStruct } from "../../account/index.js"
import type { UserOpReceipt } from "../../bundler/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import type { Module } from "../utils/Types.js"

export class OwnableValidator extends BaseValidationModule {
    public smartAccount: NexusSmartAccount
    public owners: Address[]
    public threshold: number
    private _multiSignature: Hex | null = null

    private constructor(
        moduleConfig: Module,
        smartAccount: NexusSmartAccount
    ) {
        if (!moduleConfig.data) {
            throw new Error("Module data is required")
        }
        const moduleData = decodeAbiParameters(
            parseAbiParameters("uint256 threshold, address[] owners"),
            moduleConfig.data
        )
        super(moduleConfig, smartAccount.getSmartAccountOwner())
        this.threshold = Number(moduleData[0])
        this.owners = [...moduleData[1]] as Address[]
        this.smartAccount = smartAccount
    }

    public static async create(
        smartAccount: NexusSmartAccount,
        owners: Address[],
        threshold?: number,
        hook?: Address
    ): Promise<OwnableValidator> {
        if (
            !owners.includes(await smartAccount.getSmartAccountOwner().getAddress())
        ) {
            throw Error("Signer needs to be one of the owners")
        }
        const installData = encodeAbiParameters(
            [
                { name: "threshold", type: "uint256" },
                { name: "owners", type: "address[]" }
            ],
            [BigInt(threshold ?? owners.length), owners]
        )
        const moduleInfo: Module = {
            moduleAddress: OWNABLE_VALIDATOR_ADDRESS,
            type: "validator",
            data: installData,
            additionalContext: "0x",
            hook
        }
        const instance = new OwnableValidator(moduleInfo, smartAccount)
        return instance
    }

    private async executeTransaction(transaction: { to: Address, data: Hex, value: bigint }): Promise<UserOpReceipt> {
        let receipt: UserOpReceipt

        if (this.isMultiSig()) {
            if (!this._multiSignature) {
                throw new Error("Multi-signature required but not set. Use setMultiSignature() before executing the transaction.")
            }
            const userOp = await this.smartAccount.buildUserOp([transaction])
            userOp.signature = this._multiSignature
            const response = await this.smartAccount.sendUserOp(userOp)
            receipt = await response.wait()
            this._multiSignature = null // Reset after use
        } else {
            const response = await this.smartAccount.sendTransaction([transaction])
            receipt = await response.wait()
        }

        return receipt
    }

    /**
     * Sets the threshold locally on the instance without executing a transaction.
     * This method should be used when the threshold has been updated on-chain but the local instance hasn't been updated.
     * 
     * @param threshold The new threshold value
     */
    public setLocalThreshold(threshold: number): void {
        if (threshold <= 0) {
            throw new Error("Threshold must be a positive number")
        }
        this.threshold = threshold
    }

    public async setThreshold(threshold: number): Promise<UserOpReceipt> {
        const calldata = encodeFunctionData({
            functionName: "setThreshold",
            abi: parseAbi(["function setThreshold(uint256 _threshold) external"]),
            args: [BigInt(threshold)]
        })
        const transaction = {
            to: this.moduleAddress,
            data: calldata,
            value: 0n
        }
        const receipt = await this.executeTransaction(transaction)
        if (receipt.success) {
            this.threshold = threshold
        }
        return receipt
    }

    public async getSetThresholdUserOp(threshold: number): Promise<Partial<UserOperationStruct>> {
        const calldata = encodeFunctionData({
            functionName: "setThreshold",
            abi: parseAbi(["function setThreshold(uint256 _threshold) external"]),
            args: [BigInt(threshold)]
        })

        const transaction = {
            to: this.moduleAddress,
            data: calldata,
            value: 0n
        }
        const userOp = await this.smartAccount.buildUserOp([transaction]);
        return userOp
    }

    public async removeOwner(owner: Address): Promise<UserOpReceipt> {
        const owners = await this.getOwners()
        let prevOwner: Address

        const currentOwnerIndex = owners.findIndex((o: Address) => o === owner)

        if (currentOwnerIndex === -1) {
            throw new Error("Owner not found")
        }
        if (currentOwnerIndex === 0) {
            prevOwner = SENTINEL_ADDRESS
        } else {
            prevOwner = getAddress(owners[currentOwnerIndex - 1])
        }

        const calldata = encodeFunctionData({
            functionName: "removeOwner",
            abi: parseAbi(["function removeOwner(address prevOwner, address owner)"]),
            args: [prevOwner, owner]
        })

        const transaction = {
            to: this.moduleAddress,
            data: calldata,
            value: 0n
        }

        const receipt = await this.executeTransaction(transaction)

        if (receipt.success) {
            this.owners = this.owners.filter((o: Address) => o !== owner)
        }
        return receipt
    }

    public async getRemoveOwnerUserOp(owner: Address): Promise<Partial<UserOperationStruct>> {
        const owners = await this.getOwners()
        let prevOwner: Address

        const currentOwnerIndex = owners.findIndex((o: Address) => o === owner)

        if (currentOwnerIndex === -1) {
            throw new Error("Owner not found")
        }
        if (currentOwnerIndex === 0) {
            prevOwner = SENTINEL_ADDRESS
        } else {
            prevOwner = getAddress(owners[currentOwnerIndex - 1])
        }

        const calldata = encodeFunctionData({
            functionName: "removeOwner",
            abi: parseAbi(["function removeOwner(address prevOwner, address owner)"]),
            args: [prevOwner, owner]
        })

        const transaction = {
            to: this.moduleAddress,
            data: calldata,
            value: 0n
        }

        const userOp = await this.smartAccount.buildUserOp([transaction]);
        return userOp
    }

    public async addOwner(owner: Address): Promise<UserOpReceipt> {
        const calldata = encodeFunctionData({
            functionName: "addOwner",
            abi: parseAbi(["function addOwner(address owner)"]),
            args: [owner]
        })

        const transaction = {
            to: this.moduleAddress,
            data: calldata,
            value: 0n
        }

        const receipt = await this.executeTransaction(transaction)

        if (receipt.success) {
            this.owners.push(owner)
        }
        return receipt
    }

    public async getAddOwnerUserOp(owner: Address): Promise<Partial<UserOperationStruct>> {
        const calldata = encodeFunctionData({
            functionName: "addOwner",
            abi: parseAbi(["function addOwner(address owner)"]),
            args: [owner]
        })

        const transaction = {
            to: this.moduleAddress,
            data: calldata,
            value: 0n
        }
        const userOp = await this.smartAccount.buildUserOp([transaction]);
        return userOp
    }

    public async getOwners(): Promise<Address[]> {
        try {
            const owners = (await this.smartAccount.publicClient.readContract({
                address: OWNABLE_VALIDATOR_ADDRESS,
                abi: parseAbi([
                    "function getOwners(address account) external view returns (address[])"
                ]),
                functionName: "getOwners",
                args: [await this.smartAccount.getAccountAddress()]
            })) as Address[]

            return owners
        } catch (err) {
            console.error(err)
            return []
        }
    }

    public async isOwner(address: Address): Promise<boolean> {
        const owners = await this.getOwners();
        return owners.includes(address);
    }

    public getDummySignature(): Hex {
        const dummySignature = "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c";
        const signatures = Array(this.threshold).fill(dummySignature);
        return concat(signatures) as Hex;
    }

    async signUserOpHash(userOpHash: string): Promise<Hex> {
        if (this.isMultiSig()) {
            console.log("Is multi sig");
            if (!this._multiSignature) {
                throw new Error("Multi-signature required but not set")
            }
            return this._multiSignature;
        } else {
            return await this.signer.signMessage({ raw: userOpHash as Hex }) as Hex;
        }
    }

    private isMultiSig(): boolean {
        return this.threshold > 1;
    }

    public setMultiSignature(signature: Hex): void {
        if (!this.isMultiSig()) {
            throw new Error("Cannot set multi-signature for non-multi-sig account")
        }
        this._multiSignature = signature;
    }

    public getMultiSignature(): Hex | null {
        return this._multiSignature;
    }
}
