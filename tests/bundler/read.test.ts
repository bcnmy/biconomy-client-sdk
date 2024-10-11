import { http, type Chain, type Hex, createWalletClient } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  type BiconomySmartAccountV2Config,
  compareChainIds,
  createSmartAccountClient,
} from "../../src/account"
import { createBundler, extractChainIdFromUrl } from "../../src/bundler"
import { getBundlerUrl, getConfig } from "../utils"

describe("Bundler:Read", () => {
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
  const recipient = accountTwo.address

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
    "should throw and give advice",
    async () => {
      const randomPrivateKey = generatePrivateKey()
      const unfundedAccount = privateKeyToAccount(randomPrivateKey)

      const unfundedSmartAccountClient = await createSmartAccountClient({
        signer: createWalletClient({
          account: unfundedAccount,
          chain,
          transport: http()
        }),
        paymasterUrl,
        bundlerUrl
      })

      await expect(
        unfundedSmartAccountClient.sendTransaction({
          to: recipient,
          value: 1
        })
      ).rejects.toThrow("Send some native tokens in your smart wallet")
    },
    20000
  )

  test.concurrent(
    "should parse the rpcUrl when a custom chain and bundler are used",
    async () => {
      const customBlastChain = {
        id: 81_457,
        name: "Blast",
        //   network: "blast",
        nativeCurrency: {
          decimals: 18,
          name: "Ethereum",
          symbol: "ETH"
        },
        rpcUrls: {
          public: { http: ["https://rpc.blast.io"] },
          default: { http: ["https://rpc.blast.io"] }
        },
        blockExplorers: {
          etherscan: { name: "Blastscan", url: "https://blastscan.io/" },
          default: { name: "Blastscan", url: "https://blastscan.io/" }
        },
        contracts: {
          multicall3: {
            address: "0xca11bde05977b3631167028862be2a173976ca11",
            blockCreated: 88_189
          }
        }
      } as const satisfies Chain

      const accountOne = privateKeyToAccount(`0x${privateKey}`)

      const walletClientWithCustomChain = createWalletClient({
        account: accountOne,
        chain: customBlastChain,
        transport: http()
      })

      const blastBundler = await createBundler({
        bundlerUrl: getBundlerUrl(customBlastChain.id),
        viemChain: customBlastChain
      })
      const smartAccountFromViemWithCustomChain =
        await createSmartAccountClient({
          viemChain: customBlastChain,
          signer: walletClientWithCustomChain,
          bundler: blastBundler,
          rpcUrl: customBlastChain.rpcUrls.default.http[0]
        })

      expect(
        smartAccountFromViemWithCustomChain.rpcProvider.transport.url
      ).toBe("https://rpc.blast.io")
      expect(blastBundler.getBundlerUrl()).toBe(
        getBundlerUrl(customBlastChain.id)
      )
    }
  )

  test.concurrent(
    "should throw an error, bundlerUrl chain id and signer chain id does not match",
    async () => {
      const config: BiconomySmartAccountV2Config = {
        signer: walletClient,
        bundlerUrl: getBundlerUrl(1337),
        paymasterUrl
      }

      await expect(
        compareChainIds(walletClient, config, false)
      ).rejects.toThrow()
    }
  )
  test.concurrent(
    "should throw an error, bundlerUrl chainId and paymasterUrl + chainId does not match",
    async () => {
      const mockPaymasterUrl =
        "https://paymaster.biconomy.io/api/v1/1337/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71"

      const config: BiconomySmartAccountV2Config = {
        signer: walletClient,
        bundlerUrl,
        paymasterUrl: mockPaymasterUrl
      }

      await expect(
        compareChainIds(walletClient, config, false)
      ).rejects.toThrow()
    }
  )

  test.concurrent(
    "should throw, chain id from signer and bundlerUrl do not match",
    async () => {
      const createAccount = createSmartAccountClient({
        signer: walletClient,
        bundlerUrl:
          "https://bundler.biconomy.io/api/v2/1/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44" // mock
      })

      await expect(createAccount).rejects.toThrow()
    }
  )

  test.concurrent(
    "should throw, chain id from paymasterUrl and bundlerUrl do not match",
    async () => {
      const createAccount = createSmartAccountClient({
        signer: walletClient,
        paymasterUrl:
          "https://paymaster.biconomy.io/api/v1/1/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71",
        bundlerUrl:
          "https://bundler.biconomy.io/api/v2/80002/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44" // mock
      })

      await expect(createAccount).rejects.toThrow()
    }
  )

  test.concurrent('extracts chain ID from various URL structures', () => {
    const testCases = [
      { url: "https://example.com/api/v2/1234/endpoint", expected: 1234 },
      { url: "https://api.example.com/v1/5678/resource", expected: 5678 },
      { url: "http://localhost:3000/api/9876/action", expected: 9876 },
      { url: "https://example.com/1234/api/v2/endpoint", expected: 1234 },
      { url: "https://example.com/network/5678/resource/action", expected: 5678 },
      { url: "https://api.example.com/prefix/9876/suffix", expected: 9876 },
      { url: "https://example.com/api/v2/1234/5678/endpoint", expected: 1234 },
      { url: "https://example.com/api/v2/endpoint/1234/", expected: 1234 },
      { url: "https://example.com/api/v2/1234/endpoint?param=value", expected: 1234 },
      { url: "https://example.com/api/v2/1234/endpoint#section", expected: 1234 },
      { url: "https://subdomain.example.com/api/1234/endpoint", expected: 1234 },
      { url: "http://192.168.1.1/api/1234/endpoint", expected: 1234 },
      { url: "https://user:pass@example.com/api/1234/endpoint", expected: 1234 },
      { url: "https://example.com/1234/", expected: 1234 },
      { url: "https://api.example.com/v1/chain/5678/details", expected: 5678 },
      { url: "https://paymaster.biconomy.io/api/v1/80001/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71", expected: 80001 },
      { url: "https://bundler.biconomy.io/api/v2/80002/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44", expected: 80002 },
    ];

    for (const { url, expected } of testCases) {
      expect(extractChainIdFromUrl(url)).toBe(expected);
    }
  })
})
