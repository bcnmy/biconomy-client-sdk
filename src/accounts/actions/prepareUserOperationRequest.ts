import type { Chain, Client, Transport } from "viem"
import { estimateFeesPerGas } from "viem/actions"
import type { Prettify } from "viem/chains"
import { estimateUserOperationGas } from "../../bundler/actions/estimateUserOperationGas"
import type { StateOverrides } from "../../bundler/utils/types"
import { PaymasterMode } from "../../paymaster/utils/types"
import { getAction, parseAccount } from "../utils/helpers"
import type {
  ENTRYPOINT_ADDRESS_V07_TYPE,
  PrepareUserOperationRequestParameters,
  SmartAccount,
  UserOperationStruct
} from "../utils/types"

async function prepareUserOperationRequestForEntryPointV06<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
  client: Client<TTransport, TChain, TAccount>,
  args: Prettify<PrepareUserOperationRequestParameters>,
  stateOverrides?: StateOverrides
): Promise<Prettify<UserOperationStruct>> {
  const {
    account: account_ = client.account,
    userOperation: partialUserOperation,
    middleware
  } = args
  if (!account_) throw new Error("No account found")

  const account = parseAccount(
    account_
  ) as SmartAccount<ENTRYPOINT_ADDRESS_V07_TYPE>

  const [sender, nonce, initCode, callData] = await Promise.all([
    partialUserOperation.sender || account.address,
    partialUserOperation.nonce || account.getNonce(),
    partialUserOperation.initCode || account.getInitCode(),
    partialUserOperation.callData
  ])

  const userOperation: UserOperationStruct = {
    sender,
    nonce,
    initCode,
    callData,
    paymasterAndData: "0x",
    signature: partialUserOperation.signature || "0x",
    maxFeePerGas: partialUserOperation.maxFeePerGas,
    maxPriorityFeePerGas: partialUserOperation.maxPriorityFeePerGas,
    callGasLimit: partialUserOperation.callGasLimit,
    verificationGasLimit: partialUserOperation.verificationGasLimit,
    preVerificationGas: partialUserOperation.preVerificationGas
  }

  if (userOperation.signature === "0x") {
    userOperation.signature = await account.getDummySignature(userOperation)
  }

  if (typeof middleware === "function") {
    return await middleware({ userOperation })
  }

  if (middleware && typeof middleware !== "function" && middleware.gasPrice) {
    const gasPrice = await middleware.gasPrice()
    userOperation.maxFeePerGas = gasPrice.maxFeePerGas?.toString()
    userOperation.maxPriorityFeePerGas =
      gasPrice.maxPriorityFeePerGas?.toString()
  }

  if (!userOperation.maxFeePerGas || !userOperation.maxPriorityFeePerGas) {
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
        userOperation
      } as {
        userOperation: UserOperationStruct
      },
      stateOverrides
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

export async function prepareUserOperationRequest<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
  client: Client<TTransport, TChain, TAccount>,
  args: Prettify<PrepareUserOperationRequestParameters>,
  stateOverrides?: StateOverrides
): Promise<UserOperationStruct> {
  const { account: account_ = client.account } = args
  if (!account_) throw new Error("No account found.")

  return prepareUserOperationRequestForEntryPointV06(
    client,
    args,
    stateOverrides
  ) as Promise<UserOperationStruct>
}
