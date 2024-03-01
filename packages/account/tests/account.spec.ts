import { Paymaster, createSmartAccountClient } from "../src";
import { createWalletClient, http } from "viem";
import { localhost } from "viem/chains";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { TestData } from "../../../tests";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";

describe("Account Tests", () => {
  let ganache: TestData;
  const mockBundlerUrl = "https://bundler.biconomy.io/api/v2/1337/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14";

  beforeEach(() => {
    // @ts-ignore: Comes from setup-unit-tests
    [ganache] = testDataPerChain;
  });

  it("should create a smartAccountClient from an ethers signer", async () => {
    const {
      minnow: { ethersSigner: signer },
    } = ganache;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl: mockBundlerUrl,
      rpcUrl: localhost.rpcUrls.default.http[0],
    });
    const address = await smartAccount.getAccountAddress();
    expect(address).toBeTruthy();
  });

  it("should create a whale smartAccountClient from an ethers signer", async () => {
    const {
      bundlerUrl,
      whale: { ethersSigner: signer },
    } = ganache;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl: mockBundlerUrl,
      rpcUrl: localhost.rpcUrls.default.http[0],
    });
    const address = await smartAccount.getAccountAddress();
    expect(address).toBeTruthy();
  });

  it("should create a smartAccountClient from a walletClient", async () => {
    const {
      whale: { viemWallet: signer },
    } = ganache;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl: mockBundlerUrl,
      rpcUrl: localhost.rpcUrls.default.http[0],
    });
    const address = await smartAccount.getAccountAddress();
    expect(address).toBeTruthy();
  });

  it("should pickup the rpcUrl from viem wallet and ethers", async () => {
    const {
      chainId,
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

    const [smartAccountFromEthersWithNewRpc, smartAccountFromViemWithNewRpc, smartAccountFromEthersWithOldRpc, smartAccountFromViemWithOldRpc] =
      await Promise.all([
        createSmartAccountClient({
          chainId,
          signer: ethersSignerWithNewRpcUrl,
          bundlerUrl: mockBundlerUrl,
          rpcUrl: newRpcUrl,
        }),
        createSmartAccountClient({
          chainId,
          signer: walletClientWithNewRpcUrl,
          bundlerUrl: mockBundlerUrl,
          rpcUrl: newRpcUrl,
        }),
        createSmartAccountClient({
          chainId,
          signer: originalEthersSigner,
          bundlerUrl: mockBundlerUrl,
          rpcUrl: viemChain.rpcUrls.default.http[0],
        }),
        createSmartAccountClient({
          chainId,
          signer: originalViemSigner,
          bundlerUrl: mockBundlerUrl,
          rpcUrl: viemChain.rpcUrls.default.http[0],
        }),
      ]);

    const [
      smartAccountFromEthersWithNewRpcAddress,
      smartAccountFromViemWithNewRpcAddress,
      smartAccountFromEthersWithOldRpcAddress,
      smartAccountFromViemWithOldRpcAddress,
    ] = await Promise.all([
      smartAccountFromEthersWithNewRpc.getAccountAddress(),
      smartAccountFromViemWithNewRpc.getAccountAddress(),
      smartAccountFromEthersWithOldRpc.getAccountAddress(),
      smartAccountFromViemWithOldRpc.getAccountAddress(),
    ]);

    expect(
      [
        smartAccountFromEthersWithNewRpcAddress,
        smartAccountFromViemWithNewRpcAddress,
        smartAccountFromEthersWithOldRpcAddress,
        smartAccountFromViemWithOldRpcAddress,
      ].every(Boolean),
    ).toBeTruthy();

    expect(smartAccountFromEthersWithNewRpc.rpcProvider.transport.url).toBe(newRpcUrl);
    expect(smartAccountFromViemWithNewRpc.rpcProvider.transport.url).toBe(newRpcUrl);
    expect(smartAccountFromEthersWithOldRpc.rpcProvider.transport.url).toBe(defaultRpcUrl);
    expect(smartAccountFromViemWithOldRpc.rpcProvider.transport.url).toBe(defaultRpcUrl);
  });

  it("should create a smartAccountClient from a signer and chainId", async () => {
    const {
      chainId,
      whale: { alchemyWalletClientSigner: signer },
    } = ganache;

    const smartAccount = await createSmartAccountClient({
      chainId,
      signer,
      bundlerUrl: mockBundlerUrl,
      rpcUrl: localhost.rpcUrls.default.http[0],
    });
    const address = await smartAccount.getAccountAddress();
    expect(address).toBeTruthy();
  });

  it("should provide an account address", async () => {
    const {
      whale: { viemWallet: signer },
    } = ganache;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl: mockBundlerUrl,
      rpcUrl: localhost.rpcUrls.default.http[0],
    });
    const address = await smartAccount.getAccountAddress();
    expect(address).toBeTruthy();
  });

  it("should have an active validation module", async () => {
    const {
      whale: { viemWallet: signer },
    } = ganache;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl: mockBundlerUrl,
      rpcUrl: localhost.rpcUrls.default.http[0],
    });

    const module = smartAccount.activeValidationModule;
    expect(module).toBeTruthy();
  });

  it("Create a smart account with paymaster by creating instance", async () => {
    const {
      whale: { viemWallet: signer },
      paymasterUrl,
    } = ganache;

    const paymaster = new Paymaster({ paymasterUrl });

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl: mockBundlerUrl,
      paymaster,
      rpcUrl: localhost.rpcUrls.default.http[0],
    });
    expect(smartAccount.paymaster).not.toBeNull();
    expect(smartAccount.paymaster).not.toBeUndefined();
  }, 10000);

  it("should fail to create a smartAccountClient from a walletClient without a chainId", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const viemWalletClientNoChainId = createWalletClient({
      account,
      transport: http(localhost.rpcUrls.default.http[0]),
    });

    expect(
      await expect(
        createSmartAccountClient({
          signer: viemWalletClientNoChainId,
          bundlerUrl: mockBundlerUrl,
          rpcUrl: localhost.rpcUrls.default.http[0],
        }),
      ).rejects.toThrow("Cannot consume a viem wallet without a chainId"),
    );
  });

  it("should fail to create a smartAccountClient from a walletClient without an account", async () => {
    const viemWalletNoAccount = createWalletClient({
      transport: http(localhost.rpcUrls.default.http[0]),
    });

    expect(async () =>
      createSmartAccountClient({
        signer: viemWalletNoAccount,
        bundlerUrl: mockBundlerUrl,
        rpcUrl: localhost.rpcUrls.default.http[0],
      }),
    ).rejects.toThrow("Cannot consume a viem wallet without an account");
  });
});
