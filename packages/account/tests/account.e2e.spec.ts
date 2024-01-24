import { TestData } from "../../../tests";
import {
  PaymasterUserOperationDto,
  createSmartAccountClient,
  FeeQuotesOrDataResponse,
  IHybridPaymaster,
  PaymasterFeeQuote,
  PaymasterMode,
} from "../src/index";
import { Hex, encodeFunctionData, parseAbi } from "viem";
import { UserOperationStruct } from "@alchemy/aa-core";
import { checkBalance, entryPointABI } from "../../../tests/utils";

describe("Account Tests", () => {
  let mumbai: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [mumbai] = testDataPerChain;
  });

  it("should send some native token to a recipient", async () => {
    const {
      whale: { viemWallet: signer },
      minnow: { publicAddress: recipient },
      bundlerUrl,
      publicClient,
    } = mumbai;

    const smartWallet = await createSmartAccountClient({
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
    } = mumbai;

    const smartWallet = await createSmartAccountClient({
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

    const smartWallet = await createSmartAccountClient({
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

    const maticBalanceBefore = await checkBalance(publicClient, await smartWallet.getAddress());

    const response = await smartWallet.sendTransaction(transaction, { paymasterServiceData: { mode: PaymasterMode.SPONSORED } });

    const userOpReceipt = await response.wait(3);
    expect(userOpReceipt.userOpHash).toBeTruthy();
    expect(userOpReceipt.success).toBe("true");

    const maticBalanceAfter = await checkBalance(publicClient, await smartWallet.getAddress());

    expect(maticBalanceAfter).toEqual(maticBalanceBefore);

    const newBalance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;

    expect(newBalance - balance).toBe(1n);
  }, 60000);

  it("Should mint an NFT on Mumbai and pay with ERC20", async () => {
    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
    const {
      whale: { viemWallet: signer, publicAddress: recipient },
      bundlerUrl,
      biconomyPaymasterApiKey,
      publicClient,
    } = mumbai;

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
    });

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address _to)"]),
      functionName: "safeMint",
      args: [recipient],
    });

    const transaction = {
      to: nftAddress, // NFT address
      data: encodedCall,
    };

    const balance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;

    const maticBalanceBefore = await checkBalance(publicClient, await smartWallet.getAddress());
    const usdcBalanceBefore = await checkBalance(publicClient, await smartWallet.getAddress(), "0xda5289fcaaf71d52a80a254da614a192b693e977");

    let userOp = await smartWallet.buildUserOp([transaction]);

    const feeQuotesResponse: FeeQuotesOrDataResponse = await (
      smartWallet.paymaster as IHybridPaymaster<PaymasterUserOperationDto>
    ).getPaymasterFeeQuotesOrData(userOp, {
      mode: PaymasterMode.ERC20,
      tokenList: ["0xda5289fcaaf71d52a80a254da614a192b693e977"],
      preferredToken: "0xda5289fcaaf71d52a80a254da614a192b693e977",
    });

    const feeQuotes = feeQuotesResponse.feeQuotes as PaymasterFeeQuote[];
    const spender = feeQuotesResponse.tokenPaymasterAddress as Hex;
    const selectedFeeQuote = feeQuotes[0];

    userOp = await smartWallet.setPaymasterUserOp(userOp, { mode: PaymasterMode.ERC20, feeQuote: selectedFeeQuote, spender, maxApproval: true });

    expect(userOp.paymasterAndData).toBeTruthy();
    expect(userOp.verificationGasLimit).toBeTruthy();
    expect(userOp.preVerificationGas).toBeTruthy();
    expect(userOp.maxFeePerGas).toBeTruthy();
    expect(userOp.maxPriorityFeePerGas).toBeTruthy();

    const response = await smartWallet.sendUserOp(userOp);

    const userOpReceipt = await response.wait();
    expect(userOpReceipt.userOpHash).toBeTruthy();
    expect(userOpReceipt.success).toBe("true");

    const maticBalanceAfter = await checkBalance(publicClient, await smartWallet.getAddress());
    expect(maticBalanceAfter).toEqual(maticBalanceBefore);

    const usdcBalanceAfter = await checkBalance(publicClient, await smartWallet.getAddress(), "0xda5289fcaaf71d52a80a254da614a192b693e977");
    expect(usdcBalanceAfter).toBeLessThan(usdcBalanceBefore);

    const newBalance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;
    expect(newBalance - balance).toBe(1n);
  }, 60000);

  it("Should throw and error if missing field for ERC20 Paymaster user op", async () => {
    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
    const {
      whale: { viemWallet: signer, publicAddress: recipient },
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
    });

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address _to)"]),
      functionName: "safeMint",
      args: [recipient],
    });

    const transaction = {
      to: nftAddress, // NFT address
      data: encodedCall,
    };

    const userOp = await smartWallet.buildUserOp([transaction]);

    const feeQuotesResponse: FeeQuotesOrDataResponse = await (
      smartWallet.paymaster as IHybridPaymaster<PaymasterUserOperationDto>
    ).getPaymasterFeeQuotesOrData(userOp, {
      mode: PaymasterMode.ERC20,
      tokenList: ["0xda5289fcaaf71d52a80a254da614a192b693e977"],
      preferredToken: "0xda5289fcaaf71d52a80a254da614a192b693e977",
    });

    const feeQuotes = feeQuotesResponse.feeQuotes as PaymasterFeeQuote[];
    const selectedFeeQuote = feeQuotes[0];

    // maxApproval and spender are missing
    await expect(smartWallet.setPaymasterUserOp(userOp, { mode: PaymasterMode.ERC20, feeQuote: selectedFeeQuote })).rejects.toThrow(
      "One or more fields are missing (mode, feeQuote, spender, maxApproval)",
    );
  }, 60000);

  it("#getUserOpHash should match entryPoint.getUserOpHash", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      entryPointAddress,
      publicClient,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartWallet = await createSmartAccountClient({
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

    const smartWallet = await createSmartAccountClient({
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

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });

    expect(ecdsaOwnershipModule).toBe(smartWallet.activeValidationModule.getAddress());
  });
});
