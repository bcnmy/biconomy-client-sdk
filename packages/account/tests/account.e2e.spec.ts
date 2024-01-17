import { TestData } from "../../../tests";
import { BiconomyPaymaster, PaymasterMode } from "@biconomy/paymaster";
import { createSmartWalletClient } from "../src/index";
import { Hex, encodeFunctionData, parseAbi } from "viem";
import { UserOperationStruct } from "@alchemy/aa-core";
import { checkBalance, entryPointABI } from "../../../tests/utils";

describe("Account Tests", () => {
  let mumbai: TestData;
  let baseGoerli: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [mumbai, baseGoerli] = testDataPerChain;
  });

  it("should send some native token to a recipient", async () => {
    const {
      whale: { viemWallet: signer },
      minnow: { publicAddress: recipient },
      bundlerUrl,
      publicClient,
    } = mumbai;

    const smartWallet = await createSmartWalletClient({
      signer,
      bundlerUrl,
    });

    const balance = (await checkBalance(publicClient, recipient)) as bigint;
    const { wait } = await smartWallet.sendTransaction({
      to: recipient,
      value: 1,
      data: "0x",
    });

    const result = await wait();
    const newBalance = (await checkBalance(publicClient, recipient)) as bigint;

    expect(result?.receipt?.transactionHash).toBeTruthy();
    expect(newBalance - balance).toBe(1n);
  }, 50000);

  it("Create a smart account with paymaster with an api key", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      biconomyPaymasterApiKey,
      chainId,
    } = mumbai;

    const smartWallet = await createSmartWalletClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const paymaster = smartWallet.paymaster;
    expect(paymaster).not.toBeNull();
    expect(paymaster).not.toBeUndefined();
  });

  it("Should gaslessly mint an NFT on Mumbai", async () => {
    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
    const {
      whale: { viemWallet: signer, publicAddress: recipient },
      bundlerUrl,
      biconomyPaymasterApiKey,
      publicClient,
    } = mumbai;

    const smartWallet = await createSmartWalletClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
    });

    const paymaster: BiconomyPaymaster = smartWallet.paymaster as BiconomyPaymaster;

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address to) public"]),
      functionName: "safeMint",
      args: [recipient],
    });

    const transaction = {
      to: nftAddress, // NFT address
      data: encodedCall,
      value: 0,
    };

    const balance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;

    const { userOpHash } = await smartWallet.sendTransaction(transaction);
    expect(userOpHash).toBeTruthy();

    const newBalance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;

    expect(newBalance - balance).toBe(1n);
  }, 60000);

  it("#getUserOpHash should match entryPoint.getUserOpHash", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      entryPointAddress,
      publicClient,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartWallet = await createSmartWalletClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const userOp: UserOperationStruct = {
      sender: "0x".padEnd(42, "1") as string,
      nonce: 2,
      initCode: "0x3333",
      callData: "0x4444",
      callGasLimit: 5,
      verificationGasLimit: 6,
      preVerificationGas: 7,
      maxFeePerGas: 8,
      maxPriorityFeePerGas: 9,
      paymasterAndData: "0xaaaaaa",
      signature: "0xbbbb",
    };

    const epHash = await publicClient.readContract({
      address: entryPointAddress as Hex,
      abi: entryPointABI,
      functionName: "getUserOpHash",
      // @ts-ignore
      args: [userOp],
    });

    const hash = await smartWallet.getUserOpHash(userOp);
    expect(hash).toBe(epHash);
  }, 30000);

  it("should be deployed to counterfactual address", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      publicClient,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartWallet = await createSmartWalletClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const accountAddress = await smartWallet.getAccountAddress();
    const byteCode = await publicClient.getBytecode({ address: accountAddress as Hex });

    expect(byteCode?.length).toBeGreaterThan(2);
  }, 10000); // on github runner it takes more time than 5000ms

  it("should check if ecdsaOwnershipModule is enabled", async () => {
    const ecdsaOwnershipModule = "0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e";

    const {
      whale: { viemWallet: signer },
      bundlerUrl,
    } = mumbai;

    const smartWallet = await createSmartWalletClient({
      signer,
      bundlerUrl,
    });

    expect(ecdsaOwnershipModule).toBe(smartWallet.activeValidationModule.getAddress());
  });
});
