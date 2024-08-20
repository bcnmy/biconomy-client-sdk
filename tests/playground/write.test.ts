import { http, type Hex, createPublicClient, createWalletClient, encodeFunctionData, parseAbi } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { describe, expect, test } from "vitest"
import { PaymasterMode, type PolicyLeaf, type Transaction } from "../../src"
import {
  createSmartAccountClient,
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

      const { privateKeyTwo } = getConfig();
      // const incrementCountContractAdd = "0xfeec89eC2afD503FF359487967D02285f7DaA9aD";
      const incrementCountContractAdd = "0xcf29227477393728935BdBB86770f8F81b698F1A";

      // const customChain = getCustomChain(
      //   "Bera",
      //   80084,
      //   "https://bartio.rpc.b-harvest.io",
      //   "https://bartio.beratrail.io/tx"
      // )

      // Switch to this line to test against Amoy
      // const customChain = polygonAmoy;
      const customChain = getCustomChain(
        "Bera",
        80084,
        "https://bartio.drpc.org", ""
      );
      const chainId = customChain.id;
      const bundlerUrl = getBundlerUrl(chainId);

      const paymasterUrls = {
        80002: getPaymasterUrl(chainId, "_sTfkyAEp.552504b5-9093-4d4b-94dd-701f85a267ea"),
        80084: getPaymasterUrl(chainId, "9ooHeMdTl.aa829ad6-e07b-4fcb-afc2-584e3400b4f5")
      }

      const paymasterUrl = paymasterUrls[chainId];
      const account = privateKeyToAccount(`0x${privateKeyTwo}`);

      const signer = createWalletClient({
        account,
        chain: customChain,
        transport: http(customChain.rpcUrls.default.http[0])
      })

      const smartAccount = await createSmartAccountClient({
        signer,
        bundlerUrl,
        paymasterUrl,
        customChain,
        rpcUrl: customChain.rpcUrls.default.http[0]
      })

      const publicClient = createPublicClient({
        chain: customChain,
        transport: http()
      });

      const walletBalance = await publicClient.getBalance({address: account.address});

      console.log(account.address, { walletBalance });
      const smartAccountAddress: Hex = await smartAccount.getAddress();
      const [balance] = await smartAccount.getBalances();
      console.log({ smartAccountAddress, balance }); 

      const incrementData: Transaction = { 
        to: incrementCountContractAdd,
        data: encodeFunctionData({
          abi: parseAbi(["function increment()"]),
          functionName: "increment",
        })
    }

      const hashOfIncrement = await signer.sendTransaction({
        to: incrementCountContractAdd,
        data: encodeFunctionData({
          abi: parseAbi(["function increment()"]),
          functionName: "increment",
        }),
      });

      const receiptOfIncrement = await publicClient.waitForTransactionReceipt({hash: hashOfIncrement});

      console.log({receiptOfIncrement});


      if (balance.amount <= 0) { 
        const hash = await signer.sendTransaction({
          to: smartAccountAddress,
          value: BigInt(1e18),
        });
        const receipt = await publicClient.waitForTransactionReceipt({hash});
        console.warn("Smart account balance was zero: ", receipt); 
      }

      const policy: PolicyLeaf[] = [
        {
          contractAddress: incrementCountContractAdd,
          functionSelector: "increment()",
          rules: [],
          interval: {
            validUntil: 0,
            validAfter: 0,
          },
          valueLimit: BigInt(0),
        },
      ];

      const { wait } = await createSession(smartAccount, policy)

      const { success } = await wait();

      const smartAccountWithSession = await createSessionSmartAccountClient(
        {
          accountAddress: smartAccountAddress, // Set the account address on behalf of the user
          bundlerUrl,
          paymasterUrl,
          chainId,
        },
        "DEFAULT_STORE" // Storage client, full Session or smartAccount address if using default storage
      );



      // const userOp = await smartAccount.buildUserOp([incrementData], {

      // });

      // const signedUserOp = await smartAccount.signUserOp(userOp)


      expect(
        smartAccountWithSession.sendTransaction(
          incrementData,
          undefined,
          { leafIndex: "LAST_LEAF" },
        )
      ).rejects.toThrowError(
        "aa23"
      )
        
      // const { success: mintSuccess, receipt } = await mintWait();
      // expect(mintSuccess).toBe("true");

      const userOp = await smartAccount.buildUserOp([incrementData]);
      const {wait: waitForNoSessionSend} = await smartAccount.sendUserOp(userOp);

      const {receipt, success:noSessionSendSuccess} = await waitForNoSessionSend();

      expect(noSessionSendSuccess).toBe("true");

      // console.log({ receipt });

    },
    100000
  )
})
