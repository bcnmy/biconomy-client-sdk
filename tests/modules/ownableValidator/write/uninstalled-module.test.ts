// import { http, createWalletClient } from "viem"
// import { privateKeyToAccount } from "viem/accounts"
// import { baseSepolia } from "viem/chains"
// import { describe, expect, test } from "vitest"
// import {
//   ModuleType,
//   OWNABLE_VALIDATOR,
//   createOwnableValidatorModule
// } from "../../../../src"
// import { createSmartAccountClient } from "../../../../src/account"
// import type { NexusSmartAccount } from "../../../../src/account/NexusSmartAccount"
// import { getConfig } from "../../../utils"

// describe("Account:Modules:OwnableValidator", async () => {
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
//     bundlerUrl
//   })

//   const owners = [walletClient.account.address, accountTwo.address]

//   const ownableValidatorModule = await createOwnableValidatorModule(
//     smartAccount,
//     1,
//     owners
//   )

//   describe("Uninstalled Ownable Validator Module - Tests", async () => {
//     test("uninstall Ownable Validator Module", async () => {
//       const isInstalledBefore = await smartAccount.isModuleInstalled({
//         moduleType: ModuleType.Validation,
//         moduleAddress: OWNABLE_VALIDATOR
//       })
//       //   {
//       //     sender: '0xda6959DA394B1BDdB068923A9A214dC0CD193D2E',
//       //     nonce: 866077811418299683029716658306608038086113973150706820694579085355n,
//       //     factoryData: undefined,
//       //     factory: undefined,
//       //     callData: '0xe9ae5c53000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000138da6959da394b1bddb068923a9a214dc0cd193d2e00000000000000000000000000000000000000000000000000000000000000009517e29f0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000bf2137a23f439ca5aa4360cc6970d70b24d07ea200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000fa66e705cf2582cf56528386bb9dfca1197672620000000000000000',
//       //     signature: '0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000839518b94038b0B6044f71830b0c79D2fD8D07d000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000',
//       //     maxFeePerGas: 37233087784n,
//       //     maxPriorityFeePerGas: 14400000n
//       //   }

//       // {
//       //     sender: '0xda6959DA394B1BDdB068923A9A214dC0CD193D2E',
//       //     nonce: 866077811418299683029716658306608038086113973150706820694579085356n,
//       //     factoryData: undefined,
//       //     factory: undefined,
//       //     callData: '0xe9ae5c530000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000b8da6959da394b1bddb068923a9a214dc0cd193d2e00000000000000000000000000000000000000000000000000000000000000009517e29f0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000a975e69917a4c856b17fc8cc4c352f326ef21c6b000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000',
//       //     signature: '0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000839518b94038b0B6044f71830b0c79D2fD8D07d000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000',
//       //     maxFeePerGas: 11771639n,
//       //     maxPriorityFeePerGas: 1000000n
//       //   }

//       console.log(isInstalledBefore, "isInstalledBefore")

//       const userOpReceipt = await smartAccount.uninstallModule({
//         moduleAddress: OWNABLE_VALIDATOR,
//         moduleType: ModuleType.Validation
//       })

//       const isInstalled = await smartAccount.isModuleInstalled({
//         moduleType: ModuleType.Validation,
//         moduleAddress: OWNABLE_VALIDATOR
//       })

//       // after uninstalling the module, the SDK should setup the active module to the default module (K1 Validator)

//       expect(userOpReceipt.success).toBe(true)
//       expect(isInstalled).toBeFalsy()
//       expect(userOpReceipt).toBeTruthy()
//     }, 60000)

//     test("should revert adding an owner to the module", async () => {
//       const userOpReceipt = await ownableValidatorModule.addOwner(
//         "0x4D8249d21c9553b1bD23cABF611011376dd3416a"
//       )

//       expect(userOpReceipt.success).rejects.toThrowError()
//     }, 60000)

//     test("should remove an owner from the module", async () => {
//       const userOpReceipt = await ownableValidatorModule.removeOwner(
//         "0x4D8249d21c9553b1bD23cABF611011376dd3416a"
//       )
//       expect(userOpReceipt.success).rejects.toThrowError()
//     }, 60000)
//   })
// })
