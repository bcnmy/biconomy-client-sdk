import {
    type Address,
    decodeAbiParameters,
    encodeAbiParameters,
    encodePacked,
    parseAbi,
    parseAbiParameters
} from "viem"
import type { Hex, PublicClient } from "viem"
import { type NexusAccount, type Signer, toSigner } from "../../account/index.js"
import { BaseValidationModule } from "../base/BaseValidationModule.js"
import { type Module } from "../../clients/index.js"

export class OwnableValidator extends BaseValidationModule {
    public owners: Address[]
    public threshold: number

    private constructor(
        moduleConfig: Module,
        signer: Signer
    ) {
        if (!moduleConfig.data) {
            throw new Error("Module data is required")
        }
        const moduleData = decodeAbiParameters(
            parseAbiParameters("uint256 threshold, address[] owners"),
            moduleConfig.data
        )
        super(moduleConfig, signer)
        this.threshold = Number(moduleData[0])
        this.owners = [...moduleData[1]] as Address[]
        this.signer = signer
        // review
        this.address = moduleConfig.address
    }

    public static async create({
        smartAccount,
        address,
        owners,
        threshold,
        hook
    }: {
        smartAccount: NexusAccount,
        address: Address,
        owners?: Address[],
        threshold?: number,
        hook?: Address
    }): Promise<OwnableValidator> {
        let moduleInfo: Module
        let installData: Hex
        const client = smartAccount.client as PublicClient;
        const isInitialized = await client.readContract({
            address, // @todo: change to real module address
            abi: parseAbi([
                "function isInitialized(address smartAccount) public view returns (bool)"
            ]),
            functionName: "isInitialized",
            args: [await smartAccount.getAddress()]
        })
        if (isInitialized) {
            const _owners = await client.readContract({
                address, // @todo: change to real module address
                abi: parseAbi([
                    "function getOwners(address account) external view returns (address[])"
                ]),
                functionName: "getOwners",
                args: [await smartAccount.getAddress()]
            })
            const _threshold = await client.readContract({
                address, // @todo: change to real module address
                abi: parseAbi([
                    "function threshold(address account) external view returns (uint256)"
                ]),
                functionName: "threshold",
                args: [await smartAccount.getAddress()]
            })
            installData = encodeAbiParameters(
                [
                    { name: "threshold", type: "uint256" },
                    { name: "owners", type: "address[]" }
                ],
                [BigInt(_threshold), _owners]
            )
        } else {
            if (!owners) {
                throw new Error("Owners are required if the module is not yet initialized")
            }
            installData = encodeAbiParameters(
                [
                    { name: "threshold", type: "uint256" },
                    { name: "owners", type: "address[]" }
                ],
                [BigInt(threshold ?? owners.length), owners.sort()]
            )
        }
        moduleInfo = {
            address, // @todo: change to real module address
            type: "validator",
            data: installData,
            additionalContext: "0x",
            hook
        }
        const account = smartAccount.client.account
        const instance = new OwnableValidator(moduleInfo, await toSigner({ signer: account! }))
        return instance
    }

    // /**
    //  * Sets the threshold locally on the instance without executing a transaction.
    //  * This method should be used when the threshold has been updated on-chain but the local instance hasn't been updated.
    //  *
    //  * @param threshold The new threshold value
    //  */
    // public setLocalThreshold(threshold: number): void {
    //     if (threshold <= 0) {
    //         throw new Error("Threshold must be a positive number")
    //     }
    //     this.threshold = threshold
    // }

    // public async setThresholdUserOp(threshold: number): Promise<Partial<UserOperationStruct>> {
    //     const calldata = encodeFunctionData({
    //         functionName: "setThreshold",
    //         abi: parseAbi(["function setThreshold(uint256 _threshold) external"]),
    //         args: [BigInt(threshold)]
    //     })

    //     const transaction = {
    //         to: this.address,
    //         data: calldata,
    //         value: 0n
    //     }
    //     const userOp =
    //     return userOp
    // }

    // public async removeOwnerUserOp(owner: Address): Promise<Partial<UserOperationStruct>> {
    //     const owners = await this.getOwners()
    //     let prevOwner: Address

    //     const currentOwnerIndex = owners.findIndex((o: Address) => o === owner)

    //     if (currentOwnerIndex === -1) {
    //         throw new Error("Owner not found")
    //     }
    //     if (currentOwnerIndex === 0) {
    //         prevOwner = SENTINEL_ADDRESS
    //     } else {
    //         prevOwner = getAddress(owners[currentOwnerIndex - 1])
    //     }

    //     const calldata = encodeFunctionData({
    //         functionName: "removeOwner",
    //         abi: parseAbi(["function removeOwner(address prevOwner, address owner)"]),
    //         args: [prevOwner, owner]
    //     })

    //     const transaction = {
    //         to: this.address,
    //         data: calldata,
    //         value: 0n
    //     }

    //     const userOp = await this.smartAccount.
    //     return userOp
    // }

    // public async addOwnerUserOp(owner: Address): Promise<Partial<UserOperationStruct>> {
    //     const calldata = encodeFunctionData({
    //         functionName: "addOwner",
    //         abi: parseAbi(["function addOwner(address owner)"]),
    //         args: [owner]
    //     })

    //     const transaction = {
    //         to: this.address,
    //         data: calldata,
    //         value: 0n
    //     }
    //     const userOp = await this.smartAccount.buildUserOp([transaction]);
    //     return userOp
    // }

    // public async getOwners(): Promise<Address[]> {
    //     try {
    //         const client = this.smartAccount.client as MasterClient;
    //         const owners = (await client.readContract({
    //             address: this.address,
    //             abi: parseAbi([
    //                 "function getOwners(address account) external view returns (address[])"
    //             ]),
    //             functionName: "getOwners",
    //             args: [await this.smartAccount.getAccountAddress()]
    //         })) as Address[]

    //         return owners
    //     } catch (err) {
    //         console.error(err)
    //         return []
    //     }
    // }

    // public async isOwner(address: Address): Promise<boolean> {
    //     const owners = await this.getOwners();
    //     return owners.includes(address);
    // }

    public override getDummySignature(): Hex {
        const dummySignature = "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c";
        const signatures = Array(this.threshold).fill(dummySignature);
        const types = Array(this.threshold).fill('bytes');
        return encodePacked(types, signatures) as Hex;
    }

    override async signUserOpHash(userOpHash: string): Promise<Hex> {
        // this won't be valid for multisig 
        const signer = this.signer;
        return await signer.signMessage({ message: { raw: userOpHash as Hex } }) as Hex;
    }

    // private isMultiSig(): boolean {
    //     return this.threshold > 1;
    // }

    public getMultiSignature(signatures: Hex[]): Hex {
        const types = Array(signatures.length).fill('bytes');
        return encodePacked(types, signatures) as Hex;
    }

    // public async isModuleInitialized(): Promise<boolean> {
    //     const client = this.smartAccount.client as MasterClient;
    //     const isInitialized = await client.readContract({
    //         address: this.address,
    //         abi: parseAbi([
    //             "function isInitialized(address account) external view returns (bool)"
    //         ]),
    //         functionName: "isInitialized",
    //         args: [await this.smartAccount.getAccountAddress()]
    //     })
    //     return isInitialized
    // }
}
