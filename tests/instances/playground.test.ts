import { config } from "dotenv"
import {
  http,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type NexusSmartAccount,
  createSmartAccountClient,
  getChain,
  getCustomChain
} from "../../src/account"
import { createK1ValidatorModule } from "../../src/modules"
import { getBundlerUrl } from "../test.utils"
config()

const privateKey = process.env.E2E_PRIVATE_KEY_ONE
const chainId = process.env.CHAIN_ID
const rpcUrl = process.env.RPC_URL //Optional, taken from chain (using chainId) if not provided
const _bundlerUrl = process.env.BUNDLER_URL // Optional, taken from chain (using chainId) if not provided
const conditionalDescribe = process.env.RUN_PLAYGROUND
  ? describe
  : describe.skip

if (!privateKey) throw new Error("Missing env var E2E_PRIVATE_KEY_ONE")
if (!chainId) throw new Error("Missing env var CHAIN_ID")

// Remove the following lines to use the default factory and validator addresses
// These are relevant only for now on base sopelia chain and are likely to change
const k1ValidatorAddress = "0x663E709f60477f07885230E213b8149a7027239B"
const factoryAddress = "0x887Ca6FaFD62737D0E79A2b8Da41f0B15A864778"

conditionalDescribe("playground", () => {
  let ownerAddress: Address
  let walletClient: WalletClient
  let smartAccount: NexusSmartAccount
  let smartAccountAddress: Address
  let chain: Chain
  let bundlerUrl: string
  let publicClient: PublicClient

  beforeAll(async () => {
    try {
      chain = getChain(+chainId)
    } catch (e) {
      if (!rpcUrl) throw new Error("Missing env var RPC_URL")
      chain = getCustomChain("Custom Chain", +chainId, rpcUrl)
    }
    walletClient = createWalletClient({
      account: privateKeyToAccount(
        (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Hex
      ),
      chain,
      transport: http()
    })
    ownerAddress = walletClient?.account?.address as Hex
    publicClient = createPublicClient({
      chain,
      transport: http()
    })

    bundlerUrl = _bundlerUrl ?? getBundlerUrl(+chainId)
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
    console.log({ ownerAddress, smartAccountAddress })
  })

  test("should check balances of relevant addresses", async () => {
    const [ownerBalance, smartAccountBalance] = await Promise.all([
      publicClient.getBalance({
        address: ownerAddress
      }),
      publicClient.getBalance({
        address: smartAccountAddress
      })
    ])
    console.log({ ownerBalance, smartAccountBalance })
    const balancesAreOfCorrectType = [ownerBalance, smartAccountBalance].every(
      (balance) => typeof balance === "bigint"
    )
    expect(balancesAreOfCorrectType).toBeTruthy()
  })

  test("should send some native token", async () => {
    const balanceBefore = await publicClient.getBalance({
      address: ownerAddress
    })

    const k1ValidatorModule = await createK1ValidatorModule(
      smartAccount.getSigner(),
      k1ValidatorAddress
    )

    smartAccount.setActiveValidationModule(k1ValidatorModule)

    const { wait } = await smartAccount.sendTransaction({
      to: ownerAddress,
      data: "0x",
      value: 1n
    })

    const {
      success,
      receipt: { transactionHash }
    } = await wait()
    expect(success).toBeTruthy()

    const balanceAfter = await publicClient.getBalance({
      address: ownerAddress
    })

    expect(balanceAfter - balanceBefore).toBe(1n)
  })
})
