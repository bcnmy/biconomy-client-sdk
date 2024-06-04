import type { Client } from "viem"
import { estimateFeesPerGas } from "viem/actions"
import type { Prettify } from "viem/chains"
import { estimateUserOperationGas } from "../../bundler/actions/estimateUserOperationGas"
import { getAction, parseAccount } from "../utils/helpers"
import {
  PaymasterMode,
  type BuildUserOperationV07,
  type SmartAccount,
  type UserOperationStruct
} from "../utils/types"
import { ENTRYPOINT_ADDRESS_V07 } from "../utils/constants"

export async function buildUserOpV07(
  client: Client,
  args: Prettify<BuildUserOperationV07>,
  // stateOverrides?: StateOverrides
): Promise<Prettify<UserOperationStruct>> {
  const {
    account: account_ = client.account,
    transaction,
    middleware
  } = args
  if (!account_) throw new Error("No account found")

  const account = parseAccount(
    account_
  ) as SmartAccount

  const [sender, nonce, initCode] = await Promise.all([
    account.address,
    account.getNonce(),
    account.getInitCode(),
    transaction.data
  ])

  const callData = await account.encodeCallData(transaction);
  const dummySignature = await account.getDummySignature();

  const userOperation: UserOperationStruct = {
    sender,
    nonce,
    factoryData: initCode,
    callData,
    paymasterData: "0x",
    callGasLimit: 0n,
    verificationGasLimit: 0n,
    preVerificationGas: 0n,
    maxFeePerGas: 0n,
    maxPriorityFeePerGas: 0n, 
    signature: dummySignature || "0x",
  }

  if (typeof middleware === "function") {
    return await middleware({ userOperation })
  }

  if (middleware && typeof middleware !== "function" && middleware.gasPrice) {
    const gasPrice = await middleware.gasPrice()
    userOperation.maxFeePerGas = gasPrice.maxFeePerGas?.toString() ?? 0n
    userOperation.maxPriorityFeePerGas =
      gasPrice.maxPriorityFeePerGas?.toString() ?? 0n
  }

  if (!userOperation.maxFeePerGas || !userOperation.maxPriorityFeePerGas) { // TODO
    const estimateGas = await estimateFeesPerGas(account.client)
    userOperation.maxFeePerGas =
      userOperation.maxFeePerGas || estimateGas.maxFeePerGas.toString()
    userOperation.maxPriorityFeePerGas =
      userOperation.maxPriorityFeePerGas ||
      estimateGas.maxPriorityFeePerGas.toString()
  }

  if (
    middleware &&
    typeof middleware !== "function" &&
    middleware.sponsorUserOperation
  ) {
    if (middleware.paymasterMode === PaymasterMode.ERC20) {
      if (middleware.feeQuote) {
        const sponsorUserOperationData = (await middleware.sponsorUserOperation(
          {
            userOperation,
            mode: PaymasterMode.ERC20,
            tokenInfo: {
              feeTokenAddress: middleware.feeQuote.tokenAddress
            }
          } as {
            userOperation: UserOperationStruct
            mode: PaymasterMode
          }
        )) as Pick<
          UserOperationStruct,
          | "callGasLimit"
          | "verificationGasLimit"
          | "preVerificationGas"
          | "paymasterAndData"
        >

        userOperation.callGasLimit =
          sponsorUserOperationData.callGasLimit?.toString()
        userOperation.verificationGasLimit =
          sponsorUserOperationData.verificationGasLimit?.toString()
        userOperation.preVerificationGas =
          sponsorUserOperationData.preVerificationGas?.toString()
        userOperation.paymasterAndData =
          sponsorUserOperationData.paymasterAndData
      } else {
        throw new Error("No fee quote found for ERC20 Paymaster")
      }
    } else {
      const sponsorUserOperationData = (await middleware.sponsorUserOperation({
        userOperation,
        mode: PaymasterMode.SPONSORED
      } as {
        userOperation: UserOperationStruct
        mode: PaymasterMode
      })) as Pick<
        UserOperationStruct,
        | "callGasLimit"
        | "verificationGasLimit"
        | "preVerificationGas"
        | "paymasterAndData"
      >

      userOperation.callGasLimit =
        sponsorUserOperationData.callGasLimit?.toString()
      userOperation.verificationGasLimit =
        sponsorUserOperationData.verificationGasLimit?.toString()
      userOperation.preVerificationGas =
        sponsorUserOperationData.preVerificationGas?.toString()
      userOperation.paymasterAndData = sponsorUserOperationData.paymasterAndData
    }
  }

  if (
    !userOperation.callGasLimit ||
    !userOperation.verificationGasLimit ||
    !userOperation.preVerificationGas
  ) {
    const gasParameters = await getAction(client, estimateUserOperationGas)(
      {
        userOperation,
        entryPoint: ENTRYPOINT_ADDRESS_V07
      } 
      // stateOverrides
    )

    userOperation.callGasLimit =
      userOperation.callGasLimit || gasParameters.callGasLimit.toString()
    userOperation.verificationGasLimit =
      userOperation.verificationGasLimit ||
      gasParameters.verificationGasLimit.toString()
    userOperation.preVerificationGas =
      userOperation.preVerificationGas ||
      gasParameters.preVerificationGas.toString()
  }

  return userOperation as UserOperationStruct
}