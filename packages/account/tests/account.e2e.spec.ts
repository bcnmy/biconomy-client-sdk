import { TestData } from "../../../tests";
import { createSmartAccountClient, ERROR_MESSAGES, FeeQuotesOrDataResponse, IHybridPaymaster, PaymasterMode } from "../src/index";
import { Hex, encodeFunctionData, getContract, parseAbi } from "viem";
import { UserOperationStruct } from "@alchemy/aa-core";
import { checkBalance, entryPointABI } from "../../../tests/utils";
import { ERC20_ABI } from "@biconomy/modules";

describe("Account Tests", () => {
  let mumbai: TestData;
  let baseSepolia: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [mumbai, baseSepolia] = testDataPerChain;
  });

  it("should have addresses", async () => {
    const {
      whale: { viemWallet: signer, publicAddress: sender },
      minnow: { viemWallet: recipientSigner, publicAddress: recipient },
      bundlerUrl,
    } = mumbai;

    const {
      whale: { viemWallet: signerBase, publicAddress: senderBase },
      minnow: { viemWallet: recipientSignerBase, publicAddress: recipientBase },
      bundlerUrl: bundlerUrlBase,
    } = baseSepolia;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });

    const reciepientSmartAccount = await createSmartAccountClient({
      signer: recipientSigner,
      bundlerUrl,
    });

    const smartAccountBase = await createSmartAccountClient({
      signer: signerBase,
      bundlerUrl: bundlerUrlBase,
    });

    const reciepientSmartAccountBase = await createSmartAccountClient({
      signer: recipientSignerBase,
      bundlerUrl,
    });

    const addresses = await Promise.all([
      sender,
      smartAccount.getAddress(),
      recipient,
      reciepientSmartAccount.getAddress(),
      senderBase,
      smartAccountBase.getAddress(),
      recipientBase,
      reciepientSmartAccountBase.getAddress(),
    ]);
    expect(addresses.every(Boolean)).toBeTruthy();
  });

  it("should send some native token to a recipient", async () => {
    const {
      whale: { viemWallet: signer },
      minnow: { publicAddress: recipient },
      bundlerUrl,
      publicClient,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });

    const balance = (await checkBalance(publicClient, recipient)) as bigint;
    const { wait } = await smartAccount.sendTransaction(
      {
        to: recipient,
        value: 1,
        data: "0x",
      },
      {
        simulationType: "validation_and_execution",
      },
    );

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

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const paymaster = smartAccount.paymaster;
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
      simulationType: "validation",
    });

    const userOpReceipt = await response.wait(3);
    expect(userOpReceipt.userOpHash).toBeTruthy();
    expect(userOpReceipt.success).toBe("true");

    const maticBalanceAfter = await checkBalance(publicClient, await smartAccount.getAddress());

    expect(maticBalanceAfter).toEqual(maticBalanceBefore);

    const newBalance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;

    expect(newBalance - balance).toBe(1n);
  }, 60000);

  it("Should mint an NFT on Mumbai and pay with ERC20 - with preferredToken", async () => {
    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
    const {
      whale: { viemWallet: signer, publicAddress: recipient },
      bundlerUrl,
      publicClient,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
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
    const maticBalanceBefore = await checkBalance(publicClient, await smartAccount.getAddress());
    const usdcBalanceBefore = await checkBalance(publicClient, await smartAccount.getAddress(), "0xda5289fcaaf71d52a80a254da614a192b693e977");

    const { wait } = await smartAccount.sendTransaction([transaction], {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        preferredToken: "0xda5289fcaaf71d52a80a254da614a192b693e977",
      },
    });

    const {
      receipt: { transactionHash },
      userOpHash,
      success,
    } = await wait();

    expect(transactionHash).toBeTruthy();
    expect(userOpHash).toBeTruthy();
    expect(success).toBe("true");

    const maticBalanceAfter = await checkBalance(publicClient, await smartAccount.getAddress());
    expect(maticBalanceAfter).toEqual(maticBalanceBefore);

    const usdcBalanceAfter = await checkBalance(publicClient, await smartAccount.getAddress(), "0xda5289fcaaf71d52a80a254da614a192b693e977");
    expect(usdcBalanceAfter).toBeLessThan(usdcBalanceBefore);

    const newBalance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;
    expect(newBalance - balance).toBe(1n);
  }, 60000);

  it("Should expect several feeQuotes in resonse to empty tokenInfo fields", async () => {
    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
    const {
      whale: { viemWallet: signer, publicAddress: recipient },
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
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

    const feeQuotesResponse = await smartAccount.getTokenFees(transaction, { paymasterServiceData: { mode: PaymasterMode.ERC20 } });
    expect(feeQuotesResponse.feeQuotes?.length).toBeGreaterThan(1);
  });

  it("Should mint an NFT on Mumbai and pay with ERC20 - with token selection and no maxApproval", async () => {
    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
    const preferredToken: Hex = "0xda5289fcaaf71d52a80a254da614a192b693e977";
    const {
      whale: { viemWallet: signer, publicAddress: recipient },
      bundlerUrl,
      biconomyPaymasterApiKey,
      publicClient,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
    });

    const smartAccountAddress = await smartAccount.getAddress();

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address _to)"]),
      functionName: "safeMint",
      args: [recipient],
    });

    const transaction = {
      to: nftAddress, // NFT address
      data: encodedCall,
    };

    const feeQuotesResponse = await smartAccount.getTokenFees(transaction, {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        preferredToken,
      },
    });

    const selectedFeeQuote = feeQuotesResponse.feeQuotes?.[0]!;
    const spender = feeQuotesResponse.tokenPaymasterAddress!;

    const contract = getContract({
      address: preferredToken,
      abi: parseAbi(ERC20_ABI),
      client: publicClient,
    });

    const allowanceBefore = (await contract.read.allowance([smartAccountAddress, spender])) as bigint;

    if (allowanceBefore > 0) {
      const setAllowanceToZeroTransaction = await (smartAccount?.paymaster as IHybridPaymaster<any>)?.buildTokenApprovalTransaction({
        feeQuote: { ...selectedFeeQuote, maxGasFee: 0 },
        spender,
      });

      const { wait } = await smartAccount.sendTransaction([setAllowanceToZeroTransaction]);
      const { success } = await wait();

      expect(success).toBe("true");
      const allowanceAfter = (await contract.read.allowance([smartAccountAddress, spender])) as bigint;
      expect(allowanceAfter).toBe(0n);
    }

    const balance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;
    const maticBalanceBefore = await checkBalance(publicClient, smartAccountAddress);
    const usdcBalanceBefore = await checkBalance(publicClient, smartAccountAddress, preferredToken);

    const { wait } = await smartAccount.sendTransaction(transaction, {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        feeQuote: selectedFeeQuote,
        spender: feeQuotesResponse.tokenPaymasterAddress,
      },
    });

    const {
      receipt: { transactionHash },
      userOpHash,
      success,
    } = await wait();

    expect(userOpHash).toBeTruthy();
    expect(success).toBe("true");
    expect(transactionHash).toBeTruthy();

    const maticBalanceAfter = await checkBalance(publicClient, smartAccountAddress);
    expect(maticBalanceAfter).toEqual(maticBalanceBefore);

    const usdcBalanceAfter = await checkBalance(publicClient, smartAccountAddress, preferredToken);
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

    const smartAccount = await createSmartAccountClient({
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

    const feeQuotesResponse: FeeQuotesOrDataResponse = await smartAccount.getTokenFees(transaction, {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        preferredToken: "0xda5289fcaaf71d52a80a254da614a192b693e977",
      },
    });

    expect(async () =>
      smartAccount.sendTransaction(transaction, {
        paymasterServiceData: {
          mode: PaymasterMode.ERC20,
          feeQuote: feeQuotesResponse.feeQuotes?.[0],
        },
        simulationType: "validation",
      }),
    ).rejects.toThrow(ERROR_MESSAGES.SPENDER_REQUIRED);
  }, 60000);

  it("#getUserOpHash should match entryPoint.getUserOpHash", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      entryPointAddress,
      publicClient,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
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

    const hash = await smartAccount.getUserOpHash(userOp);
    expect(hash).toBe(epHash);
  }, 30000);

  it("should be deployed to counterfactual address", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      publicClient,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const accountAddress = await smartAccount.getAccountAddress();
    const byteCode = await publicClient.getBytecode({ address: accountAddress as Hex });

    expect(byteCode?.length).toBeGreaterThan(2);
  }, 10000); // on github runner it takes more time than 5000ms

  it("should check if ecdsaOwnershipModule is enabled", async () => {
    const ecdsaOwnershipModule = "0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e";

    const {
      whale: { viemWallet: signer },
      bundlerUrl,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });

    expect(ecdsaOwnershipModule).toBe(smartAccount.activeValidationModule.getAddress());
  });

  it("should check a very long hex", async () => {
    const {
      whale: { viemWallet: signer },
      minnow: { publicAddress: recipient },
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
    });

    const { wait } = await smartAccount.sendTransaction(
      {
        to: recipient,
        data: "0x83f319170000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000008c089ce941ffab1ae94b6fcb4446f11411dbd230d918ccc4b3949dd1b275287b172000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c2132d05d31c914a87c6611c10748aeb04b58e8f00000000000000000000000020b59ee457f3013cc2e556993f961803aabd682100000000000000000000000000000000000000000000000000000000000f34d70000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006616d61726f6b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000086c6966692d6170690000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000039e3e49c99834c9573c9fc7ff5a4b226cd7b0e630000000000000000000000006d310348d5c12009854dfcf72e0df9027e8cb4f40000000000000000000000002791bca1f2de4661ed88a30c99a7a9449aa84174000000000000000000000000c2132d05d31c914a87c6611c10748aeb04b58e8f00000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000544301a37200000000000000000000000002791bca1f2de4661ed88a30c99a7a9449aa84174000000000000000000000000c2132d05d31c914a87c6611c10748aeb04b58e8f00000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000f34d7000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002600000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004e00000000000000000000000000000000000000000000000000000000065d3696600000000000000000000000000000000000000000000000000000000000000030000000000000000000000006c30be15d88462b788dea7c6a860a2ccaf7b2670000000000000000000000000e373df144a70bccc10190f97bede647d1ed6cfc80000000000000000000000003037e79fce8817a6f21196d8d93c80f53abb926700000000000000000000000000000000000000000000000000000000000000030000000000000000000000001093ced81987bf532c2b7907b2a8525cd0c172950000000000000000000000008929d3fea77398f64448c85015633c2d6472fb29000000000000000000000000445fe580ef8d70ff569ab36e80c647af338db35100000000000000000000000000000000000000000000000000000000000000040000000000000000000000001093ced81987bf532c2b7907b2a8525cd0c172950000000000000000000000008929d3fea77398f64448c85015633c2d6472fb290000000000000000000000003037e79fce8817a6f21196d8d93c80f53abb926700000000000000000000000039e3e49c99834c9573c9fc7ff5a4b226cd7b0e630000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008f3cf7ad23cd3cadbd9735aff958023239c6a063000000000000000000000000c2132d05d31c914a87c6611c10748aeb04b58e8f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000020b59ee457f3013cc2e556993f961803aabd68210000000000000000000000000000000000000000000000000007a7a9f9f91645000000000000000000000000000000000000000000000000000000000000003200000000000000000000000020b59ee457f3013cc2e556993f961803aabd68210000000000000000000000000000000000000000000000000000000000676e6f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        paymasterServiceData: {
          mode: PaymasterMode.SPONSORED,
        },
      },
    );

    const {
      receipt: { transactionHash },
      userOpHash,
      success,
    } = await wait();

    expect(userOpHash).toBeTruthy();
    expect(success).toBe("true");
    expect(transactionHash).toBeTruthy();
  }, 60000);
});
