import {
    type Address,
    concat,
    decodeAbiParameters,
    encodeAbiParameters,
    encodeFunctionData,
    encodePacked,
    getAddress,
    parseAbi,
    parseAbiParameters
} from "viem"
import type { Hex } from "viem"
import type { NexusSmartAccount } from "../../account/NexusSmartAccount.js"
import { SENTINEL_ADDRESS, type UserOperationStruct } from "../../account/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import type { Module } from "../utils/Types.js"

export class OwnableValidator extends BaseValidationModule {
    public smartAccount: NexusSmartAccount
    public owners: Address[]
    public threshold: number

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
        this.moduleAddress = moduleConfig.moduleAddress
    }

    public static async create(
        smartAccount: NexusSmartAccount,
        address: Address,
        owners: Address[],
        threshold?: number,
        hook?: Address
    ): Promise<OwnableValidator> {
        let moduleInfo: Module
        let installData: Hex
        if (
            !owners.includes(await smartAccount.getSmartAccountOwner().getAddress())
        ) {
            throw Error("Signer needs to be one of the owners")
        }
        const isInitialized = await smartAccount.publicClient.readContract({
            address, // @todo: change to real module address
            abi: parseAbi([
                "function isInitialized(address smartAccount) public view returns (bool)"
            ]),
            functionName: "isInitialized",
            args: [await smartAccount.getAddress()]
        })
        if (isInitialized) {
            const _owners = await smartAccount.publicClient.readContract({
                address, // @todo: change to real module address
                abi: parseAbi([
                    "function getOwners(address account) external view returns (address[])"
                ]),
                functionName: "getOwners",
                args: [await smartAccount.getAddress()]
            })
            const _threshold = await smartAccount.publicClient.readContract({
                address, // @todo: change to real module address
                abi: parseAbi([
                    "function getThreshold() external view returns (uint256)"
                ]),
                functionName: "getThreshold",
                args: []
            })
            installData = encodeAbiParameters(
                [
                    { name: "threshold", type: "uint256" },
                    { name: "owners", type: "address[]" }
                ],
                [BigInt(_threshold), _owners]
            )
        } else {
            installData = encodeAbiParameters(
                [
                    { name: "threshold", type: "uint256" },
                    { name: "owners", type: "address[]" }
                ],
                [BigInt(threshold ?? owners.length), owners]
            )
        }
        moduleInfo = {
            moduleAddress: address, // @todo: change to real module address
            type: "validator",
            data: installData,
            additionalContext: "0x",
            hook
        }
        const instance = new OwnableValidator(moduleInfo, smartAccount)
        return instance
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

    public async setThresholdUserOp(threshold: number): Promise<Partial<UserOperationStruct>> {
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

    public async removeOwnerUserOp(owner: Address): Promise<Partial<UserOperationStruct>> {
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

    public async addOwnerUserOp(owner: Address): Promise<Partial<UserOperationStruct>> {
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
                address: this.moduleAddress,
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

    public override getDummySignature(): Hex {
        const dummySignature = "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c";
        const signatures = Array(this.threshold).fill(dummySignature);
        return concat(signatures) as Hex;
    }

    override async signUserOpHash(userOpHash: string): Promise<Hex> {
        if (this.isMultiSig()) {
            throw new Error("Multi-signature required, please pass the multi-signature to the sendUserOp function")
        } else {
            return await this.signer.signMessage({ raw: userOpHash as Hex }) as Hex;
        }
    }

    private isMultiSig(): boolean {
        return this.threshold > 1;
    }

    public getMultiSignature(signatures: Hex[]): Hex {
        const types = Array(signatures.length).fill('bytes');
        return encodePacked(types, signatures) as Hex;
    }
}
