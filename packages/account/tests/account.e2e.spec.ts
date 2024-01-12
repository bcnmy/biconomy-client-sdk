import { BiconomyPaymaster, PaymasterMode } from "@biconomy/paymaster";
import { TestData } from ".";
import { BiconomyAccountProvider, BiconomySmartAccountV2, createSmartWalletClient } from "../src/index";
import { Hex, createWalletClient, encodeFunctionData, http, parseAbi } from "viem";
import { UserOperationStruct, WalletClientSigner } from "@alchemy/aa-core";
import { checkBalance, entryPointABI } from "./utils";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseGoerli } from "viem/chains";

describe("Account Tests", () => {
  let chainData: TestData;

  beforeEach(() => {
    // @ts-ignore
    chainData = testDataPerChain[0];
  });

  it("should send some native token to a recipient", async () => {
    const {
      chainId,
      whale: { signer, publicAddress: sender },
      minnow: { publicAddress: recipient },
      bundlerUrl,
      entryPointAddress,
      publicClient,
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      chainId,
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
      chainId,
      whale: { signer },
      bundlerUrl,
      entryPointAddress,
      biconomyPaymasterApiKey,
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      chainId,
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
      chainId,
      whale: { signer, publicAddress: recipient },
      bundlerUrl,
      biconomyPaymasterApiKey,
      publicClient,
    } = chainData;

    const smartWallet = await BiconomySmartAccountV2.create({
      chainId,
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey
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
    const partialUserOp = await smartWallet.buildUserOp([transaction]);

    const paymasterData = await paymaster.getPaymasterAndData(partialUserOp, {
      mode: PaymasterMode.SPONSORED,
    });

    partialUserOp.paymasterAndData = paymasterData.paymasterAndData;
    partialUserOp.callGasLimit = paymasterData.callGasLimit;
    partialUserOp.verificationGasLimit = paymasterData.verificationGasLimit;
    partialUserOp.preVerificationGas = paymasterData.preVerificationGas;

    const result = smartWallet.sendUserOp(partialUserOp)
    console.log(result);
    
    const newBalance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;

    expect(newBalance).toEqual(balance);
  }, 60000);

  it("Should gaslessly mint an NFT on Base Goerli", async () => {

    const {
      whale: { publicAddress: recipient },
    } = chainData;

    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
    const baseWallet = privateKeyToAccount(`0x${process.env.E2E_PRIVATE_KEY_ONE}`);

    const baseClient = createWalletClient({
      account: baseWallet,
      chain: baseGoerli,
      transport: http(baseGoerli.rpcUrls.public.http[0]),
    });

    const baseSigner = new WalletClientSigner(baseClient, "json-rpc");

    const baseAccount = await createSmartWalletClient({
      chainId: 84531,
      signer: baseSigner,
      bundlerUrl: "https://bundler.biconomy.io/api/v2/84531/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
      biconomyPaymasterApiKey: process.env.E2E_BICO_PAYMASTER_KEY_BASE
    });

    expect(process.env.E2E_BICO_PAYMASTER_KEY_BASE).toBeTruthy();

    const paymaster: BiconomyPaymaster = baseAccount.paymaster as BiconomyPaymaster;

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

    const partialUserOp = await baseAccount.buildUserOp([transaction]);

    const paymasterData = await paymaster.getPaymasterAndData(partialUserOp, {
      mode: PaymasterMode.SPONSORED,
    });

    partialUserOp.paymasterAndData = paymasterData.paymasterAndData;
    partialUserOp.callGasLimit = paymasterData.callGasLimit;
    partialUserOp.verificationGasLimit = paymasterData.verificationGasLimit;
    partialUserOp.preVerificationGas = paymasterData.preVerificationGas;

    baseAccount.sendUserOp(partialUserOp);

    expect(partialUserOp).toBeTruthy();
  }, 60000);

  it("#getUserOpHash should match entryPoint.getUserOpHash", async () => {
    const {
      chainId,
      whale: { signer },
      bundlerUrl,
      entryPointAddress,
      publicClient,
      biconomyPaymasterApiKey,
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      chainId,
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
      chainId,
      whale: { signer },
      bundlerUrl,
      publicClient,
      biconomyPaymasterApiKey,
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      chainId,
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
      chainId,
      whale: { signer },
      bundlerUrl,
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      chainId,
      signer,
      bundlerUrl,
    });

    const module = (await smartWallet.getAllModules())[0];
    expect(ecdsaOwnershipModule).toBe(module);
  });
});
