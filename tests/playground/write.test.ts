import { http, type Hex, createPublicClient, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonAmoy } from "viem/chains";
import { beforeAll, describe, expect, test } from "vitest"
import { type BiconomySmartAccountV2, createSmartAccountClient } from "../../src"
import { getBundlerUrl, getConfig } from "../utils";


describe("Playground", async () => {
  const { privateKey, chain } = getConfig()
  const customChain = chain ?? polygonAmoy;

  /*
    // Alternatively, you can use the following custom chain configuration...
  
    const customChain = getCustomChain(
      "Bera",
      80084,
      "https://bartio.rpc.b-harvest.io",
      "https://bartio.beratrail.io/tx"
    )
  
  */

  const chainId = customChain.id;
  const bundlerUrl = getBundlerUrl(chainId);
  const account = privateKeyToAccount(`0x${privateKey}`);

  const publicClient = createPublicClient({
    chain: customChain,
    transport: http()
  })

  const walletClient = createWalletClient({
    account,
    chain: customChain,
    transport: http()
  })

  let smartAccount: BiconomySmartAccountV2;
  let smartAccountAddress: Hex;

  beforeAll(async () => {
    smartAccount = await createSmartAccountClient({
      signer: walletClient,
      bundlerUrl,
      customChain
    })

    smartAccountAddress = await smartAccount.getAddress();

    const [balance] = await smartAccount.getBalances();
    const walletClientBalance = await publicClient.getBalance({ address: account.address });

    console.log("account.address: ", account.address);
    console.log("smartAccountAddress: ", smartAccountAddress);

    if (balance.amount <= 0) console.warn("Smart account balance is zero");
    if (walletClientBalance <= 0) console.warn("Wallet client balance is zero");
  })


  test("should send some native token for the configured chain", async () => {

    const { wait } = await smartAccount.sendTransaction(
      {
        to: "0x3079B249DFDE4692D7844aA261f8cf7D927A0DA5",
        value: BigInt(1)
      },
    );

    const { success } = await wait();
    expect(success).toBe("true");

  }, 30000)

})