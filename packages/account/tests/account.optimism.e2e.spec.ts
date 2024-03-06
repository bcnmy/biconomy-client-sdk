import { TestData } from "../../../tests";
import { createSmartAccountClient, PaymasterMode } from "../src/index";
import { encodeFunctionData, parseAbi } from "viem";
import { checkBalance } from "../../../tests/utils";

const maybe = process.env.WITH_MAINNET_TESTS === "true" ? describe : describe.skip;

maybe("Account Tests", () => {
  let optimism: TestData;
  let _: TestData;
  let __: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [_, __, optimism] = testDataPerChain;
  });

  it("should send some native token to a recipient on optimism", async () => {
    const {
      whale: { viemWallet: signer, publicAddress: sender },
      minnow: { publicAddress: recipient },
      bundlerUrl,
      publicClient,
    } = optimism;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });

    const accountAddress = await smartAccount.getAddress();

    const balanceOfRecipient = (await checkBalance(publicClient, recipient)) as bigint;
    const smartAccountBalance = (await checkBalance(publicClient, accountAddress)) as bigint;
    const { wait } = await smartAccount.sendTransaction(
      {
        to: recipient,
        value: BigInt(1),
      },
      {
        simulationType: "validation_and_execution",
      },
    );

    const result = await wait();
    const newBalanceOfRecipient = (await checkBalance(publicClient, recipient)) as bigint;

    expect(result?.receipt?.transactionHash).toBeTruthy();
    expect(result.success).toBe("true");
    expect(newBalanceOfRecipient).toBeGreaterThan(balanceOfRecipient);
  }, 50000);

  it("Create a smart account with paymaster with an api key on optimism", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = optimism;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const paymaster = smartAccount.paymaster;
    expect(paymaster).not.toBeNull();
    expect(paymaster).not.toBeUndefined();
  });

  it("Should gaslessly mint an NFT on optimism", async () => {
    const {
      whale: { viemWallet: signer, publicAddress: recipient },
      bundlerUrl,
      biconomyPaymasterApiKey,
      publicClient,
      nftAddress,
    } = optimism;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
    });

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address to) public"]),
      functionName: "safeMint",
      args: [recipient],
    });

    const transaction = {
      to: nftAddress, // NFT address
      data: encodedCall,
    };

    const balance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;

    const maticBalanceBefore = await checkBalance(publicClient, await smartAccount.getAddress());

    const response = await smartAccount.sendTransaction(transaction, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
      simulationType: "validation_and_execution",
    });

    const userOpReceipt = await response.wait(3);
    expect(userOpReceipt.userOpHash).toBeTruthy();
    expect(userOpReceipt.success).toBe("true");

    const maticBalanceAfter = await checkBalance(publicClient, await smartAccount.getAddress());

    expect(maticBalanceAfter).toEqual(maticBalanceBefore);

    const newBalance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;

    expect(newBalance - balance).toBe(1n);
  }, 50000);
});
