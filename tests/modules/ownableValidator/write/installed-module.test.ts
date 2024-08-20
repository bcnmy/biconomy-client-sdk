// import { http, createWalletClient, encodeAbiParameters, encodeFunctionData, parseAbi, encodePacked, concat } from "viem"
// import { privateKeyToAccount } from "viem/accounts"
// import { baseSepolia } from "viem/chains"
// import { afterEach, describe, expect, test } from "vitest"
// import {
//   K1_VALIDATOR,
//   Module,
//   ModuleType,
//   OWNABLE_VALIDATOR,
//   UserOperationStruct,
//   createK1ValidatorModule,
//   createOwnableValidatorModule,
//   getRandomSigner
// } from "../../../../src"
// import { createSmartAccountClient } from "../../../../src/account"
// import type { NexusSmartAccount } from "../../../../src/account/NexusSmartAccount"
// import type { UserOpReceipt } from "../../../../src/bundler"
// import { getConfig } from "../../../utils"

// describe("Account:Modules:OwnableValidator", async () => {
//   const nonceOptions = { nonceKey: BigInt(Date.now() + 10) }
//   const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
//   const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
//   const { privateKey, privateKeyTwo, bundlerUrl } = getConfig()
//   const account = privateKeyToAccount(`0x${privateKey}`)
//   const accountTwo = privateKeyToAccount(`0x${privateKeyTwo}`)

//   const [walletClient] = [
//     createWalletClient({
//       account,
//       chain: baseSepolia,
//       transport: http()
//     })
//   ]

//   const smartAccount: NexusSmartAccount = await createSmartAccountClient({
//     signer: walletClient,
//     bundlerUrl,
//   })

//   const owners = [walletClient.account.address]

//   const ownableValidatorModule = await createOwnableValidatorModule(
//     smartAccount,
//     1,
//     owners
//   )

//   const k1ValidationModule = await createK1ValidatorModule(
//     smartAccount.getSigner()
//   )

//   smartAccount.setActiveValidationModule(ownableValidatorModule)

//   describe("Ownable Validator Module Tests", async () => {
//     test.skip("install Ownable Validator with 1 owner", async () => {
//       smartAccount.setActiveValidationModule(k1ValidationModule)
//       const isInstalledBefore = await smartAccount.isModuleInstalled({
//         moduleType: ModuleType.Validation,
//         moduleAddress: OWNABLE_VALIDATOR
//       })

//       const threshold = 1
//       const installData = encodeAbiParameters(
//         [
//           { name: "threshold", type: "uint256" },
//           { name: "owners", type: "address[]" }
//         ],
//         [BigInt(threshold), [walletClient.account.address]]
//       )

//       console.log(isInstalledBefore, "isInstalledBefore")

//       if (!isInstalledBefore) {
//         const userOpReceipt: UserOpReceipt = await smartAccount.installModule({
//           moduleAddress: OWNABLE_VALIDATOR,
//           moduleType: ModuleType.Validation,
//           data: installData
//         })

//         smartAccount.setActiveValidationModule(ownableValidatorModule)

//         expect(userOpReceipt.success).toBe(true)
//       }
//     }, 60000)

//     test.skip("Ownable Validator Module should be installed", async () => {
//       const isInstalled = await smartAccount.isModuleInstalled({
//         moduleType: ModuleType.Validation,
//         moduleAddress: OWNABLE_VALIDATOR
//       })
//       expect(isInstalled).toBeTruthy()
//     }, 60000)

//     test.skip("Mint NFT - Single Call", async () => {
//       const randomAccount = getRandomSigner();
//       const encodedCall = encodeFunctionData({
//         abi: parseAbi(["function safeMint(address _to)"]),
//         functionName: "safeMint",
//         args: [randomAccount.pbKey]
//       })

//       smartAccount.setActiveValidationModule(ownableValidatorModule)

