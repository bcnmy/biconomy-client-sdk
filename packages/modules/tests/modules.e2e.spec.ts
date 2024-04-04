import { TestData } from "../../../tests";
import { PaymasterMode, createSmartAccountClient } from "@biconomy/account";
import { DEFAULT_BATCHED_SESSION_ROUTER_MODULE, DEFAULT_SESSION_KEY_MANAGER_MODULE } from "../src";

describe("Account Tests", () => {
  let baseSepolia: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-unit-tests
    [baseSepolia] = testDataPerChain;
  });

  it("should enable batched module", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = baseSepolia;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
    });

    const isBRMenabled = await smartAccount.isModuleEnabled(DEFAULT_BATCHED_SESSION_ROUTER_MODULE);

    if (!isBRMenabled) {
      const tx = await smartAccount.getEnableModuleData(DEFAULT_BATCHED_SESSION_ROUTER_MODULE);
      const { wait } = await smartAccount.sendTransaction(tx, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
      });
      const { success } = await wait();
      expect(success).toBe("true");
    }
  }, 50000);

  it("should enable session module", async () => {
    const {
      whale: { viemWallet: signer },
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = baseSepolia;

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey,
    });

    const isSessionKeyEnabled = await smartAccount.isModuleEnabled(DEFAULT_SESSION_KEY_MANAGER_MODULE);

    if (!isSessionKeyEnabled) {
      const tx = await smartAccount.getEnableModuleData(DEFAULT_SESSION_KEY_MANAGER_MODULE);
      const { wait } = await smartAccount.sendTransaction(tx, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
      });
      const { success } = await wait();
      expect(success).toBe("true");
    }
  }, 50000);
});
