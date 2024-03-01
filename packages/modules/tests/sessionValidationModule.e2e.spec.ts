import { DEFAULT_SESSION_KEY_MANAGER_MODULE, createSessionKeyManagerModule } from "@biconomy/modules";
import { SessionFileStorage } from "./utils/customSession";
import { WalletClientSigner, createSmartAccountClient } from "../../account/src/index";
import { Hex, encodeAbiParameters, encodeFunctionData, pad, parseAbi, parseEther, parseUnits, slice, toFunctionSelector } from "viem";
import { TestData } from "../../../tests";
import { checkBalance } from "../../../tests/utils";
import { PaymasterMode } from "@biconomy/paymaster";
import { getABISVMSessionKeyData } from "../src/utils/Helper";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

describe("Session Validation Module Tests", () => {
  let mumbai: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [mumbai] = testDataPerChain;
  });

  it("Should send a user op using ABI Session Validation Module", async () => {
    let sessionSigner: WalletClientSigner;
    const {
      whale: {
        account: { address: sessionKeyEOA },
        privateKey: pvKey,
        viemWallet,
      },
      publicClient,
      chainId,
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = mumbai;

    // Create smart account
    let smartAccount = await createSmartAccountClient({
      chainId,
      signer: viemWallet,
      bundlerUrl,
      biconomyPaymasterApiKey,
      index: 1, // Increasing index to not conflict with other test cases and use a new smart account
    });

    const sessionFileStorage: SessionFileStorage = new SessionFileStorage(await smartAccount.getAccountAddress());

    try {
      sessionSigner = await sessionFileStorage.getSignerByKey(sessionKeyEOA);
    } catch (error) {
      sessionSigner = await sessionFileStorage.addSigner({ pbKey: sessionKeyEOA, pvKey });
    }
    expect(sessionSigner).toBeTruthy();

    // Create session module
    const sessionModule = await createSessionKeyManagerModule({
      moduleAddress: DEFAULT_SESSION_KEY_MANAGER_MODULE,
      smartAccountAddress: await smartAccount.getAddress(),
      sessionStorageClient: sessionFileStorage,
    });

    const functionSelector = slice(toFunctionSelector("safeMint(address)"), 0, 4);
    // Set enabled call on session
    const sessionKeyData = await getABISVMSessionKeyData(sessionKeyEOA as Hex, {
      destContract: "0xdd526eba63ef200ed95f0f0fb8993fe3e20a23d0" as Hex, // nft address
      functionSelector: functionSelector,
      valueLimit: parseEther("0"),
      rules: [
        {
          offset: 0, // offset 0 means we are checking first parameter of safeMint (recipient address)
          condition: 0, // 0 = Condition.EQUAL
          referenceValue: pad("0xd3C85Fdd3695Aee3f0A12B3376aCD8DC54020549", { size: 32 }), // recipient address
        },
      ],
    });

    const abiSvmAddress = "0x000006bC2eCdAe38113929293d241Cf252D91861";

    const sessionTxData = await sessionModule.createSessionData([
      {
        validUntil: 0,
        validAfter: 0,
        sessionValidationModule: abiSvmAddress,
        sessionPublicKey: sessionKeyEOA as Hex,
        sessionKeyData: sessionKeyData as Hex,
      },
    ]);

    const setSessionAllowedTrx = {
      to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
      data: sessionTxData.data,
    };

    const txArray: any = [];

    // Check if module is enabled

    const isEnabled = await smartAccount.isModuleEnabled(DEFAULT_SESSION_KEY_MANAGER_MODULE);
    if (!isEnabled) {
      const enableModuleTrx = await smartAccount.getEnableModuleData(DEFAULT_SESSION_KEY_MANAGER_MODULE);
      txArray.push(enableModuleTrx);
      txArray.push(setSessionAllowedTrx);
    } else {
      console.log("MODULE ALREADY ENABLED");
      txArray.push(setSessionAllowedTrx);
    }

    const userOpResponse1 = await smartAccount.sendTransaction(txArray);
    const transactionDetails = await userOpResponse1.wait();
    console.log("Tx Hash: ", transactionDetails.receipt.transactionHash);

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address _to)"]),
      functionName: "safeMint",
      args: ["0xd3C85Fdd3695Aee3f0A12B3376aCD8DC54020549"],
    });

    const nftMintTx = {
      to: "0xdd526eba63ef200ed95f0f0fb8993fe3e20a23d0",
      data: encodedCall,
    };

    smartAccount = smartAccount.setActiveValidationModule(sessionModule);

    const maticBalanceBefore = await checkBalance(publicClient, await smartAccount.getAccountAddress());

    const userOpResponse2 = await smartAccount.sendTransaction(nftMintTx, {
      params: {
        sessionSigner: sessionSigner,
        sessionValidationModule: abiSvmAddress,
      },
      paymasterServiceData: {
        mode: PaymasterMode.SPONSORED,
      },
    });

    expect(userOpResponse2.userOpHash).toBeTruthy();
    expect(userOpResponse2.userOpHash).not.toBeNull();

    const maticBalanceAfter = await checkBalance(publicClient, await smartAccount.getAccountAddress());

    expect(maticBalanceAfter).toEqual(maticBalanceBefore);

    console.log(`Tx at: https://jiffyscan.xyz/userOpHash/${userOpResponse2.userOpHash}?network=mumbai`);
  }, 60000);
});
