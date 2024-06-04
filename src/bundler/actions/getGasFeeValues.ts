import type { Account, Chain, Client, Transport } from "viem"
import type { BundlerRpcSchema, GasFeeValues } from "../utils/types"

export const getGasFeeValues = async <
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined
>(
  client: Client<TTransport, TChain, TAccount, BundlerRpcSchema>
): Promise<GasFeeValues> => {
  try {
    const response = await client.request({
      method: "biconomy_getGasFeeValues",
      params: []
    })

    return {
      maxPriorityFeePerGas: response.maxPriorityFeePerGas || "0",
      maxFeePerGas: response.maxFeePerGas || "0"
    } as GasFeeValues
  } catch (err) {
    throw new Error(`Error estimating gas fee values. ${err}`)
  }
}
