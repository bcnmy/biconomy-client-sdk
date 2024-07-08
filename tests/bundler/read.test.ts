import { http, type Chain, type Hex, createWalletClient } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { beforeAll, describe, expect, test } from "vitest";
import {
  type BiconomySmartAccountV2,
  type BiconomySmartAccountV2Config,
  compareChainIds,
  createSmartAccountClient,
  getCustomChain,
} from "../../src/account";
import { createBundler } from "../../src/bundler";
import { getBundlerUrl, getConfig } from "../utils";

describe("Bundler:Read", () => {
  const {
    chain,
    chainId,
    privateKey,
    privateKeyTwo,
    bundlerUrl,
    paymasterUrl,
  } = getConfig();
  const account = privateKeyToAccount(`0x${privateKey}`);
  const accountTwo = privateKeyToAccount(`0x${privateKeyTwo}`);
  const recipient = accountTwo.address;

  let [smartAccount, smartAccountTwo]: BiconomySmartAccountV2[] = [];
  let [smartAccountAddress, smartAccountAddressTwo]: Hex[] = [];

  const [walletClient, walletClientTwo] = [
    createWalletClient({
      account,
      chain,
      transport: http(),
    }),
    createWalletClient({
      account: accountTwo,
      chain,
      transport: http(),
    }),
  ];

  beforeAll(async () => {
    [smartAccount, smartAccountTwo] = await Promise.all(
      [walletClient, walletClientTwo].map((client) =>
        createSmartAccountClient({
          chainId,
          signer: client,
          bundlerUrl,
          paymasterUrl,
        }),
      ),
    );
    [smartAccountAddress, smartAccountAddressTwo] = await Promise.all(
      [smartAccount, smartAccountTwo].map((account) =>
        account.getAccountAddress(),
      ),
    );
  });

  test.concurrent(
    "should throw and give advice",
    async () => {
      const randomPrivateKey = generatePrivateKey();
      const unfundedAccount = privateKeyToAccount(randomPrivateKey);

      const unfundedSmartAccountClient = await createSmartAccountClient({
        signer: createWalletClient({
          account: unfundedAccount,
          chain,
          transport: http(),
        }),
        paymasterUrl,
        bundlerUrl,
      });

      await expect(
        unfundedSmartAccountClient.sendTransaction({
          to: recipient,
          value: 1,
        }),
      ).rejects.toThrow("Send some native tokens in your smart wallet");
    },
    20000,
  );

  test.concurrent(
    "should parse the rpcUrl when a custom chain and bundler are used",
    async () => {
      const customBlastChain = {
        id: 81_457,
        name: "Blast",
        //   network: "blast",
        nativeCurrency: {
          decimals: 18,
          name: "Ethereum",
          symbol: "ETH",
        },
        rpcUrls: {
          public: { http: ["https://rpc.blast.io"] },
          default: { http: ["https://rpc.blast.io"] },
        },
        blockExplorers: {
          etherscan: { name: "Blastscan", url: "https://blastscan.io/" },
          default: { name: "Blastscan", url: "https://blastscan.io/" },
        },
        contracts: {
          multicall3: {
            address: "0xca11bde05977b3631167028862be2a173976ca11",
            blockCreated: 88_189,
          },
        },
      } as const satisfies Chain;

      const accountOne = privateKeyToAccount(`0x${privateKey}`);

      const walletClientWithCustomChain = createWalletClient({
        account: accountOne,
        chain: customBlastChain,
        transport: http(),
      });

      const blastBundler = await createBundler({
        bundlerUrl: getBundlerUrl(customBlastChain.id),
        viemChain: customBlastChain,
      });
      const smartAccountFromViemWithCustomChain =
        await createSmartAccountClient({
          viemChain: customBlastChain,
          signer: walletClientWithCustomChain,
          bundler: blastBundler,
          rpcUrl: customBlastChain.rpcUrls.default.http[0],
        });

      expect(
        smartAccountFromViemWithCustomChain.rpcProvider.transport.url,
      ).toBe("https://rpc.blast.io");
      expect(blastBundler.getBundlerUrl()).toBe(
        getBundlerUrl(customBlastChain.id),
      );
    },
  );

  test.concurrent(
    "should throw an error, bundlerUrl chain id and signer chain id does not match",
    async () => {
      const config: BiconomySmartAccountV2Config = {
        signer: walletClient,
        bundlerUrl: getBundlerUrl(1337),
        paymasterUrl,
      };

      await expect(
        compareChainIds(walletClient, config, false),
      ).rejects.toThrow();
    },
  );
  test.concurrent(
    "should throw an error, bundlerUrl chainId and paymasterUrl + chainId does not match",
    async () => {
      const mockPaymasterUrl =
        "https://paymaster.biconomy.io/api/v1/1337/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71";

      const config: BiconomySmartAccountV2Config = {
        signer: walletClient,
        bundlerUrl,
        paymasterUrl: mockPaymasterUrl,
      };

      await expect(
        compareChainIds(walletClient, config, false),
      ).rejects.toThrow();
    },
  );

  test.concurrent(
    "should throw, chain id from signer and bundlerUrl do not match",
    async () => {
      const createAccount = createSmartAccountClient({
        signer: walletClient,
        bundlerUrl:
          "https://bundler.biconomy.io/api/v2/1/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44", // mock
      });

      await expect(createAccount).rejects.toThrow();
    },
  );

  test.concurrent(
    "should throw, chain id from paymasterUrl and bundlerUrl do not match",
    async () => {
      const createAccount = createSmartAccountClient({
        signer: walletClient,
        paymasterUrl:
          "https://paymaster.biconomy.io/api/v1/1/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71",
        bundlerUrl:
          "https://bundler.biconomy.io/api/v2/80002/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44", // mock
      });

      await expect(createAccount).rejects.toThrow();
    },
  );
});
