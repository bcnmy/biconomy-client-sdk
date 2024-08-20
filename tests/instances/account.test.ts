import { JsonRpcProvider } from "ethers/providers"
import { Wallet } from "ethers/wallet"
import {
  http,
  type Account,
  type Chain,
  type Hex,
  type PrivateKeyAccount,
  type WalletClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  ERROR_MESSAGES,
  ModuleType,
  type NexusSmartAccount,
  createSmartAccountClient,
  makeInstallDataAndHash
} from "../../src/account"
import { K1_VALIDATOR } from "../../src/modules/utils/Constants"
import {
  getBundlerUrl,
  pKey,
  pKeyTwo,
  safeDeploy,
  toTestClient,
  topUp
} from "../test.utils"
import type { ChainConfig, MasterClient } from "../test.utils"
import { type TestFileNetworkType, toNetwork } from "../testSetup"

const NETWORK_TYPE: TestFileNetworkType = "GLOBAL"

describe.skip("Account", () => {
  let network: ChainConfig
  let chain: Chain
  let bundlerUrl: string
  let testClient: MasterClient
  let account: PrivateKeyAccount
  let recipientAccount: Account
  let walletClient: WalletClient
  let recipientWalletClient: WalletClient
  let smartAccount: NexusSmartAccount
  let recipientSmartAccount: NexusSmartAccount
  let smartAccountAddress: Hex
  let recipientSmartAccountAddress: Hex

  beforeAll(async () => {
    network = await toNetwork(NETWORK_TYPE)
    chain = network.chain
    bundlerUrl = network.bundlerUrl

    account = privateKeyToAccount(pKey)
    recipientAccount = privateKeyToAccount(pKeyTwo)

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    recipientWalletClient = createWalletClient({
      account: recipientAccount,
      chain,
      transport: http()
    })

    testClient = toTestClient(chain, account)

    smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      chain
    })

    recipientSmartAccount = await createSmartAccountClient({
      signer: recipientWalletClient,
      bundlerUrl,
      chain
    })

    smartAccountAddress = await smartAccount.getAccountAddress()
    recipientSmartAccountAddress = await recipientSmartAccount.getAddress()
    await topUp(testClient, smartAccountAddress)
    await topUp(testClient, recipientSmartAccountAddress)
    await safeDeploy(smartAccount)
    await safeDeploy(recipientSmartAccount)
  })

  const eip1271MagicValue = "0x1626ba7e"
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"

  test.concurrent(
    "should estimate gas for minting an NFT",
    async () => {
      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function safeMint(address _to)"]),
        functionName: "safeMint",
        args: [recipientAccount.address]
      })
      const transaction = {
        to: nftAddress, // NFT address
        data: encodedCall
      }
      const results = await Promise.all([
        smartAccount.getGasEstimate([transaction]),
        smartAccount.getGasEstimate([transaction, transaction])
      ])

      const increasingGasExpenditure = results.every(
        (result, i) => result > (results[i - 1] ?? 0)
      )

      expect(increasingGasExpenditure).toBeTruthy()
    },
    60000
  )

  test("should get all modules", async () => {
    const modules = await smartAccount.getInstalledModules()
    expect(modules.length).toBeGreaterThan(0)
  }, 30000)

  test.concurrent(
    "should check if module is enabled on the smart account",
    async () => {
      const isEnabled = smartAccount.isModuleInstalled({
        moduleType: ModuleType.Validation,
        moduleAddress: K1_VALIDATOR
      })
      if (await smartAccount.isAccountDeployed()) {
        expect(isEnabled).resolves.toBeTruthy()
      } else {
        expect(isEnabled).rejects.toThrow("Account is not deployed")
      }
    },
    30000
  )

  test.concurrent(
    "enable mode",
    async () => {
      const result = makeInstallDataAndHash(account.address, [
        {
          moduleType: ModuleType.Validation,
          config: account.address
        }
      ])
      expect(result).toBeTruthy()
    },
    30000
  )

  test.concurrent(
    "should create a smartAccountClient from an ethers signer",
    async () => {
      const ethersProvider = new JsonRpcProvider(chain.rpcUrls.default.http[0])
      const ethersSigner = new Wallet(pKey, ethersProvider)

      const smartAccount = await createSmartAccountClient({
        signer: ethersSigner,
        bundlerUrl,
        chain
      })
    }
  )
  test.concurrent(
    "should pickup the rpcUrl from viem wallet and ethers",
    async () => {
      const port = chain.rpcUrls.default.http[0].split(":")[2]
      const newRpcUrl = `http://127.0.0.1:${port}`
      const defaultRpcUrl = chain.rpcUrls.default.http[0]

      const ethersProvider = new JsonRpcProvider(newRpcUrl)
      const test = await ethersProvider.getNetwork()
      const result = await ethersProvider.url
      console.log({ ethersProvider, test, result })
      const ethersSignerWithNewRpcUrl = new Wallet(pKey, ethersProvider)

      const originalEthersProvider = new JsonRpcProvider(
        chain.rpcUrls.default.http[0]
      )
      const ethersSigner = new Wallet(pKey, originalEthersProvider)

      const accountOne = privateKeyToAccount(pKey)

      const smartAccountFromEthersWithNewRpcAddress =
        await createSmartAccountClient({
          chain,
          signer: ethersSignerWithNewRpcUrl,
          bundlerUrl: getBundlerUrl(1337),
          transport: http(newRpcUrl)
        })

      expect(
        smartAccountFromEthersWithNewRpcAddress.publicClient.transport.url
      ).toBe(newRpcUrl)

      // const walletClientWithNewRpcUrl = createWalletClient({
      //   account: accountOne,
      //   chain,
      //   transport: http(newRpcUrl)
      // })
      // const [
      //   smartAccountFromEthersWithNewRpc,
      //   smartAccountFromViemWithNewRpc,
      //   smartAccountFromEthersWithOldRpc,
      //   smartAccountFromViemWithOldRpc
      // ] = await Promise.all([
      //   createSmartAccountClient({
      //     chain,
      //     signer: ethersSignerWithNewRpcUrl,
      //     bundlerUrl: getBundlerUrl(1337),
      //     transport: http(newRpcUrl)
      //   }),
      //   createSmartAccountClient({
      //     chain,
      //     signer: walletClientWithNewRpcUrl,
      //     bundlerUrl: getBundlerUrl(1337),
      //     transport: http(newRpcUrl)
      //   }),
      //   createSmartAccountClient({
      //     chain,
      //     signer: ethersSigner,
      //     bundlerUrl: getBundlerUrl(1337),
      //     transport: http(newRpcUrl)
      //   }),
      //   createSmartAccountClient({
      //     chain,
      //     signer: walletClient,
      //     bundlerUrl: getBundlerUrl(1337),
      //     transport: http(newRpcUrl)
      //   })
      // ])

      // const [
      //   smartAccountFromEthersWithNewRpcAddress,
      //   smartAccountFromViemWithNewRpcAddress,
      //   smartAccountFromEthersWithOldRpcAddress,
      //   smartAccountFromViemWithOldRpcAddress
      // ] = await Promise.all([
      //   smartAccountFromEthersWithNewRpc.getAccountAddress(),
      //   smartAccountFromViemWithNewRpc.getAccountAddress(),
      //   smartAccountFromEthersWithOldRpc.getAccountAddress(),
      //   smartAccountFromViemWithOldRpc.getAccountAddress()
      // ])

      // expect(
      //   [
      //     smartAccountFromEthersWithNewRpcAddress,
      //     smartAccountFromViemWithNewRpcAddress,
      //     smartAccountFromEthersWithOldRpcAddress,
      //     smartAccountFromViemWithOldRpcAddress
      //   ].every(Boolean)
      // ).toBeTruthy()

      // expect(smartAccountFromEthersWithNewRpc.publicClient.transport.url).toBe(
      //   newRpcUrl
      // )
      // expect(smartAccountFromViemWithNewRpc.publicClient.transport.url).toBe(
      //   newRpcUrl
      // )
      // expect(smartAccountFromEthersWithOldRpc.publicClient.transport.url).toBe(
      //   defaultRpcUrl
      // )
      // expect(smartAccountFromViemWithOldRpc.publicClient.transport.url).toBe(
      //   defaultRpcUrl
      // )
    }
  )
})
