import { PaymasterMode } from "@biconomy/paymaster";
import { TestData } from ".";
import { createSmartWalletClient } from "../src/index";
import { Bundler } from "../src/aliases";
import { Hex, encodeFunctionData } from "viem";
import { UserOperationStruct } from "@alchemy/aa-core";
import { checkBalance } from "./utils";

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
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
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
  }, 30000);

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
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
    });

    const paymaster = smartWallet.paymaster;
    expect(paymaster).not.toBeNull();
    expect(paymaster).not.toBeUndefined();
  });

  it("Should gaslessly mint an NFT", async () => {
    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
    const {
      chainId,
      whale: { signer, publicAddress: recipient },
      bundlerUrl,
      entryPointAddress,
      biconomyPaymasterApiKey,
      publicClient,
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      chainId,
      signer,
      biconomyPaymasterApiKey,
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
    });

    const address = await smartWallet.getAccountAddress();

    const encodedCall = encodeFunctionData({
      abi: [
        {
          inputs: [{ name: "address", type: "address" }],
          name: "safeMint",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "safeMint",
      args: [recipient],
    });

    const transaction = {
      to: nftAddress, // NFT address
      data: encodedCall,
      value: 0,
    };
    const balance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;
    const { wait } = await smartWallet.sendTransaction(transaction, {
      paymasterServiceData: {
        mode: PaymasterMode.SPONSORED,
      },
    });

    const result = await wait();
    const newBalance = (await checkBalance(publicClient, recipient, nftAddress)) as bigint;

    expect(newBalance - balance).toBe(1n);
    expect(result?.receipt?.transactionHash).toBeTruthy();
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
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
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
      abi: [
        {
          inputs: [
            {
              components: [
                { internalType: "address", name: "sender", type: "address" },
                { internalType: "uint256", name: "nonce", type: "uint256" },
                { internalType: "bytes", name: "initCode", type: "bytes" },
                { internalType: "bytes", name: "callData", type: "bytes" },
                { internalType: "uint256", name: "callGasLimit", type: "uint256" },
                { internalType: "uint256", name: "verificationGasLimit", type: "uint256" },
                { internalType: "uint256", name: "preVerificationGas", type: "uint256" },
                { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
                { internalType: "uint256", name: "maxPriorityFeePerGas", type: "uint256" },
                { internalType: "bytes", name: "paymasterAndData", type: "bytes" },
                { internalType: "bytes", name: "signature", type: "bytes" },
              ],
              internalType: "struct UserOperation",
              name: "userOp",
              type: "tuple",
            },
          ],
          name: "getUserOpHash",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function",
        },
      ],
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
      entryPointAddress,
      publicClient,
      biconomyPaymasterApiKey,
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      chainId,
      signer,
      biconomyPaymasterApiKey,
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
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
      entryPointAddress,
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      chainId,
      signer,
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
    });

    const module = (await smartWallet.getAllModules())[0];
    expect(ecdsaOwnershipModule).toBe(module);
  });
});
