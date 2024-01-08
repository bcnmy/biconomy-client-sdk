import { Paymaster, createSmartWalletClient } from "../src";
import { TestData } from ".";

describe("Account Tests", () => {
  let chainData: TestData;

  beforeEach(() => {
    // @ts-ignore
    chainData = testDataPerChain[0];
  });

  it("should create a smartWalletClient from a walletClient", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      signer,
      bundlerUrl,
    });
    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();
  });

  it("should create a smartWalletClient from a signer and chainId", async () => {
    const {
      chainId,
      whale: { alchemyWalletClientSigner: signer },
      bundlerUrl,
    } = chainData;

    const smartWallet = await createSmartWalletClient({
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
    } = chainData;

    const smartWallet = await createSmartWalletClient({
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
    } = chainData;

    const smartWallet = await createSmartWalletClient({
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
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      signer,
      bundlerUrl,
    });

    const module = smartWallet.activeValidationModule;
    expect(module).toBeTruthy();
  });

  it("Sender should be non zero", async () => {
    const {
      whale: { viemWallet: signer },
      minnow: { publicAddress: recipient },
      bundlerUrl,
    } = chainData;

    const smartWallet = await createSmartWalletClient({
      signer,
      bundlerUrl,
    });

    const builtUserOp = await smartWallet.buildUserOp([{ to: recipient, value: 1000, data: "0x" }]);
    expect(builtUserOp.sender).not.toBe("0x0000000000000000000000000000000000000000");
  }, 30000);

  it("Create a smart account with paymaster by creating instance", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = chainData;

    const paymasterUrl = "https://paymaster.biconomy.io/api/v1/80001/" + biconomyPaymasterApiKey;
    const paymaster = new Paymaster({ paymasterUrl });

    const smartWallet = await createSmartWalletClient({
      signer,
      bundlerUrl,
      paymaster,
    });
    expect(smartWallet.paymaster).not.toBeNull();
    expect(smartWallet.paymaster).not.toBeUndefined();
  }, 10000);
});
