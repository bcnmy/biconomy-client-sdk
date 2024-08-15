// import {
//   type Address,
//   concat,
//   decodeAbiParameters,
//   encodeAbiParameters,
//   encodeFunctionData,
//   getAddress,
//   parseAbi,
//   parseAbiParameters
// } from "viem"
// import type { Hex } from "viem"
// import type { NexusSmartAccount } from "../../account/NexusSmartAccount.js"
// import { ModuleType, SENTINEL_ADDRESS } from "../../account/index.js"
// import type { UserOpReceipt } from "../../bundler/index.js"
// import { BaseValidationModule } from "../base/BaseValidationModule.js"
// import { OWNABLE_VALIDATOR } from "../utils/Constants.js"
// import type { V3ModuleInfo } from "../utils/Types.js"

// export class OwnableValidator extends BaseValidationModule {
//   public smartAccount: NexusSmartAccount
//   public owners: Address[]
//   public threshold: number

//   private constructor(
//     moduleConfig: V3ModuleInfo,
//     smartAccount: NexusSmartAccount
//   ) {
//     const moduleData = decodeAbiParameters(
//       parseAbiParameters("uint256 threshold, address[] owners"),
//       moduleConfig.data
//     )
//     super(moduleConfig, smartAccount.getSmartAccountOwner())
//     this.threshold = Number(moduleData[0])
//     this.owners = [...moduleData[1]] as Address[]
//     this.smartAccount = smartAccount
//   }

//   public static async create(
//     smartAccount: NexusSmartAccount,
//     threshold: number,
//     owners: Address[],
//     hook?: Address
//   ): Promise<OwnableValidator> {
//     if (
//       !owners.includes(await smartAccount.getSmartAccountOwner().getAddress())
//     ) {
//       throw Error("Signer needs to be one of the owners")
//     }
//     const installData = encodeAbiParameters(
//       [
//         { name: "threshold", type: "uint256" },
//         { name: "owners", type: "address[]" }
//       ],
//       [BigInt(threshold), owners]
//     )
//     const moduleInfo: V3ModuleInfo = {
//       module: OWNABLE_VALIDATOR,
//       type: ModuleType.Validation,
//       data: installData,
//       additionalContext: "0x",
//       hook
//     }
//     const instance = new OwnableValidator(moduleInfo, smartAccount)
//     return instance
//   }

//   public async setThreshold(threshold: number): Promise<UserOpReceipt> {
//     const calldata = encodeFunctionData({
//       functionName: "setThreshold",
//       abi: parseAbi(["function setThreshold(uint256 _threshold)"]),
//       args: [BigInt(threshold)]
//     })
//     const response = await this.smartAccount.sendTransaction({
//       to: this.moduleAddress,
//       data: calldata,
//       value: 0n
//     })
//     const receipt = await response.wait(5)
//     if(receipt.success) {
//       this.threshold = threshold
//     }
//     return receipt
//   }

//   public async removeOwner(owner: Address, signatures?: Hex[]): Promise<UserOpReceipt> {
//     const owners = await this.getOwners()
//     let prevOwner: Address

//     const currentOwnerIndex = owners.findIndex((o: Address) => o === owner)

//     if (currentOwnerIndex === -1) {
//       throw new Error("Owner not found")
//     }
//     if (currentOwnerIndex === 0) {
//       prevOwner = SENTINEL_ADDRESS
//     } else {
//       prevOwner = getAddress(owners[currentOwnerIndex - 1])
//     }

//     const calldata = encodeFunctionData({
//       functionName: "removeOwner",
//       abi: parseAbi(["function removeOwner(address prevOwner, address owner)"]),
//       args: [prevOwner, owner]
//     })

//     const transaction = {
//       to: this.moduleAddress,
//       data: calldata,
//       value: 0n
//     }

//     let receipt: UserOpReceipt;
//     if(owners.length > 1) {
//       if(signatures?.length === owners.length) {
//         let userOp = await this.smartAccount.buildUserOp([transaction]);
//         const finalSignature = concat(signatures);
//         userOp.signature = finalSignature;
//         const response = await this.smartAccount.sendUserOp(userOp);
//         receipt = await response.wait(5);
//       } else {
//         throw new Error("Signatures must be provided for all owners")
//       }
//     } else {
//       const response = await this.smartAccount.sendTransaction([transaction])
//       receipt = await response.wait(5)
//     }

//     if(receipt.success) {
//       this.owners = this.owners.filter((o: Address) => o !== owner)
//     }
//     return receipt
   
//   }

//   public async addOwner(owner: Address): Promise<UserOpReceipt> {
//     const calldata = encodeFunctionData({
//       functionName: "addOwner",
//       abi: parseAbi(["function addOwner(address owner)"]),
//       args: [owner]
//     })
//     const response = await this.smartAccount.sendTransaction({
//       to: this.moduleAddress,
//       data: calldata,
//       value: 0n
//     })
//     const receipt = await response.wait(5)
//     if(receipt.success) {
//       this.owners.push(owner)
//     }
//     return receipt
//   }

//   public async getOwners(): Promise<Address[]> {
//     try {
//       const owners = (await this.smartAccount.publicClient.readContract({
//         address: OWNABLE_VALIDATOR,
//         abi: parseAbi([
//           "function getOwners(address account) external view returns (address[])"
//         ]),
//         functionName: "getOwners",
//         args: [await this.smartAccount.getAccountAddress()]
//       })) as Address[]

//       return owners
//     } catch (err) {
//       console.error(err)
//       return []
//     }
//   }

//   public getDummySignature(): Hex {
//     return "0xfe68e79dbbc872d7a22c6f3eb24f8145edf8d8333092c666221db79bf236e25626e9b05d8230aee0baee7e8b15d60b51e408f1e640b1e0c89deb874b17e269d91b199dfd0340577f695639a048a231a64d181f4e2d66acd5c29ecd0a9b25593c291eb4aba21a15fa4fded885e2c44a49887de1cc9adced5088bcac65cf8c1f29c71c" as Hex
//   }

//   async signUserOpHash(userOpHash: string): Promise<Hex> {
//     const signature = await this.signer.signMessage({ raw: userOpHash as Hex })
//     return signature as Hex
//   }
// }
