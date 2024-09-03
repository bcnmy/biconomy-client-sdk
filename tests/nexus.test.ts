import {
  http,
  type Account,
  type Chain,
  type Hex,
  type Prettify,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  isHex
} from "viem"
import {
  type BundlerClient,
  createBundlerClient
} from "viem/account-abstraction"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import contracts from "../src/__contracts"
import {
  type NexusSmartAccount,
  createSmartAccountClient
} from "../src/account"
import { toNexus } from "../src/account/Nexus"
import { type TestFileNetworkType, toNetwork } from "./src/testSetup"
import { killNetwork } from "./src/testUtils"
import type { NetworkConfig } from "./src/testUtils"

const NETWORK_TYPE: TestFileNetworkType = "PUBLIC_TESTNET"

// Remove the following lines to use the default factory and validator addresses
// These are relevant only for now on base sopelia chain and are likely to change
const k1ValidatorAddress = "0x663E709f60477f07885230E213b8149a7027239B"
const factoryAddress = "0x887Ca6FaFD62737D0E79A2b8Da41f0B15A864778"

describe("nexus", () => {
  let network: NetworkConfig
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let walletClient: WalletClient
  let bundlerClient: BundlerClient

  // Test utils
  let publicClient: PublicClient
  let account: Account
  let smartAccount: NexusSmartAccount
  let nexus: Prettify<Awaited<ReturnType<typeof toNexus>>>
  let smartAccountAddress: Hex
  let nexusAccountAddress: Hex

  beforeAll(async () => {
    network = (await toNetwork(NETWORK_TYPE)) as NetworkConfig

    chain = network.chain
    bundlerUrl = network.bundlerUrl

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
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should create a smart account", async () => {
    const regularWalletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    smartAccount = await createSmartAccountClient({
      signer: regularWalletClient,
      bundlerUrl,
      chain,
      k1ValidatorAddress,
      factoryAddress
    })

    nexus = await toNexus({
      owner: account,
      chain,
      transport: http(),
      factoryAddress,
      k1ValidatorAddress
    })

    smartAccountAddress = await smartAccount.getAddress()
    nexusAccountAddress = await nexus.getAddress()
  })

  test("should produce the same results", async () => {
    const [smartAccountAddress, nexusAddress] = await Promise.all([
      smartAccount.getAddress(),
      nexus.getAddress()
    ])
    expect(smartAccountAddress).toEqual(nexusAddress)
    nexusAccountAddress = nexusAddress

    console.log({ smartAccountAddress }, account.address)

    const [initCode, nexusInitCode] = await Promise.all([
      smartAccount.getAccountInitCode(),
      nexus.getInitCode()
    ])

    expect([initCode, nexusInitCode].every((code) => isHex(code))).toBeTruthy()

    const [smartAccountFactoryData, nexusFactoryData] = await Promise.all([
      smartAccount.getFactoryData(),
      nexus.factoryData
    ])
    expect(isHex(nexusFactoryData)).toBeTruthy()

    const [smartAccountIsDeployed, nexusIsDeployed] = await Promise.all([
      smartAccount.isAccountDeployed(),
      nexus.isDeployed()
    ])
    expect(smartAccountIsDeployed).toEqual(nexusIsDeployed)
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
    const balancesAreOfCorrectType = [ownerBalance, smartAccountBalance].every(
      (balance) => typeof balance === "bigint"
    )

    console.log({ ownerBalance, smartAccountBalance })
    if (smartAccountBalance < 1000000000000n) {
      const hash = await walletClient.sendTransaction({
        chain,
        account,
        to: smartAccountAddress,
        value: 1000000000000n
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log({ receipt })
    }
    expect(balancesAreOfCorrectType).toBeTruthy()
  })

  test("should have a working bundler client", async () => {
    const bundlerClient = createBundlerClient({
      account: nexus,
      chain,
      transport: http(bundlerUrl)
    })

    const chainId = await bundlerClient.getChainId()
    expect(chainId).toEqual(chain.id)

    const supportedEntrypoints = await bundlerClient.getSupportedEntryPoints()
    expect(supportedEntrypoints).to.include(contracts.entryPoint.address)
  })

  test("should prepare a user operation", async () => {
    const bundlerClient = createBundlerClient({
      account: nexus,
      chain,
      transport: http(bundlerUrl)
    })

    const isDeployed = await nexus.isDeployed()

    const calls = [{ to: account.address, value: 1n }]
    const feeData = await publicClient.estimateFeesPerGas()
    const gas = {
      maxFeePerGas: feeData.maxFeePerGas * 2n,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 2n
    }

    const UNDER_THE_HOOD = true

    if (UNDER_THE_HOOD) {
      const preppedUserOp = await bundlerClient.prepareUserOperation({
        calls,
        ...gas
      })
      const signature = await nexus.signUserOperation(preppedUserOp)
      const uO = { ...preppedUserOp, signature }
      const gasEstimates = await bundlerClient.estimateUserOperationGas(uO)
      const userOpWithGasEstimates = { ...uO, ...gasEstimates }

      const nexusNonce = await nexus.getNonce()
      console.log({ nexusNonce })

      const { wait } = await smartAccount.sendTransaction(calls)
      // const { success } = await wait()
      // expect(success).toBe(true)

      console.log({ userOpWithGasEstimates })

      const hash = await bundlerClient.sendUserOperation(userOpWithGasEstimates)

      const receipt = await bundlerClient.waitForUserOperationReceipt({ hash })
      console.log({ receipt })
    } else {
      const hash = await bundlerClient.sendUserOperation({ calls, ...gas })
      const receipt = await bundlerClient.waitForUserOperationReceipt({ hash })
      console.log({ receipt })
    }

    // const encodedCalls = await nexus.encodeCalls(calls)
    // expect(isHex(encodedCalls)).toBeTruthy()

    // const preppedUserOperation = await bundlerClient.prepareUserOperation({
    //   calls,
    //   ...feeData
    // })

    // // const gasPrice = await bundlerClient

    // const {
    //   factory,
    //   factoryData,
    //   paymasterPostOpGasLimit,
    //   paymasterVerificationGasLimit,
    //   ...rawUserOperation
    // } = preppedUserOperation

    // const signature = await nexus.signUserOperation(preppedUserOperation)

    // const uO = { ...rawUserOperation, signature }

    // console.log({ uO })

    // // const gasEstimates =
    // //   await bundlerClient.estimateUserOperationGas(preppedUserOperation)

    // // const userOpWithOld = await smartAccount.buildUserOp([])
    // // const signedUserOpWithOld = await smartAccount.signUserOp(userOpWithOld)
    // // console.log({ signedUserOpWithOld })
    // const { wait } = await smartAccount.sendTransaction(calls)
    // const { receipt: receiptOld } = await wait()
    // console.log({ receiptOld })

    // const receipt = await bundlerClient.sendUserOperation(uO)
    // console.log({ receipt })

    // const gasEstimates = await bundlerClient.prepareUserOperation({
    //   //   account: parseAccount(account),
    //   callData: "0x",
    //   maxFeePerGas: 1n,
    //   maxPriorityFeePerGas: 1n
    // })

    // console.log(gasEstimates)

    // const userOperation = await nexus.signUserOperation({
    //   callData: encodedCalls,
    //   callGasLimit,
    //   maxFeePerGas,
    //   maxPriorityFeePerGas,
    //   nonce
    // })

    // estimateUserOperationGas: [Function: estimateUserOperationGas],
    // getChainId: [Function: getChainId],
    // getSupportedEntryPoints: [Function: getSupportedEntryPoints],
    // getUserOperation: [Function: getUserOperation],
    // getUserOperationReceipt: [Function: getUserOperationReceipt],
    // prepareUserOperation: [Function: prepareUserOperation],
    // sendUserOperation: [Function: sendUserOperation],
    // waitForUserOperationReceipt: [Function: waitForUserOperationReceipt]

    // console.log(bundlerClient)
  })
})
