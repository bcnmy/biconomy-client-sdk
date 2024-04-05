import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { TestData } from "../../../tests";
import { createSmartAccountClient } from "../src";
import { createWalletClient, http } from "viem";

describe("Account Tests", () => {
    let baseSepolia: TestData;
    let _: TestData;
  
    beforeEach(() => {
      // @ts-ignore: Comes from setup-e2e-tests
      [_, baseSepolia] = testDataPerChain;
    });

    it("Should throw and give advice", async () => {

      const randomPrivateKey = generatePrivateKey()
      const unfundedAccount = privateKeyToAccount(randomPrivateKey)
    
      const {
        minnow: { publicAddress: recipient },
        bundlerUrl,
        paymasterUrl,
        viemChain
      } = baseSepolia;
  
      const unfundedSmartAccountClient = await createSmartAccountClient({
        signer: createWalletClient({
          account: unfundedAccount,
          chain: viemChain,
          transport: http()
        }),
        paymasterUrl,
        bundlerUrl,
      });

      await expect(
        unfundedSmartAccountClient.sendTransaction({
          to: recipient,
          value: 1,
        })
      ).rejects.toThrow("Send some native tokens in your smart wallet");

    }, 20000);

});  