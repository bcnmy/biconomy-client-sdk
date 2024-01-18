import { TestData } from "../../../tests";
import { getSmartWalletClientSigner, createSmartWalletClient } from "@biconomy/account";
import { createMultiChainValidationModule } from "../src";

describe("Account Tests", () => {
  let ganache: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-unit-tests
    [ganache] = testDataPerChain;
  });

  it("should create a multichainValidationModule from an ethers signer using getSmartWalletClientSigner", async () => {
    const {
      bundlerUrl,
      whale: { ethersSigner },
    } = ganache;

    const signer = await getSmartWalletClientSigner(ethersSigner);
    const multiChainModule = await createMultiChainValidationModule({ ...signer });
    const smartWallet = await createSmartWalletClient({
      ...signer,
      bundlerUrl,
      defaultValidationModule: multiChainModule,
    });
    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();
    // expect the relevant module to be set
    expect(smartWallet.activeValidationModule).toEqual(multiChainModule);
  });

  it("should create a multichainValidationModule from a viem signer using getSmartWalletClientSigner", async () => {
    const {
      bundlerUrl,
      whale: { viemWallet },
    } = ganache;

    const signer = await getSmartWalletClientSigner(viemWallet);
    const multiChainModule = await createMultiChainValidationModule({ ...signer });
    const smartWallet = await createSmartWalletClient({
      ...signer,
      bundlerUrl,
      defaultValidationModule: multiChainModule,
    });
    const address = await smartWallet.getAccountAddress();
    expect(address).toBeTruthy();
    // expect the relevant module to be set
    expect(smartWallet.activeValidationModule).toEqual(multiChainModule);
  });
});
