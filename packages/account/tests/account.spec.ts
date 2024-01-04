import { createSmartWalletClient } from "../src/index";
import { Bundler, Paymaster } from "../src/aliases";
import { TestData } from ".";

describe("Account Tests", () => {
  let chainData: TestData;

  beforeEach(() => {
    // @ts-ignore
    chainData = testDataPerChain[0];
  });

  it("should provide an account address", async () => {
    const {
      entryPointAddress,
      bundlerUrl,
      chainId,
      whale: { signer },
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      chainId,
      entryPointAddress,
      signer,
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
    });
    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();
  });

  it("Nonce should be zero", async () => {
    const {
      entryPointAddress,
      bundlerUrl,
      chainId,
      whale: { signer },
      minnow: { publicAddress: recipient },
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      chainId,
      entryPointAddress,
      signer,
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
    });
    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();

    const builtUserOp = await smartWallet.buildUserOp([{ to: recipient, value: 1, data: "0x" }]);
    console.log("builtUserOp", builtUserOp);
    expect(builtUserOp?.nonce?.toString()).toBe("0x0");
  });

  it("should have an active validation module", async () => {
    const {
      entryPointAddress,
      bundlerUrl,
      chainId,
      whale: { signer },
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      chainId,
      entryPointAddress,
      signer,
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
    });

    const module = smartWallet.activeValidationModule;
    expect(module).toBeTruthy();
  });

  it("Sender should be non zero", async () => {
    const {
      chainId,
      whale: { signer },
      minnow: { publicAddress: recipient },
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

    const builtUserOp = await smartWallet.buildUserOp([{ to: recipient, value: 1000, data: "0x" }]);
    expect(builtUserOp.sender).not.toBe("0x0000000000000000000000000000000000000000");
  }, 30000);

  it("Create a smart account with paymaster by creating instance", async () => {
    const {
      chainId,
      whale: { signer },
      bundlerUrl,
      entryPointAddress,
      biconomyPaymasterApiKey,
    } = chainData;

    const paymasterUrl = "https://paymaster.biconomy.io/api/v1/80001/" + biconomyPaymasterApiKey;
    const paymaster = new Paymaster({ paymasterUrl });

    const smartWallet = await createSmartWalletClient({
      chainId,
      signer,
      bundler: new Bundler({
        bundlerUrl,
        chainId,
        entryPointAddress,
      }),
      paymaster,
    });
    expect(smartWallet.paymaster).not.toBeNull();
    expect(smartWallet.paymaster).not.toBeUndefined();
  }, 10000);
});
