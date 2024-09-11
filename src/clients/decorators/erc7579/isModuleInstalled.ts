import {
  type Address,
  type Chain,
  type Client,
  ContractFunctionExecutionError,
  type Hex,
  type Transport,
  decodeFunctionResult,
  encodeFunctionData,
  getAddress
} from "viem"
import type {
  GetSmartAccountParameter,
  SmartAccount
} from "viem/account-abstraction"
import { call, readContract } from "viem/actions"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { type ModuleType, parseModuleTypeId } from "./supportsModule"

export type IsModuleInstalledParameters<
  TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
  type: ModuleType
  address: Address
  context: Hex
}

export async function isModuleInstalled<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: IsModuleInstalledParameters<TSmartAccount>
): Promise<boolean> {
  const { account: account_ = client.account, address, context } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/docs/actions/wallet/sendTransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount

  const publicClient = account.client

  const abi = [
    {
      name: "isModuleInstalled",
      type: "function",
      stateMutability: "view",
      inputs: [
        {
          type: "uint256",
          name: "moduleTypeId"
        },
        {
          type: "address",
          name: "module"
        },
        {
          type: "bytes",
          name: "additionalContext"
        }
      ],
      outputs: [
        {
          type: "bool"
        }
      ]
    }
  ] as const

  try {
    return await getAction(
      publicClient,
      readContract,
      "readContract"
    )({
      abi,
      functionName: "isModuleInstalled",
      args: [parseModuleTypeId(parameters.type), getAddress(address), context],
      address: account.address
    })
  } catch (error) {
    if (error instanceof ContractFunctionExecutionError) {
      const { factory, factoryData } = await account.getFactoryArgs()

      const result = await getAction(
        publicClient,
        call,
        "call"
      )({
        factory: factory,
        factoryData: factoryData,
        to: account.address,
        data: encodeFunctionData({
          abi,
          functionName: "isModuleInstalled",
          args: [
            parseModuleTypeId(parameters.type),
            getAddress(address),
            context
          ]
        })
      })

      if (!result || !result.data) {
        throw new Error("accountId result is empty")
      }

      return decodeFunctionResult({
        abi,
        functionName: "isModuleInstalled",
        data: result.data
      })
    }

    throw error
  }
}
