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

  test("should have factory and k1Validator deployed", async () => {
    const byteCodes = await Promise.all([
      publicClient.getBytecode({
        address: k1ValidatorAddress
      }),
      publicClient.getBytecode({
        address: factoryAddress
      })
    ])

    expect(byteCodes.every(Boolean)).toBeTruthy()
  })

  test("should init the smart account", async () => {
    smartAccount = await createSmartAccountClient({
      signer: walletClient,
      chain,
      bundlerUrl,
      // Remove the following lines to use the default factory and validator addresses
      // These are relevant only for now on sopelia chain and are likely to change
      k1ValidatorAddress,
      factoryAddress
    })
  })

  test("should log relevant addresses", async () => {
    smartAccountAddress = await smartAccount.getAddress()
    console.log({ smartAccountAddress })
  })

  test("should check balances and top up relevant addresses", async () => {
    const [ownerBalance, smartAccountBalance] = await Promise.all([
      publicClient.getBalance({
        address: account.address
      }),
      publicClient.getBalance({
        address: smartAccountAddress
      })
    ])
    console.log({ ownerBalance, smartAccountBalance })

    const balancesAreOfCorrectType = [ownerBalance, smartAccountBalance].every(
      (balance) => typeof balance === "bigint"
    )
    if (smartAccountBalance === 0n) {
      const hash = await walletClient.sendTransaction({
        chain,
        account,
        to: smartAccountAddress,
        value: 1000000000000000000n
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log({ receipt })
    }
    expect(balancesAreOfCorrectType).toBeTruthy()
  })

  test("should send some native token", async () => {
    const balanceBefore = await publicClient.getBalance({
      address: account.address
    })

    const { wait } = await smartAccount.sendTransaction({
      to: account.address,
      data: "0x",
      value: 1n
    })

    const {
      success,
      receipt: { transactionHash }
    } = await wait()
    expect(success).toBeTruthy()

    console.log({ transactionHash })

    const balanceAfter = await publicClient.getBalance({
      address: account.address
    })

    expect(balanceAfter - balanceBefore).toBe(1n)
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
