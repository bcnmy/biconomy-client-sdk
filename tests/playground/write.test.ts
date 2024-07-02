import { defaultAbiCoder } from "@ethersproject/abi"
import {
  http,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi,
  parseUnits
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
  type BiconomySmartAccountV2,
  type Transaction,
  createSmartAccountClient
} from "../../src/account"
import {
  type CreateSessionDataParams,
  DEFAULT_ERC20_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  SessionMemoryStorage,
  createDANSessionKeyManagerModule
} from "../../src/modules/index"
import { getDANSessionKey } from "../../src/modules/sessions/dan"
import { PaymasterMode } from "../../src/paymaster"
import { checkBalance, getConfig } from "../utils"

const withSponsorship = {
  paymasterServiceData: { mode: PaymasterMode.SPONSORED }
}

describe("Playground:Write", () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const token = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"
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

  test("should create and use a DAN session on behalf of a user", async () => {
    const amount = parseUnits("50".toString(), 6)

    const {
      sessionKeyEOA,
      mpcKeyId,
      ephSK,
      partiesNumber,
      threshold,
      eoaAddress
    } = await getDANSessionKey(smartAccount)

    const sessionStorageClient = new SessionMemoryStorage(smartAccountAddress)

    const sessionsModule = await createDANSessionKeyManagerModule({
      smartAccountAddress,
      sessionStorageClient
    })

    // cretae session key data
    const sessionKeyData = defaultAbiCoder.encode(
      ["address", "address", "address", "uint256"],
      [sessionKeyEOA, token, eoaAddress, amount]
    ) as Hex

    const createSessionDataParams: CreateSessionDataParams = {
      validAfter: 0,
      validUntil: 0,
      sessionValidationModule: DEFAULT_ERC20_MODULE,
      sessionPublicKey: sessionKeyEOA,
      sessionKeyData: sessionKeyData
    }

    const { data: policyData, sessionIDInfo } =
      await sessionsModule.createSessionData([createSessionDataParams])

    const sessionID = sessionIDInfo[0]

    const permitTx = {
      to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
      data: policyData
    }

    const txs: Transaction[] = []

    const isDeployed = await smartAccount.isAccountDeployed()
    const enableSessionTx = await smartAccount.getEnableModuleData(
      DEFAULT_SESSION_KEY_MANAGER_MODULE
    )

    if (isDeployed) {
      const enabled = await smartAccount.isModuleEnabled(
        DEFAULT_SESSION_KEY_MANAGER_MODULE
      )
      if (!enabled) {
        txs.push(enableSessionTx)
      }
    } else {
      txs.push(enableSessionTx)
    }

    txs.push(permitTx)

    const { wait } = await smartAccount.sendTransaction(txs, withSponsorship)

    const {
      receipt: { transactionHash },
      success
    } = await wait()

    expect(success).toBe("true")

    const transferTx: Transaction = {
      to: token,
      data: encodeFunctionData({
        abi: parseAbi(["function transfer(address _to, uint256 _value)"]),
        functionName: "transfer",
        args: [eoaAddress, amount]
      })
    }

    const nftBalanceBefore = await checkBalance(smartAccountAddress, nftAddress)

    smartAccount = smartAccount.setActiveValidationModule(sessionsModule)

    const { wait: mintWait } = await smartAccount.sendTransaction(transferTx, {
      ...withSponsorship,
      params: {
        sessionID,
        danModuleInfo: {
          eoaAddress,
          ephSK,
          threshold,
          partiesNumber,
          chainId: chain.id,
          mpcKeyId
        }
      }
    })
    const { success: mintSuccess } = await mintWait()

    expect(mintSuccess).toBe("true")

    const nftBalanceAfter = await checkBalance(smartAccountAddress, nftAddress)
    expect(nftBalanceAfter - nftBalanceBefore).toBe(1n)
  }, 50000)
})
