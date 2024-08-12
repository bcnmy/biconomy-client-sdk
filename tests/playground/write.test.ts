import { http, type Hex, createPublicClient, createWalletClient, encodeFunctionData, getContract, parseAbi } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { polygonAmoy, taikoHekla } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import { DEFAULT_BICONOMY_FACTORY_ADDRESS, PaymasterMode, type PolicyLeaf, TAIKO_FACTORY_ADDRESS, createECDSAOwnershipValidationModule } from "../../src"
import {
  type BiconomySmartAccountV2,
  createSmartAccountClient,
  DEFAULT_ENTRYPOINT_ADDRESS,
  getChain,
  getCustomChain
} from "../../src/account"
import { BiconomyFactoryAbi } from "../../src/account/abi/Factory"
import { createSession } from "../../src/modules/sessions/abi"
import { createSessionSmartAccountClient } from "../../src/modules/sessions/sessionSmartAccountClient"
import { checkBalance, getBundlerUrl, getConfig, getPaymasterUrl } from "../utils"
import { EntryPointAbi } from "../../src/account/abi/EntryPointAbi"

const withSponsorship = {
  paymasterServiceData: { mode: PaymasterMode.SPONSORED },
};

describe("Playground:Write", () => {


  test.concurrent(
    "should check taiko",
    async () => {

      const { privateKey, privateKeyTwo } = getConfig();

      const customChain = taikoHekla
      const chainId = customChain.id;
      const bundlerUrl = getBundlerUrl(chainId);

      const account = privateKeyToAccount(`0x${privateKey}`);
      const recipientAccount = privateKeyToAccount(`0x${privateKeyTwo}`);

      const walletClientWithCustomChain = createWalletClient({
        account,
        chain: customChain,
        transport: http(),
      })

      const publicClient = createPublicClient({
        chain: customChain,
        transport: http(),
      })

      const smartAccount = await createSmartAccountClient({
        signer: walletClientWithCustomChain,
        bundlerUrl,
        customChain,
      })

      const smartAccountAddress: Hex = await smartAccount.getAddress();
      const [balance] = await smartAccount.getBalances();
      if (balance.amount <= 1n) console.warn("Insufficient balance in smart account")

      const recipientBalanceBefore = await checkBalance(recipientAccount.address, undefined, customChain);

      const userOp = await smartAccount.buildUserOp([
        {
          to: recipientAccount.address,
          value: 1n
        }
      ])

      userOp.signature = undefined

      const signedUserOp = await smartAccount.signUserOp(userOp)

      const entrypointContract = getContract({
        address: DEFAULT_ENTRYPOINT_ADDRESS,
        abi: EntryPointAbi,
        client: { public: publicClient, wallet: walletClientWithCustomChain }
      })

      const hash = await entrypointContract.write.handleOps([
        [
          {
            sender: signedUserOp.sender as Hex,
            nonce: BigInt(signedUserOp.nonce ?? 0),
            callGasLimit: BigInt(signedUserOp.callGasLimit ?? 0),
            verificationGasLimit: BigInt(signedUserOp.verificationGasLimit ?? 0),
            preVerificationGas: BigInt(signedUserOp.preVerificationGas ?? 0),
            maxFeePerGas: BigInt(signedUserOp.maxFeePerGas ?? 0),
            maxPriorityFeePerGas: BigInt(signedUserOp.maxPriorityFeePerGas ?? 0),
            initCode: signedUserOp.initCode as Hex,
            callData: signedUserOp.callData as Hex,
            paymasterAndData: signedUserOp.paymasterAndData as Hex,
            signature: signedUserOp.signature as Hex
          }
        ],
        account.address
      ])

      const { status, transactionHash } =
        await publicClient.waitForTransactionReceipt({ hash })

      const recipientBalanceAfter = await checkBalance(recipientAccount.address, undefined, customChain);

      expect(status).toBe("success")
      expect(transactionHash).toBeTruthy()

      expect(recipientBalanceAfter).toBe(recipientBalanceBefore + 1n)

    },
    70000
  )

})
