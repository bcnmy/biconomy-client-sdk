import { TestData } from "../../../tests";
import { createSmartAccountClient, ERROR_MESSAGES, FeeQuotesOrDataResponse, IHybridPaymaster, NATIVE_TOKEN_ALIAS, PaymasterMode } from "../src/index";
import { Hex, createWalletClient, encodeFunctionData, getContract, http, parseAbi } from "viem";
import { UserOperationStruct } from "@alchemy/aa-core";
import { checkBalance, entryPointABI } from "../../../tests/utils";
import { ERC20_ABI } from "@biconomy/modules";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

describe("Account Tests", () => {
  let mumbai: TestData;
  let baseSepolia: TestData;
  let optimism: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [mumbai, baseSepolia, optimism] = testDataPerChain;
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

    const {
      whale: { viemWallet: signerOp, publicAddress: senderOp },
      minnow: { viemWallet: recipientSignerOp, publicAddress: recipientOp },
      bundlerUrl: bundlerUrlOp,
    } = optimism;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });

    const recipientSmartAccount = await createSmartAccountClient({
      signer: recipientSigner,
      bundlerUrl,
    });

    const smartAccountBase = await createSmartAccountClient({
      signer: signerBase,
      bundlerUrl: bundlerUrlBase,
    });

    const recipientSmartAccountBase = await createSmartAccountClient({
      signer: recipientSignerBase,
      bundlerUrl: bundlerUrlBase,
    });

    const smartAccountOp = await createSmartAccountClient({
      signer: signerOp,
      bundlerUrl: bundlerUrlOp,
    });

    const reciepientSmartAccountOp = await createSmartAccountClient({
      signer: recipientSignerOp,
      bundlerUrl: bundlerUrlOp,
    });

    const addresses = await Promise.all([
      sender,
      smartAccount.getAddress(),
      recipient,
      recipientSmartAccount.getAddress(),
      senderBase,
      smartAccountBase.getAddress(),
      recipientBase,
      recipientSmartAccountBase.getAddress(),
      senderOp,
      smartAccountOp.getAddress(),
      recipientOp,
      reciepientSmartAccountOp.getAddress(),
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
    const {
      whale: { viemWallet: signer, publicAddress: recipient },
      bundlerUrl,
      biconomyPaymasterApiKey,
      publicClient,
      nftAddress,
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
    const {
      whale: { viemWallet: signer, publicAddress: recipient },
      bundlerUrl,
      publicClient,
      biconomyPaymasterApiKey,
      nftAddress,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
    });

    const accountAddress = await smartAccount.getAddress();

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
    const maticBalanceBefore = await checkBalance(publicClient, accountAddress);
    const usdcBalanceBefore = await checkBalance(publicClient, accountAddress, "0xda5289fcaaf71d52a80a254da614a192b693e977");

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
    const {
      whale: { viemWallet: signer, publicAddress: recipient },
      bundlerUrl,
      biconomyPaymasterApiKey,
      nftAddress,
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
    const preferredToken: Hex = "0xda5289fcaaf71d52a80a254da614a192b693e977";
    const {
      whale: { viemWallet: signer, publicAddress: recipient },
      bundlerUrl,
      biconomyPaymasterApiKey,
      publicClient,
      nftAddress,
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

    const selectedFeeQuote = feeQuotesResponse.feeQuotes?.[0];
    const spender = feeQuotesResponse.tokenPaymasterAddress!;

    const contract = getContract({
      address: preferredToken,
      abi: parseAbi(ERC20_ABI),
      client: publicClient,
    });

    const allowanceBefore = (await contract.read.allowance([smartAccountAddress, spender])) as bigint;

    if (allowanceBefore > 0) {
      const decreaseAllowanceData = encodeFunctionData({
        abi: parseAbi(["function decreaseAllowance(address spender, uint256 subtractedValue)"]),
        functionName: "decreaseAllowance",
        args: [spender, allowanceBefore],
      });

      const decreaseAllowanceTx = {
        to: "0xda5289fcaaf71d52a80a254da614a192b693e977",
        data: decreaseAllowanceData,
      };

      const { wait } = await smartAccount.sendTransaction(decreaseAllowanceTx, { paymasterServiceData: { mode: PaymasterMode.SPONSORED } });
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
    const {
      whale: { viemWallet: signer, publicAddress: recipient },
      bundlerUrl,
      biconomyPaymasterApiKey,
      nftAddress,
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

  it("should deploy a smart account with native token balance", async () => {
    const {
      bundlerUrl,
      biconomyPaymasterApiKey,
      viemChain,
      publicClient,
      whale: { viemWallet: signer, account },
      deploymentCost,
    } = mumbai;

    const newPrivateKey = generatePrivateKey();
    const newAccount = privateKeyToAccount(newPrivateKey);

    const newViemWallet = createWalletClient({
      account: newAccount,
      chain: viemChain,
      transport: http(viemChain.rpcUrls.default.http[0]),
    });

    const smartAccount = await createSmartAccountClient({
      signer: newViemWallet,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const smartAccountAddress = await smartAccount.getAccountAddress();

    // Setup:
    const hash = await signer.sendTransaction({ to: smartAccountAddress, value: BigInt(deploymentCost), account, chain: viemChain }); // Send enough native token to counterfactual address to deploy the smart account
    const transaction = await publicClient.waitForTransactionReceipt({ hash });
    expect(transaction).toBeTruthy();

    // Test:
    const { wait } = await smartAccount.deploy();
    const { success } = await wait();

    const byteCode = await publicClient.getBytecode({ address: smartAccountAddress });
    expect(success).toBe("true");
    expect(byteCode).toBeTruthy();
  }, 60000);

  it("should deploy a smart account with sponsorship", async () => {
    const { bundlerUrl, biconomyPaymasterApiKey, viemChain, publicClient } = mumbai;

    const newPrivateKey = generatePrivateKey();
    const newAccount = privateKeyToAccount(newPrivateKey);

    const newViemWallet = createWalletClient({
      account: newAccount,
      chain: viemChain,
      transport: http(viemChain.rpcUrls.default.http[0]),
    });

    const smartAccount = await createSmartAccountClient({
      signer: newViemWallet,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const smartAccountAddress = await smartAccount.getAccountAddress();
    const balance = await publicClient.getBalance({ address: smartAccountAddress });
    expect(balance).toBe(0n);

    const { wait } = await smartAccount.deploy({
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });
    const { success } = await wait();

    const byteCode = await publicClient.getBytecode({ address: smartAccountAddress });
    expect(success).toBe("true");
    expect(byteCode).toBeTruthy();
  }, 60000);

  it("should fail to deploy a smart account if no native token balance or paymaster", async () => {
    const { bundlerUrl, biconomyPaymasterApiKey, viemChain } = mumbai;

    const newPrivateKey = generatePrivateKey();
    const newAccount = privateKeyToAccount(newPrivateKey);

    const newViemWallet = createWalletClient({
      account: newAccount,
      chain: viemChain,
      transport: http(viemChain.rpcUrls.default.http[0]),
    });

    const smartAccount = await createSmartAccountClient({
      signer: newViemWallet,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    expect(async () => smartAccount.deploy()).rejects.toThrow(ERROR_MESSAGES.NO_NATIVE_TOKEN_BALANCE_DURING_DEPLOY);
  });

  it("should get supported tokens from the paymaster", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      bundlerUrl,
      signer,
      biconomyPaymasterApiKey,
    });

    const tokens = await smartAccount.getSupportedTokens();

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0]).toHaveProperty("tokenAddress");
    expect(tokens[0]).toHaveProperty("symbol");
    expect(tokens[0]).toHaveProperty("decimal");
    expect(tokens[0]).toHaveProperty("premiumPercentage");
    expect(tokens[0]).toHaveProperty("logoUrl");
  });

  it("should fetch balances for smartAccount", async () => {
    const usdt = "0xda5289fcaaf71d52a80a254da614a192b693e977";
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

    const usdcBalanceBefore = await checkBalance(publicClient, await smartAccount.getAddress(), usdt);
    const [usdtBalanceFromSmartAccount] = await smartAccount.getBalances([usdt]);

    expect(usdcBalanceBefore).toBe(usdtBalanceFromSmartAccount.amount);
  });

  it("should check native token balance for smartAccount", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      biconomyPaymasterApiKey,
      chainId,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const [ethBalanceFromSmartAccount] = await smartAccount.getBalances();

    expect(ethBalanceFromSmartAccount.amount).toBeGreaterThan(0n);
    expect(ethBalanceFromSmartAccount.address).toBe(NATIVE_TOKEN_ALIAS);
    expect(ethBalanceFromSmartAccount.chainId).toBe(chainId);
    expect(ethBalanceFromSmartAccount.decimals).toBe(18);
  }, 60000);

  it("should fail to deploy a smart account if already deployed", async () => {
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

    expect(async () => smartAccount.deploy()).rejects.toThrow(ERROR_MESSAGES.ACCOUNT_ALREADY_DEPLOYED);
  }, 60000);

  it("should fetch balances for smartAccount", async () => {
    const usdt = "0xda5289fcaaf71d52a80a254da614a192b693e977";
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      biconomyPaymasterApiKey,
      chainId,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const [usdtBalanceFromSmartAccount, ethBalanceFromSmartAccount] = await smartAccount.getBalances([usdt]); // last result is always eth balance

    expect(usdtBalanceFromSmartAccount.amount).toBeGreaterThan(0n);
    expect(ethBalanceFromSmartAccount.amount).toBeGreaterThan(0n);
    expect(usdtBalanceFromSmartAccount.address).toBe(usdt);
    expect(ethBalanceFromSmartAccount.address).toBe(NATIVE_TOKEN_ALIAS);
    expect(usdtBalanceFromSmartAccount.chainId).toBe(chainId);
    expect(ethBalanceFromSmartAccount.chainId).toBe(chainId);
    expect(usdtBalanceFromSmartAccount.decimals).toBe(6);
    expect(ethBalanceFromSmartAccount.decimals).toBe(18);
    expect(usdtBalanceFromSmartAccount.formattedAmount).toBeTruthy();
    expect(ethBalanceFromSmartAccount.formattedAmount).toBeTruthy();
  });

  it("should withdraw erc20 balances", async () => {
    const usdt = "0xda5289fcaaf71d52a80a254da614a192b693e977";
    const {
      whale: { viemWallet: signer, publicAddress: smartAccountOwner, account },
      bundlerUrl,
      publicClient,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const smartAccountAddress = await smartAccount.getAddress();
    const usdtBalanceOfSABefore = await checkBalance(publicClient, smartAccountAddress, usdt);
    const usdtBalanceOfRecipientBefore = await checkBalance(publicClient, smartAccountOwner, usdt);

    const { wait } = await smartAccount.withdraw([{ address: usdt, amount: BigInt(1), recipient: smartAccountOwner }]);

    const {
      receipt: { transactionHash },
      userOpHash,
      success,
    } = await wait();

    expect(userOpHash).toBeTruthy();
    expect(success).toBe("true");
    expect(transactionHash).toBeTruthy();

    const usdtBalanceOfSAAfter = (await checkBalance(publicClient, smartAccountAddress, usdt)) as bigint;
    const usdtBalanceOfRecipientAfter = (await checkBalance(publicClient, smartAccountOwner, usdt)) as bigint;

    expect(usdtBalanceOfSAAfter - usdtBalanceOfSABefore).toBe(-1n);
    expect(usdtBalanceOfRecipientAfter - usdtBalanceOfRecipientBefore).toBe(1n);
  }, 15000);

  it("should gaslessly withdraw nativeToken", async () => {
    const {
      whale: { viemWallet: signer, publicAddress: smartAccountOwner },
      bundlerUrl,
      publicClient,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const smartAccountAddress = await smartAccount.getAddress();
    const balanceOfSABefore = (await checkBalance(publicClient, smartAccountAddress)) as bigint;
    const balanceOfRecipientBefore = (await checkBalance(publicClient, smartAccountOwner)) as bigint;

    const { wait } = await smartAccount.withdraw([{ address: NATIVE_TOKEN_ALIAS, amount: BigInt(1), recipient: smartAccountAddress }], null, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const {
      receipt: { transactionHash },
      userOpHash,
      success,
    } = await wait();

    expect(userOpHash).toBeTruthy();
    expect(success).toBe("true");
    expect(transactionHash).toBeTruthy();

    const balanceOfSAAfter = (await checkBalance(publicClient, smartAccountAddress)) as bigint;
    const balanceOfRecipientAfter = (await checkBalance(publicClient, smartAccountOwner)) as bigint;

    expect(balanceOfSABefore - balanceOfSAAfter).toBe(1n);
    expect(balanceOfRecipientAfter - balanceOfRecipientBefore).toBe(1n);
  }, 12000);

  it("should withdraw nativeToken and an erc20 token", async () => {
    const usdt = "0xda5289fcaaf71d52a80a254da614a192b693e977";

    const {
      whale: { viemWallet: signer, publicAddress: smartAccountOwner },
      bundlerUrl,
      publicClient,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const smartAccountAddress = await smartAccount.getAddress();
    const balanceOfSABefore = (await checkBalance(publicClient, smartAccountAddress)) as bigint;
    const balanceOfRecipientBefore = (await checkBalance(publicClient, smartAccountOwner)) as bigint;
    const usdtBalanceOfSABefore = await checkBalance(publicClient, smartAccountAddress, usdt);
    const usdtBalanceOfRecipientBefore = await checkBalance(publicClient, smartAccountOwner, usdt);

    const { wait } = await smartAccount.withdraw(
      [
        { address: usdt, amount: BigInt(1) },
        { address: NATIVE_TOKEN_ALIAS, amount: BigInt(1) },
      ],
      smartAccountOwner,
      {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
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

    const balanceOfSAAfter = (await checkBalance(publicClient, smartAccountAddress)) as bigint;
    const balanceOfRecipientAfter = (await checkBalance(publicClient, smartAccountOwner)) as bigint;
    const usdtBalanceOfSAAfter = (await checkBalance(publicClient, smartAccountAddress, usdt)) as bigint;
    const usdtBalanceOfRecipientAfter = (await checkBalance(publicClient, smartAccountOwner, usdt)) as bigint;

    expect(balanceOfSABefore - balanceOfSAAfter).toBe(1n);
    expect(balanceOfRecipientAfter - balanceOfRecipientBefore).toBe(1n);
    expect(usdtBalanceOfSAAfter - usdtBalanceOfSABefore).toBe(-1n);
    expect(usdtBalanceOfRecipientAfter - usdtBalanceOfRecipientBefore).toBe(1n);
  }, 60000);

  it("should withdraw all native token", async () => {
    const {
      whale: { viemWallet: signer, publicAddress: smartAccountOwner, account },
      bundlerUrl,
      viemChain,
      publicClient,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const smartAccountAddress = await smartAccount.getAddress();
    const balanceOfSABefore = (await checkBalance(publicClient, smartAccountAddress)) as bigint;
    const balanceOfRecipientBefore = (await checkBalance(publicClient, smartAccountOwner)) as bigint;

    const { wait } = await smartAccount.withdraw([] /* null or undefined or [] */, smartAccountOwner, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED }, // Will leave no dust
    });

    const {
      receipt: { transactionHash },
      userOpHash,
      success,
    } = await wait();

    expect(userOpHash).toBeTruthy();
    expect(success).toBe("true");
    expect(transactionHash).toBeTruthy();

    const balanceOfSAAfter = (await checkBalance(publicClient, smartAccountAddress)) as bigint;
    const balanceOfRecipientAfter = (await checkBalance(publicClient, smartAccountOwner)) as bigint;

    expect(balanceOfSAAfter).toBe(0n);
    expect(balanceOfRecipientAfter).toBe(balanceOfSABefore + balanceOfRecipientBefore);

    // Teardown: send back the native token to the smart account
    const teardownHash = await signer.sendTransaction({ to: smartAccountAddress, value: balanceOfSABefore, account, chain: viemChain });
    expect(teardownHash).toBeTruthy();
  }, 60000);

  it("should error if no recipient exists", async () => {
    const usdt: Hex = "0xda5289fcaaf71d52a80a254da614a192b693e977";

    const {
      whale: { viemWallet: signer, publicAddress: smartAccountOwner },
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    const txs = [
      { address: usdt, amount: BigInt(1), recipient: smartAccountOwner },
      { address: NATIVE_TOKEN_ALIAS, amount: BigInt(1) },
    ];

    expect(async () => smartAccount.withdraw(txs)).rejects.toThrow(ERROR_MESSAGES.NO_RECIPIENT);
  });

  it("should error when withdraw all of native token is attempted without an amount explicitly set", async () => {
    const {
      whale: { viemWallet: signer, publicAddress: smartAccountOwner },
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = mumbai;

    const smartAccount = await createSmartAccountClient({
      signer,
      biconomyPaymasterApiKey,
      bundlerUrl,
    });

    expect(async () => smartAccount.withdraw(null, smartAccountOwner)).rejects.toThrow(ERROR_MESSAGES.NATIVE_TOKEN_WITHDRAWAL_WITHOUT_AMOUNT);
  }, 6000);
});
