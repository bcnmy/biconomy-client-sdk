import {
  type Hex,
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  parseAbi
} from "viem"
import {
  type BiconomySmartAccountV2,
  getChain,
  createSmartAccountClient
} from "../src/account"
import { privateKeyToAccount } from "viem/accounts"
import { getBundlerUrl, getConfig } from "./utils"
import { beforeAll, describe, expect, test } from "vitest"
import { PaymasterMode } from "../src/paymaster"
import { JsonRpcProvider } from "@ethersproject/providers"
import { Wallet } from "@ethersproject/wallet"
import { Interface } from "@ethersproject/abi"

describe("BNBT:Write", () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const { privateKey } = getConfig()
  const account = privateKeyToAccount(`0x${privateKey}`)
  const chain = getChain(97)
  const bundlerUrl = getBundlerUrl(97)
  const paymasterUrl = "https://paymaster.biconomy.io/api/v1/97/<API_KEY>"
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })
  let smartAccount: BiconomySmartAccountV2
  let smartAccountAddress: Hex = "0x"

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
  })

  beforeAll(async () => {
    smartAccount = await createSmartAccountClient({
      chainId: 97,
      signer: walletClient,
      bundlerUrl,
      paymasterUrl
    })
    smartAccountAddress = await smartAccount.getAccountAddress()
  })

  test("should mint an NFT with sponsorship with multiple accounts", async () => {
    const rpcUrl = chain.rpcUrls.default.http[0]
    const ethersProvider = new JsonRpcProvider(rpcUrl)
    const ethersSigner = new Wallet(privateKey, ethersProvider)

    const smartAccounts = await Promise.all([
      createSmartAccountClient({
        signer: ethersSigner,
        bundlerUrl,
        paymasterUrl,
        rpcUrl,
        index: 0
      }),
      createSmartAccountClient({
        signer: ethersSigner,
        bundlerUrl,
        paymasterUrl,
        rpcUrl,
        index: 1
      })
    ])

    const methodAbi = ["function safeMint(address to) public"]
    const method = "safeMint"
    const args = [smartAccountAddress]

    const tx = {
      to: nftAddress, // NFT address
      data: new Interface(methodAbi).encodeFunctionData(method, args)
    }

    const results = await Promise.all(
      smartAccounts.map((smartAccount) =>
        smartAccount.sendTransaction([tx, tx], {
          paymasterServiceData: { mode: PaymasterMode.SPONSORED }
        })
      )
    )

    const waitResults = await Promise.all(results.map(({ wait }) => wait()))

    expect(waitResults.map(({ success }) => success)).toEqual(["true", "true"])
  }, 60000)
})
