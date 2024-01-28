import { Paymaster, createSmartAccountClient } from "../src";
import { createWalletClient, http } from "viem";
import { localhost } from "viem/chains";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { TestData } from "../../../tests";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";

describe("Account Tests", () => {
  let ganache: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-unit-tests
    [ganache] = testDataPerChain;
  });

  it("should create a smartWalletClient from an ethers signer", async () => {
    const {
      bundlerUrl,
      minnow: { ethersSigner: signer },
    } = ganache;

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });
    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();
  });

  it("should create a smartWalletClient from a walletClient", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
    } = ganache;

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });
    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();
  });

  it("should pickup the rpcUrl from viem wallet and ethers", async () => {
    const {
      chainId,
      bundlerUrl,
      viemChain,
      whale: { privateKey, viemWallet: originalViemSigner, ethersSigner: originalEthersSigner },
    } = ganache;

    const newRpcUrl = "http://localhost:8545";
    const defaultRpcUrl = viemChain.rpcUrls.default.http[0]; //http://127.0.0.1:8545"

    const ethersProvider = new JsonRpcProvider(newRpcUrl);
    const ethersSignerWithNewRpcUrl = new Wallet(privateKey, ethersProvider);

    const accountOne = privateKeyToAccount(privateKey);
    const walletClientWithNewRpcUrl = createWalletClient({
      account: accountOne,
      chain: viemChain,
      transport: http(newRpcUrl),
    });

    const [smartWalletFromEthersWithNewRpc, smartWalletFromViemWithNewRpc, smartWalletFromEthersWithOldRpc, smartWalletFromViemWithOldRpc] =
      await Promise.all([
        createSmartAccountClient({
          chainId,
          signer: ethersSignerWithNewRpcUrl,
          bundlerUrl,
        }),
        createSmartAccountClient({
          chainId,
          signer: walletClientWithNewRpcUrl,
          bundlerUrl,
        }),
        createSmartAccountClient({
          chainId,
          signer: originalEthersSigner,
          bundlerUrl,
        }),
        createSmartAccountClient({
          chainId,
          signer: originalViemSigner,
          bundlerUrl,
        }),
      ]);

    const [
      smartWalletFromEthersWithNewRpcAddress,
      smartWalletFromViemWithNewRpcAddress,
      smartWalletFromEthersWithOldRpcAddress,
      smartWalletFromViemWithOldRpcAddress,
    ] = await Promise.all([
      smartWalletFromEthersWithNewRpc.getAccountAddress(),
      smartWalletFromViemWithNewRpc.getAccountAddress(),
      smartWalletFromEthersWithOldRpc.getAccountAddress(),
      smartWalletFromViemWithOldRpc.getAccountAddress(),
    ]);

    expect(
      [
        smartWalletFromEthersWithNewRpcAddress,
        smartWalletFromViemWithNewRpcAddress,
        smartWalletFromEthersWithOldRpcAddress,
        smartWalletFromViemWithOldRpcAddress,
      ].every(Boolean),
    ).toBeTruthy();

    expect(smartWalletFromEthersWithNewRpc.rpcProvider.transport.url).toBe(newRpcUrl);
    expect(smartWalletFromViemWithNewRpc.rpcProvider.transport.url).toBe(newRpcUrl);
    expect(smartWalletFromEthersWithOldRpc.rpcProvider.transport.url).toBe(defaultRpcUrl);
    expect(smartWalletFromViemWithOldRpc.rpcProvider.transport.url).toBe(defaultRpcUrl);
  });

  it("should create a smartWalletClient from a signer and chainId", async () => {
    const {
      chainId,
      whale: { alchemyWalletClientSigner: signer },
      bundlerUrl,
    } = ganache;

    const smartWallet = await createSmartAccountClient({
      chainId,
      signer,
      bundlerUrl,
    });
    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();
  });

  it("should provide an account address", async () => {
    const {
      bundlerUrl,
      whale: { viemWallet: signer },
    } = ganache;

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });
    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();
  });

  it("Nonce should be zero", async () => {
    const {
      entryPointAddress,
      bundlerUrl,
      whale: { viemWallet: signer },
      minnow: { publicAddress: recipient },
    } = ganache;

    const smartWallet = await createSmartAccountClient({
      entryPointAddress,
      signer,
      bundlerUrl,
    });
    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();

    const builtUserOp = await smartWallet.buildUserOp([{ to: recipient, value: 1, data: "0x" }]);
    console.log("builtUserOp", builtUserOp);
    expect(builtUserOp?.nonce?.toString()).toBe("0x0");
  });

  it("should have an active validation module", async () => {
    const {
      bundlerUrl,
      whale: { viemWallet: signer },
    } = ganache;

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
    });

    const module = smartWallet.activeValidationModule;
    expect(module).toBeTruthy();
  });

  it("Create a smart account with paymaster by creating instance", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = ganache;

    const paymasterUrl = "https://paymaster.biconomy.io/api/v1/80001/" + biconomyPaymasterApiKey;
    const paymaster = new Paymaster({ paymasterUrl });

    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl,
      paymaster,
    });
    expect(smartWallet.paymaster).not.toBeNull();
    expect(smartWallet.paymaster).not.toBeUndefined();
  }, 10000);

  it("should fail to create a smartWalletClient from a walletClient without a chainId", async () => {
    const { bundlerUrl } = ganache;

    const account = privateKeyToAccount(generatePrivateKey());
    const viemWalletClientNoChainId = createWalletClient({
      account,
      transport: http(localhost.rpcUrls.default.http[0]),
    });

    expect(
      async () =>
        await createSmartAccountClient({
          signer: viemWalletClientNoChainId,
          bundlerUrl,
        }),
    ).rejects.toThrow("Cannot consume a viem wallet without a chainId");
  });

  it("should fail to create a smartWalletClient from a walletClient without an account", async () => {
    const { bundlerUrl } = ganache;

    const viemWalletNoAccount = createWalletClient({
      transport: http(localhost.rpcUrls.default.http[0]),
    });

    expect(
      async () =>
        await createSmartAccountClient({
          signer: viemWalletNoAccount,
          bundlerUrl,
        }),
    ).rejects.toThrow("Cannot consume a viem wallet without an account");
  });
});
