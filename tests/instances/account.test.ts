import { JsonRpcProvider } from "@ethersproject/providers"
import { Wallet } from "@ethersproject/wallet"
import {
  http,
  type Account,
  type Chain,
  type Hex,
  type PublicClient,
  type TestClient,
  type WalletClient,
  concat,
  createTestClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContract,
  hashMessage,
  keccak256,
  parseAbi,
  parseAbiParameters,
  publicActions,
  toBytes,
  toHex,
  walletActions
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { baseSepolia, bsc } from "viem/chains"
import { beforeAll, describe, expect, inject, test } from "vitest"
import {
  type BuildUserOpOptions,
  DEFAULT_BICONOMY_FACTORY_ADDRESS,
  ERROR_MESSAGES,
  ModuleType,
  NATIVE_TOKEN_ALIAS,
  type NexusSmartAccount,
  type NexusSmartAccountConfig,
  type SupportedSigner,
  compareChainIds,
  createSmartAccountClient,
  makeInstallDataAndHash
} from "../../src/account"
import { getChain } from "../../src/account"
import { BiconomyFactoryAbi } from "../../src/account/abi/K1ValidatorFactory"
import { NexusAccountAbi } from "../../src/account/abi/SmartAccount"
import {
  K1_VALIDATOR,
  createK1ValidatorModule,
  createOwnableExecutorModule,
  createOwnableValidatorModule
} from "../../src/modules"
import type { OwnableExecutorModule } from "../../src/modules/executors/OwnableExecutor"
import type { OwnableValidator } from "../../src/modules/validators/OwnableValidator"
import type { ChainConfig } from "../globalSetup"
import {
  eip1271MagicValue,
  nftAddress,
  pKey,
  pKeyTwo,
  testWithBundler
} from "../testSetup"
import { checkBalance, getAccountDomainStructFields, topUp } from "../utils"

const skipBundler: BuildUserOpOptions = {
  skipBundler: true
}

describe("Account", () => {
  let chainConfig: ChainConfig
  let publicClient: TestClient & PublicClient & WalletClient
  let chain: Chain
  let chainId: number
  let account: Account
  let recipientAccount: Account
  let walletClient: WalletClient
  let recipientWalletClient: WalletClient
  let smartAccount: NexusSmartAccount
  let recipientSmartAccount: NexusSmartAccount
  let smartAccountAddress: Hex
  let recipientSmartAccountAddress: Hex
  let ownableExecutorModule: OwnableExecutorModule
  let ownableValidatorModule: OwnableValidator

  beforeAll(async () => {
    chainConfig = inject("chainConfig")
    chain = chainConfig.chain
    chainId = chain.id
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

    // @ts-ignore
    publicClient = createTestClient({
      mode: "anvil",
      chain,
      transport: http(),
      account
    })
      .extend(publicActions)
      .extend(walletActions)

    smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl: "", // Cannot be used without 'testWithBundler()' helper,
      customChain: chain,
      rpcUrl: chain.rpcUrls.default[0],
      chainId: chain.id
    })

    recipientSmartAccount = await createSmartAccountClient({
      signer: recipientWalletClient,
      bundlerUrl: "",
      customChain: chain,
      rpcUrl: chain.rpcUrls.default[0],
      chainId: chain.id
    })

    smartAccountAddress = await smartAccount.getAccountAddress()
    recipientSmartAccountAddress = await recipientSmartAccount.getAddress()

    ownableExecutorModule = await createOwnableExecutorModule(smartAccount)
    ownableValidatorModule = await createOwnableValidatorModule(
      smartAccount,
      1,
      [account.address, recipientAccount.address]
    )

    smartAccount.setActiveExecutionModule(ownableExecutorModule)
    smartAccount.setActiveValidationModule(ownableValidatorModule)

    await topUp(smartAccountAddress, chain)

    await topUp(account.address, chain)
    await smartAccount.deploy(skipBundler)
  })

  test("should return gas estimates for minting an NFT", async () => {
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
      smartAccount.getGasEstimate([transaction], skipBundler),
      smartAccount.getGasEstimate([transaction, transaction], skipBundler)
    ])

    const zeroGasEstimate = results.every(
      (result, i) => typeof result === "bigint"
    )

    expect(zeroGasEstimate).toBeTruthy()
  }, 60000)

  test.skip("should throw if PrivateKeyAccount is used as signer and rpcUrl is not provided", async () => {
    const createSmartAccount = createSmartAccountClient({
      signer: account as SupportedSigner,
      bundlerUrl: ""
    })

    await expect(createSmartAccount).rejects.toThrow(
      ERROR_MESSAGES.MISSING_RPC_URL
    )
  }, 50000)

  test.skip("should get all modules", async () => {
    const modules = await smartAccount.getInstalledModules()

    console.log({ modules })

    if (await smartAccount.isAccountDeployed()) {
      expect(modules).resolves
    } else {
      expect(modules).rejects.toThrow("Account is not deployed")
    }
  }, 30000)
})
