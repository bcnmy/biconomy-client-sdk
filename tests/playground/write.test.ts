import { http, type Hex, createPublicClient, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  DEFAULT_BICONOMY_FACTORY_ADDRESS,
  createSmartAccountClient,
  getChain,
  getCustomChain
} from "../../src/account"
import { getBundlerUrl, getConfig } from "../utils"

describe("Playground:Write", () => {
  const TEST_INIT_CODE =
    "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5df20ffbc0000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000242ede3bc0000000000000000000000000fa66e705cf2582cf56528386bb9dfca11976726200000000000000000000000000000000000000000000000000000000"
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const {
    chain,
    chainId,
    privateKey,
    privateKeyTwo,
    bundlerUrl,
    paymasterUrl
  } = getConfig()
  const account = privateKeyToAccount(`0x${privateKey}`)
  const accountTwo = privateKeyToAccount(`0x${privateKeyTwo}`)
  const sender = account.address
  const recipient = accountTwo.address
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })
  let [smartAccount, smartAccountTwo]: BiconomySmartAccountV2[] = []
  let [smartAccountAddress, smartAccountAddressTwo]: Hex[] = []

  const [walletClient, walletClientTwo] = [
    createWalletClient({
      account,
      chain,
      transport: http()
    }),
    createWalletClient({
      account: accountTwo,
      chain,
      transport: http()
    })
  ]

  beforeAll(async () => {
    ;[smartAccount, smartAccountTwo] = await Promise.all(
      [walletClient, walletClientTwo].map((client) =>
        createSmartAccountClient({
          chainId,
          signer: client,
          bundlerUrl,
          paymasterUrl
        })
      )
    )
    ;[smartAccountAddress, smartAccountAddressTwo] = await Promise.all(
      [smartAccount, smartAccountTwo].map((account) =>
        account.getAccountAddress()
      )
    )
  })

  test.concurrent(
    "should quickly run a write test in the playground",
    async () => {
      const chainId = 997
      const customChain = getCustomChain(
        "5ireChain Testnet",
        chainId,
        "https://rpc.ga.5ire.network",
        "https://explorer.ga.5ire.network"
      )

      const publicClientFire = createPublicClient({
        chain: customChain,
        transport: http()
      })

      const walletClient = createWalletClient({
        account: account,
        chain: customChain,
        transport: http()
      })

      const smartAccountClient = await createSmartAccountClient({
        chainId,
        signer: walletClient,
        customChain: customChain,
        bundlerUrl: getBundlerUrl(
          chainId,
          "A5CBjLqSc.0dcbc53e-anPe-44c7-b22d-21071345f76a"
        )
      })

      const balanceBefore = await publicClient.getBalance({
        address: smartAccountAddress
      })

      const amoyFactoryCode = await publicClient.getBytecode({
        address: DEFAULT_BICONOMY_FACTORY_ADDRESS
      })
      const fireFactoryCode = await publicClientFire.getBytecode({
        address: DEFAULT_BICONOMY_FACTORY_ADDRESS
      })

      expect(amoyFactoryCode).toBe(fireFactoryCode)

      const { wait } = await smartAccountClient.sendTransaction({
        to: recipient,
        value: BigInt(1)
      })

      const { success } = await wait()
      const balanceAfter = await publicClient.getBalance({
        address: smartAccountAddress
      })

      expect(balanceAfter).toBe(balanceBefore - 1n)
      expect(success).toBe("true")
    },
    30000
  )
})
