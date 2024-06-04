// import { Address, CallExecutionErrorType, Chain, Client, ContractFunctionExecutionErrorType, ContractFunctionRevertedErrorType, RpcRequestErrorType, Transport, decodeErrorResult } from "viem"
// import { Prettify } from "viem/chains"
// import { generateUseropCallData, getAction } from "../utils/helpers"
// import { sendTransaction } from "./sendTransaction"
// import { ExecutionMethod, InstallModuleParams } from "../utils/types"
// import SmartAccountAbi from "../utils/abis/smartAccount.json";
// import { InvalidEntryPointError } from "./getSenderAddress"

// export const installModule = async <
//     TTransport extends Transport = Transport,
//     TChain extends Chain | undefined = Chain | undefined
// >(
//     client: Client<TTransport, TChain>,
//     args: Prettify<InstallModuleParams>
// ): Promise<Address> => {
//     const { smartAccountAddress, moduleType, moduleAddress, initData } = args

//     // Need to construct callData to installModule
//     const calldata = await generateUseropCallData({
//         executionMethod: ExecutionMethod.Execute,
//         functionName: "installModule",
//         targetContractAbi: SmartAccountAbi,
//         targetContractAddress: smartAccountAddress,
//         args: [moduleType, moduleAddress, initData],
//     })

//     const tx = {
//         to: smartAccountAddress,
//         data: calldata,
//         value: 0n
//     }

//     try {
//         await getAction(
//             client,
//             sendTransaction
//         )(tx)
//     } catch (e) {
//         const err = e as ContractFunctionExecutionErrorType

//         if (err.cause.name === "ContractFunctionRevertedError") {
//             const revertError = err.cause as ContractFunctionRevertedErrorType
//             const errorName = revertError.data?.errorName ?? ""
//             if (
//                 errorName === "SenderAddressResult" &&
//                 revertError.data?.args &&
//                 revertError.data?.args[0]
//             ) {
//                 return revertError.data?.args[0] as Address
//             }
//         }

//         if (err.cause.name === "CallExecutionError") {
//             const callExecutionError = err.cause as CallExecutionErrorType
//             if (callExecutionError.cause.name === "RpcRequestError") {
//                 const revertError =
//                     callExecutionError.cause as RpcRequestErrorType
//                 // biome-ignore lint/suspicious/noExplicitAny: fuse issues
//                 const data = (revertError as unknown as any).cause.data.split(
//                     " "
//                 )[1]

//                 const error = decodeErrorResult({
//                     abi: [
//                         {
//                             inputs: [
//                                 {
//                                     internalType: "address",
//                                     name: "sender",
//                                     type: "address"
//                                 }
//                             ],
//                             name: "SenderAddressResult",
//                             type: "error"
//                         }
//                     ],
//                     data
//                 })
//                 return error.args[0] as Address
//             }
//         }

//         throw e
//     }

//     throw new InvalidEntryPointError({ entryPoint: "0x" })
// }