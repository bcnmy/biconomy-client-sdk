import { BiconomySmartAccountV2Config, ERROR_MESSAGES, createECDSAOwnershipValidationModule } from "../src";
import { TestData } from "../../../tests";
import { compareChainIds, getChain } from "../src/utils";
import { createWalletClient, http } from "viem";
import { bsc } from "viem/chains";

describe("Utils tests", () => {
  let ganache: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-unit-tests
    [ganache] = testDataPerChain;
  });

  it("Should not throw and error, chain ids match", async () => {
    const {
      minnow: { viemWallet: walletClient },
    } = ganache;

    const mockBundlerUrl = "https://bundler.biconomy.io/api/v2/1337/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44";
    const mockPaymasterUrl = "https://paymaster.biconomy.io/api/v1/1337/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71";

    const config: BiconomySmartAccountV2Config = {
      signer: walletClient,
      bundlerUrl: mockBundlerUrl,
      paymasterUrl: mockPaymasterUrl,
    };

    await expect(compareChainIds(walletClient, config, false)).resolves.not.toThrow();
  });

  it("Should throw and error, bundlerUrl chain id and signer chain id does not match", async () => {
    const {
      minnow: { viemWallet: walletClient },
      paymasterUrl,
    } = ganache;

    const mockBundlerUrl = "https://bundler.biconomy.io/api/v2/1/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44";

    const config: BiconomySmartAccountV2Config = {
      signer: walletClient,
      bundlerUrl: mockBundlerUrl,
      paymasterUrl,
    };

    await expect(compareChainIds(walletClient, config, false)).rejects.toThrow();
  });

  it("Should throw and error, bundlerUrl chain id and paymaster url chain id does not match", async () => {
    const {
      bundlerUrl,
      minnow: { viemWallet: walletClient },
    } = ganache;

    const mockPaymasterUrl = "https://paymaster.biconomy.io/api/v1/80001/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71";

    const config: BiconomySmartAccountV2Config = {
      signer: walletClient,
      bundlerUrl,
      paymasterUrl: mockPaymasterUrl,
    };

    await expect(compareChainIds(walletClient, config, false)).rejects.toThrow();
  });

  it("Should throw and error, bundlerUrl chain id and paymaster url chain id does not match", async () => {
    const {
      bundlerUrl,
      minnow: { viemWallet: walletClient },
    } = ganache;

    const mockPaymasterUrl = "https://paymaster.biconomy.io/api/v1/80001/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71";

    const ecdsaModule = await createECDSAOwnershipValidationModule({
      signer: walletClient,
    });

    const config: BiconomySmartAccountV2Config = {
      defaultValidationModule: ecdsaModule,
      activeValidationModule: ecdsaModule,
      bundlerUrl,
      paymasterUrl: mockPaymasterUrl,
    };

    await expect(compareChainIds(walletClient, config, false)).rejects.toThrow();
  });

  it("Should throw and error, signer has chain id (56) and paymasterUrl has chain id (80001)", async () => {
    const { bundlerUrl, whale } = ganache;

    const mockPaymasterUrl = "https://paymaster.biconomy.io/api/v1/80001/-RObQRX9ei.fc6918eb-c582-4417-9d5a-0507b17cfe71";

    const walletClient = createWalletClient({
      account: whale.viemWallet.account,
      chain: bsc,
      transport: http(bsc.rpcUrls.default.http[0]),
    });

    const config: BiconomySmartAccountV2Config = {
      signer: walletClient,
      bundlerUrl,
      paymasterUrl: mockPaymasterUrl,
    };

    await expect(compareChainIds(walletClient, config, false)).rejects.toThrow();
  });

  // test chains
  it("Should return chain object for chain id 1", () => {
    const chainId = 1;
    const chain = getChain(chainId);
    expect(chain.id).toBe(chainId);
  });

  // should have correct fields
  it("Should have correct fields", () => {
    const chainId = 1;
    const chain = getChain(chainId);

    ["blockExplorers", "contracts", "fees", "formatters", "id", "name", "nativeCurrency", "rpcUrls", "serializers"].every((field) => {
      expect(chain).toHaveProperty(field);
    });
  });

  // Should throw an error, chain id not found
  it("Should throw an error, chain id not found", () => {
    const chainId = 0;
    expect(() => getChain(chainId)).toThrow(ERROR_MESSAGES.CHAIN_NOT_FOUND);
  });
});