//       const isInstalled = await smartAccount.isModuleInstalled({moduleType: ModuleType.Validation, moduleAddress: ownableValidatormodule.moduleAddressAddress});
//       console.log("Is the module installed ? ", isInstalled);

//       const transaction = {
//         to: nftAddress, // NFT address
//         data: encodedCall
//       }

//       const response = await smartAccount.sendTransaction([transaction])
//       console.log(response, "response")

//       const receipt = await response.wait()
//       console.log(receipt, "receipt")

//       expect(receipt.userOpHash).toBeTruthy()
//     }, 60000)

//     test("Should execute a user op if threshold was met", async () => {
//       const owners = await ownableValidatorModule.getOwners()
//       console.log("owners: ", owners);
      
//       // if(!owners.includes(accountTwo.address)) {
//       //   const userOpReceipt = await ownableValidatorModule.addOwner(
//       //     accountTwo.address
//       //   )
//       //   expect(userOpReceipt.success).toBeTruthy();
//       // }

//       // const receipt = await ownableValidatorModule.setThreshold(2);
//       // expect(receipt.success).toBeTruthy();
//       // expect(ownableValidatorModule.threshold).toBe(2); 

//       const randomAccount = getRandomSigner();
//       const encodedCall = encodeFunctionData({
//         abi: parseAbi(["function safeMint(address _to)"]),
//         functionName: "safeMint",
//         args: [randomAccount.pbKey]
//       })

//       const transaction = {
//         to: nftAddress, // NFT address
//         data: encodedCall
//       }
//       let userOp = await smartAccount.buildUserOp([transaction])
//       console.log(userOp, "userOp");

//       const userOpHash = await smartAccount.getUserOpHash(userOp)
//       const signature1 = await account.signMessage({message: userOpHash});
//       const signature2 = await accountTwo.signMessage({message: userOpHash});

//       // const finalSignature = encodePacked(['bytes', 'bytes'],[signature1, signature2]);
//       const finalSignature = encodePacked(['bytes', 'bytes'],[signature1, signature2]);
//       console.log(finalSignature, "finalSignature");

//       userOp.signature = finalSignature;
//       console.log("userOp: ", userOp);
      
//       // const mintNFTResponse = await smartAccount.sendTransaction([transaction])
//       const mintNFTResponse = await smartAccount.sendSignedUserOp(userOp as UserOperationStruct)
//       const mintNFTReceipt = await mintNFTResponse.wait()
//       console.log(mintNFTReceipt, "receipt")

//       expect(mintNFTReceipt.userOpHash).toBeTruthy()
//       expect(mintNFTReceipt.success).toBe(true)
//     }, 60000)

//     test.skip("Should revert a user op if threshold was not met", async () => {
//       const randomAccount = getRandomSigner();
//       const encodedCall = encodeFunctionData({
//         abi: parseAbi(["function safeMint(address _to)"]),
//         functionName: "safeMint",
//         args: [randomAccount.pbKey]
//       })

//       const transaction = {
//         to: nftAddress, // NFT address
//         data: encodedCall
//       }

//       expect(smartAccount.buildUserOp([transaction])).rejects.toThrowError("User operation reverted during simulation with reason: 0x8baa579f");
//     }, 60000)

//     test.skip("should remove an owner from the module", async () => {
//       const ownersBefore = await ownableValidatorModule.getOwners();
//       console.log(ownersBefore, "ownersBefore");

//       const userOpReceipt = await ownableValidatorModule.removeOwner(
//         accountTwo.address
//       )
//       const ownersAfter = await ownableValidatorModule.getOwners();
//       console.log(ownersAfter, "ownersAfter");
//       expect(userOpReceipt.success).toBeTruthy()
//     }, 60000)

//     test.skip("should get all the owners", async () => {
//       const owners = await ownableValidatorModule.getOwners()
//       console.log(owners, "owners")
//     }, 60000)
//   })
// })
