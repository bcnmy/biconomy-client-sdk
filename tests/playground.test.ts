import {
  http,
  type Chain,
  type Hex,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient
} from "viem"
import { beforeAll, expect, test } from "vitest"
import {
  type NexusSmartAccount,
  createSmartAccountClient
} from "../src/account"
import {
  type TestFileNetworkType,
  describeWithPlaygroundGuard,
  toNetwork
} from "./src/testSetup"
import type { NetworkConfig } from "./src/testUtils"

const NETWORK_TYPE: TestFileNetworkType = "PUBLIC_TESTNET"

// Remove the following lines to use the default factory and validator addresses
// These are relevant only for now on base sopelia chain and are likely to change
const k1ValidatorAddress = "0x663E709f60477f07885230E213b8149a7027239B"
const factoryAddress = "0x887Ca6FaFD62737D0E79A2b8Da41f0B15A864778"

describeWithPlaygroundGuard("playground", () => {
  let network: NetworkConfig
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let paymasterUrl: undefined | string
  let walletClient: WalletClient

  // Test utils
  let publicClient: PublicClient // testClient not available on public testnets
  let account: PrivateKeyAccount
  let smartAccount: NexusSmartAccount
  let smartAccountAddress: Hex

  beforeAll(async () => {
    network = await toNetwork(NETWORK_TYPE)

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    paymasterUrl = network.paymasterUrl
    account = network.account as PrivateKeyAccount
    console.log(`chain ${chain}, id : ${chain.id}, bundlerUrl : ${bundlerUrl}, paymasterUrl : ${paymasterUrl}, account : ${account.address}`)
    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    publicClient = createPublicClient({
      chain,
      transport: http()
    })

    smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      chain,
      k1ValidatorAddress,
      factoryAddress
    })

    smartAccountAddress = await smartAccount.getAddress()
  })

  test("should send a userOp using pm_sponsorUserOperation", async () => {
    if (!paymasterUrl) {
      console.log("No paymaster url provided")
      return
    }
    const smartAccount = await createSmartAccountClient({
      signer: walletClient,
      chain,
      paymasterUrl,
      bundlerUrl,
      // Remove the following lines to use the default factory and validator addresses
      // These are relevant only for now on sopelia chain and are likely to change
      k1ValidatorAddress,
      factoryAddress
    })

    expect(async () =>
      smartAccount.sendTransaction(
        {
          to: account.address,
          data: "0x",
          value: 1n
        },
        {
          paymasterServiceData: {
            mode: "SPONSORED"
          }
        }
      )
    ).rejects.toThrow("Error in generating paymasterAndData")
  })
})
