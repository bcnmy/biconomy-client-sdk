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

const buildUserOptions: BuildUserOpOptions = {
  skipBundler: true
}

describe("OwnableValidator", () => {
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
      chainId,
      signer: walletClient,
      bundlerUrl: "" // Cannot be used without 'testWithBundler()' helper
    })

    recipientSmartAccount = await createSmartAccountClient({
      chainId,
      signer: recipientWalletClient,
      bundlerUrl: ""
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
  })

  test("dummy test", () => {
    expect(true).toBeTruthy()
  })
})
