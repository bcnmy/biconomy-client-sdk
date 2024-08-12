import { http, type Hex, createPublicClient, createWalletClient, encodeFunctionData, parseAbi } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { polygonAmoy } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import { PaymasterMode, type PolicyLeaf } from "../../src"
import {
  type BiconomySmartAccountV2,
  createSmartAccountClient,
  getChain,
  getCustomChain
} from "../../src/account"
import { createSession } from "../../src/modules/sessions/abi"
import { createSessionSmartAccountClient } from "../../src/modules/sessions/sessionSmartAccountClient"
import { getBundlerUrl, getConfig, getPaymasterUrl } from "../utils"

const withSponsorship = {
  paymasterServiceData: { mode: PaymasterMode.SPONSORED },
};

describe("Playground:Write", () => {

  test.concurrent(
    "should quickly run a write test in the playground ",
    async () => {

      const { privateKey } = getConfig();
      const incrementCountContractAdd = "0xcf29227477393728935BdBB86770f8F81b698F1A";

      // const customChain = getCustomChain(
      //   "Bera",
      //   80084,
      //   "https://bartio.rpc.b-harvest.io",
      //   "https://bartio.beratrail.io/tx"
      // )

      // Switch to this line to test against Amoy
      const customChain = polygonAmoy;
      const chainId = customChain.id;
      const bundlerUrl = getBundlerUrl(chainId);

      const paymasterUrls = {
        80002: getPaymasterUrl(chainId, "_sTfkyAEp.552504b5-9093-4d4b-94dd-701f85a267ea"),
        80084: getPaymasterUrl(chainId, "9ooHeMdTl.aa829ad6-e07b-4fcb-afc2-584e3400b4f5")
      }

      const paymasterUrl = paymasterUrls[chainId];
      const account = privateKeyToAccount(`0x${privateKey}`);

      const walletClientWithCustomChain = createWalletClient({
        account,
        chain: customChain,
        transport: http()
      })

      const publicClient = createPublicClient({
        chain: customChain,
        transport: http()
      })


      // const smartAccount = await createSmartAccountClient({
      //   signer: walletClientWithCustomChain,
      //   bundlerUrl,
      //   paymasterUrl,
      //   customChain
      // })

      // const smartAccountAddress: Hex = await smartAccount.getAddress();

      // const [balance] = await smartAccount.getBalances();
      // if (balance.amount <= 0) console.warn("Smart account balance is zero");

      // const policy: PolicyLeaf[] = [
      //   {
      //     contractAddress: incrementCountContractAdd,
      //     functionSelector: "increment()",
      //     rules: [],
      //     interval: {
      //       validUntil: 0,
      //       validAfter: 0,
      //     },
      //     valueLimit: BigInt(0),
      //   },
      // ];

      // const { wait } = await createSession(smartAccount, policy, null, withSponsorship);
      // const { success } = await wait();

      // expect(success).toBe("true");

      // const smartAccountWithSession = await createSessionSmartAccountClient(
      //   {
      //     accountAddress: smartAccountAddress, // Set the account address on behalf of the user
      //     bundlerUrl,
      //     paymasterUrl,
      //     chainId,
      //   },
      //   "DEFAULT_STORE" // Storage client, full Session or smartAccount address if using default storage
      // );

      // const { wait: mintWait } = await smartAccountWithSession.sendTransaction(
      //   {
      //     to: incrementCountContractAdd,
      //     data: encodeFunctionData({
      //       abi: parseAbi(["function increment()"]),
      //       functionName: "increment",
      //       args: [],
      //     }),
      //   },
      //   { paymasterServiceData: { mode: PaymasterMode.SPONSORED } },
      //   { leafIndex: "LAST_LEAF" },
      // );


      const hash = await walletClientWithCustomChain.sendTransaction({
        to: incrementCountContractAdd,
        data: encodeFunctionData({
          abi: parseAbi(["function increment()"]),
          functionName: "increment",
        }),
      });


      const receipt = await publicClient.getTransactionReceipt({ hash });
      console.log({ receipt })

      // const { success: mintSuccess, receipt } = await mintWait();
      // expect(mintSuccess).toBe("true");

      console.log({ receipt })

    },
    30000
  )
})
