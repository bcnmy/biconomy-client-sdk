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
      rpcUrl: mumbai.viemChain.rpcUrls.default.http[0],
    });

    const reciepientSmartAccount = await createSmartAccountClient({
      signer: recipientSigner,
      bundlerUrl,
      rpcUrl: mumbai.viemChain.rpcUrls.default.http[0],
    });

    const smartAccountBase = await createSmartAccountClient({
      signer: signerBase,
      bundlerUrl: bundlerUrlBase,
      rpcUrl: baseSepolia.viemChain.rpcUrls.default.http[0],
    });

    const reciepientSmartAccountBase = await createSmartAccountClient({
      signer: recipientSignerBase,
      bundlerUrl,
      rpcUrl: baseSepolia.viemChain.rpcUrls.default.http[0],
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
      rpcUrl: mumbai.viemChain.rpcUrls.default.http[0],
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
      viemChain,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
      rpcUrl: viemChain.rpcUrls.default.http[0],
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
      viemChain,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
      rpcUrl: viemChain.rpcUrls.default.http[0],
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
      viemChain,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
      rpcUrl: viemChain.rpcUrls.default.http[0],
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
      viemChain,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
      rpcUrl: viemChain.rpcUrls.default.http[0],
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
      viemChain,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
      rpcUrl: viemChain.rpcUrls.default.http[0],
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
      viemChain,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
      rpcUrl: viemChain.rpcUrls.default.http[0],
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
      viemChain,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
      rpcUrl: viemChain.rpcUrls.default.http[0],
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
      viemChain,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
      rpcUrl: viemChain.rpcUrls.default.http[0],
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
      viemChain,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      rpcUrl: viemChain.rpcUrls.default.http[0],
    });

    expect(ecdsaOwnershipModule).toBe(smartAccount.activeValidationModule.getAddress());
  });
});
