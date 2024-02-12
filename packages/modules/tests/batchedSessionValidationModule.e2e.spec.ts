import {
  DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  createBatchedSessionRouterModule,
  createSessionKeyManagerModule,
} from "@biconomy/modules";
import { SessionFileStorage } from "./utils/customSession";
import { WalletClientSigner, createSmartAccountClient } from "../../account/src/index";
import { Hex, encodeAbiParameters, encodeFunctionData, parseAbi, parseUnits } from "viem";
import { TestData } from "../../../tests";
import { checkBalance } from "../../../tests/utils";
import { PaymasterMode } from "@biconomy/paymaster";

describe("Account Tests", () => {
  let mumbai: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [mumbai] = testDataPerChain;
  });

  const sessionFileStorage: SessionFileStorage = new SessionFileStorage(DEFAULT_SESSION_KEY_MANAGER_MODULE);

  it("Should send a user op using Batched Session Validation Module", async () => {
    let sessionSigner: WalletClientSigner;

    const {
      whale: {
        account: { address: sessionKeyEOA },
        privateKey: pvKey,
      },
      minnow: { publicAddress: recipient },
      publicClient,
      chainId,
      bundlerUrl,
      biconomyPaymasterApiKey,
    } = mumbai;

    try {
      sessionSigner = await sessionFileStorage.getSignerByKey(sessionKeyEOA);
    } catch (error) {
      sessionSigner = await sessionFileStorage.addSigner({ pbKey: sessionKeyEOA, pvKey });
    }

    expect(sessionSigner).toBeTruthy();

    // Create smart account
    let smartAccount = await createSmartAccountClient({
      chainId,
      signer: sessionSigner,
      bundlerUrl,
      biconomyPaymasterApiKey,
      index: 1, // Increasing index to not conflict with other test cases and use a new smart account
    });

    // Create session module
    const sessionModule = await createSessionKeyManagerModule({
      moduleAddress: DEFAULT_SESSION_KEY_MANAGER_MODULE,
      smartAccountAddress: await smartAccount.getAddress(),
      sessionStorageClient: sessionFileStorage,
    });

    // Create batched session module
    const batchedSessionModule = await createBatchedSessionRouterModule({
      moduleAddress: DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
      smartAccountAddress: await smartAccount.getAddress(),
      sessionKeyManagerModule: sessionModule,
    });

    // Set enabled call on session
    const sessionKeyData1 = encodeAbiParameters(
      [{ type: "address" }, { type: "address" }, { type: "address" }, { type: "uint256" }],
      [
        sessionKeyEOA,
        "0xdA5289fCAAF71d52a80A254da614a192b693e977", // erc20 token address
        recipient, // receiver address
        parseUnits("10", 6),
      ],
    );

    // Set enabled call on session
    const sessionKeyData2 = encodeAbiParameters(
      [{ type: "address" }, { type: "address" }, { type: "address" }, { type: "uint256" }],
      [
        sessionKeyEOA,
        "0xdA5289fCAAF71d52a80A254da614a192b693e977", // erc20 token address
        recipient, // receiver address
        parseUnits("10", 6),
      ],
    );

    const erc20ModuleAddr = "0x000000D50C68705bd6897B2d17c7de32FB519fDA";
    const mockSessionModuleAddr = "0x7Ba4a7338D7A90dfA465cF975Cc6691812C3772E";

    const sessionTxData = await batchedSessionModule.createSessionData([
      {
        validUntil: 0,
        validAfter: 0,
        sessionValidationModule: erc20ModuleAddr,
        sessionPublicKey: sessionKeyEOA,
        sessionKeyData: sessionKeyData1,
      },
      {
        validUntil: 0,
        validAfter: 0,
        sessionValidationModule: mockSessionModuleAddr,
        sessionPublicKey: sessionKeyEOA,
        sessionKeyData: sessionKeyData2,
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

    const isBRMenabled = await smartAccount.isModuleEnabled(DEFAULT_BATCHED_SESSION_ROUTER_MODULE);
    if (!isBRMenabled) {
      // -----> enableModule batched session router module
      const tx2 = await smartAccount.getEnableModuleData(DEFAULT_BATCHED_SESSION_ROUTER_MODULE);
      txArray.push(tx2);
    }

    const userOp = await smartAccount.buildUserOp(txArray);

    const userOpResponse1 = await smartAccount.sendUserOp(userOp);
    const transactionDetails = await userOpResponse1.wait();
    console.log("Tx Hash: ", transactionDetails.receipt.transactionHash);

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function transfer(address _to, uint256 _value)"]),
      functionName: "transfer",
      args: [recipient, parseUnits("0.01", 6)],
    });

    const transferTx = {
      to: "0xdA5289fCAAF71d52a80A254da614a192b693e977", //erc20 token address
      data: encodedCall,
    };

    const maticBalanceBefore = await checkBalance(publicClient, await smartAccount.getAccountAddress());

    smartAccount = smartAccount.setActiveValidationModule(batchedSessionModule);

    const dummyTx = {
      to: "0xdA5289fCAAF71d52a80A254da614a192b693e977",
      data: "0x",
    };

    console.log(sessionSigner, "SESSION SIGNER!");

    const userOpResponse2 = await smartAccount.sendTransaction([transferTx, dummyTx], {
      params: {
        batchSessionParams: [
          {
            sessionSigner: sessionSigner,
            sessionValidationModule: erc20ModuleAddr,
          },
          {
            sessionSigner: sessionSigner,
            sessionValidationModule: mockSessionModuleAddr,
          },
        ],
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
