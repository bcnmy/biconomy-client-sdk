import { http, type Hex, createPublicClient, createWalletClient, encodeFunctionData, getContract, parseAbi } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { polygonAmoy, taikoHekla } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import { DEFAULT_BICONOMY_FACTORY_ADDRESS, PaymasterMode, type PolicyLeaf, TAIKO_FACTORY_ADDRESS, createECDSAOwnershipValidationModule } from "../../src"
import {
  type BiconomySmartAccountV2,
  createSmartAccountClient,
  getChain,
  getCustomChain
} from "../../src/account"
import { BiconomyFactoryAbi } from "../../src/account/abi/Factory"
import { createSession } from "../../src/modules/sessions/abi"
import { createSessionSmartAccountClient } from "../../src/modules/sessions/sessionSmartAccountClient"
import { checkBalance, getBundlerUrl, getConfig, getPaymasterUrl } from "../utils"

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

      console.log({ smartAccountAddress, balance })

      const recipientBalanceBefore = await checkBalance(recipientAccount.address, undefined, customChain);


      console.log(await publicClient.getCode({ address: TAIKO_FACTORY_ADDRESS }))


      const userOp = await smartAccount.buildUserOp([
        {
          to: recipientAccount.address,
          value: 1n
        }
      ])

      userOp.signature = undefined


      // await expect(
      //   smartAccount.sendTransaction(
      //     {
      //       to: recipientAccount.address,
      //       value: 1n
      //     }
      //   )
      // ).rejects.not.toThrow("aa14")

      // Uncomment the following code to test the transaction...

      // const { wait } = await smartAccount.sendTransaction(
      //   {
      //     to: recipientAccount.address,
      //     value: 1n
      //   }
      // )

      // const {
      //   receipt: { transactionHash },
      //   success
      // } = await wait()

      // expect(success).toBe("true");


      // const recipientBalanceAfter = await checkBalance(recipientAccount.address, undefined, customChain);

      // expect(transactionHash).toBeTruthy()
      // expect(recipientBalanceBefore - recipientBalanceAfter).toBe(1n)

    },
    30000
  )

  test.concurrent(
    "should having matching counterFactual address from the contracts with smartAccount.getAddress()",
    async () => {
      const { privateKey, privateKeyTwo } = getConfig();

      const customChain = taikoHekla
      const chainId = customChain.id;
      const bundlerUrl = getBundlerUrl(chainId);

      const account = privateKeyToAccount(`0x${privateKey}`);
      const recipientAccount = privateKeyToAccount(`0x${privateKeyTwo}`);

      const publicClient = createPublicClient({
        chain: customChain,
        transport: http(),
      })

      const walletClientWithCustomChain = createWalletClient({
        account,
        chain: customChain,
        transport: http(),
      })

      const ecdsaModule = await createECDSAOwnershipValidationModule({
        signer: walletClientWithCustomChain
      })


      const smartAccount = await createSmartAccountClient({
        signer: walletClientWithCustomChain,
        bundlerUrl,
        customChain,
      })

      const owner = ecdsaModule.getAddress()
      const moduleSetupData = (await ecdsaModule.getInitData()) as Hex

      const factoryContract = getContract({
        address: TAIKO_FACTORY_ADDRESS,
        abi: BiconomyFactoryAbi,
        client: { public: publicClient, wallet: walletClientWithCustomChain }
      })

      const smartAccountAddressFromContracts =
        await factoryContract.read.getAddressForCounterFactualAccount([
          owner,
          moduleSetupData,
          BigInt(0)
        ])

      const smartAccountAddressFromSDK = await smartAccount.getAccountAddress()
      expect(smartAccountAddressFromSDK).toBe(smartAccountAddressFromContracts)
    }
  )


})
