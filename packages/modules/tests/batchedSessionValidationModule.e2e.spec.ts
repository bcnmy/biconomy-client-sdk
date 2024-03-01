import {
  DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  createBatchedSessionRouterModule,
  createSessionKeyManagerModule,
} from "@biconomy/modules";
import { SessionFileStorage } from "./utils/customSession";
import { WalletClientSigner, createSmartAccountClient } from "../../account/src/index";
import { encodeAbiParameters, encodeFunctionData, parseAbi, parseUnits } from "viem";
import { TestData } from "../../../tests";
import { checkBalance } from "../../../tests/utils";
import { PaymasterMode } from "@biconomy/paymaster";
import { Logger } from "@biconomy/common";

describe("Batched Session Router Tests", () => {
  let mumbai: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [mumbai] = testDataPerChain;
  });

  // TODO(Gabi): Fix Batched Session Router Module tests
  it.skip("Should send a user op using Batched Session Validation Module", async () => {
    let sessionSigner: WalletClientSigner;

    const {
      whale: {
        account: { address: sessionKeyEOA },
        privateKey: pvKey,
        viemWallet,
      },
      minnow: { publicAddress: recipient },
      publicClient,
      bundlerUrl,
      biconomyPaymasterApiKey,
      chainId,
      viemChain,
    } = mumbai;

    // Create smart account
    let smartAccount = await createSmartAccountClient({
      signer: viemWallet,
      bundlerUrl,
      biconomyPaymasterApiKey,
      index: 3, // Increasing index to not conflict with other test cases and use a new smart account
    });

    const smartAccountAddress = await smartAccount.getAddress();

    const sessionFileStorage: SessionFileStorage = new SessionFileStorage(smartAccountAddress);

    try {
      sessionSigner = await sessionFileStorage.getSignerByKey(sessionKeyEOA);
    } catch (error) {
      sessionSigner = await sessionFileStorage.addSigner({ pbKey: sessionKeyEOA, pvKey, chainId: viemChain });
    }

    expect(sessionSigner).toBeTruthy();

    // First we need to check if smart account is deployed
    // if not deployed, send an empty transaction to deploy it
    const isDeployed = await smartAccount.isAccountDeployed();

    if (!isDeployed) {
      const { wait } = await smartAccount.deploy({ paymasterServiceData: { mode: PaymasterMode.SPONSORED } });
      const { success } = await wait();
      expect(success).toBe("true");
    }

    // Create session module
    const sessionModule = await createSessionKeyManagerModule({
      moduleAddress: DEFAULT_SESSION_KEY_MANAGER_MODULE,
      smartAccountAddress,
      sessionStorageClient: sessionFileStorage,
    });

    // Create batched session module
    const batchedSessionModule = await createBatchedSessionRouterModule({
      moduleAddress: DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
      smartAccountAddress,
      sessionKeyManagerModule: sessionModule,
    });

    // Set enabled call on session, only allows calling USDC contract transfer with <= 10 USDC
    const sessionKeyData = encodeAbiParameters(
      [{ type: "address" }, { type: "address" }, { type: "address" }, { type: "uint256" }],
      [
        sessionKeyEOA,
        "0xdA5289fCAAF71d52a80A254da614a192b693e977", // erc20 token address
        recipient, // receiver address
        parseUnits("10", 6),
      ],
    );

    // only requires that the caller is the session key
    // can call anything using the mock session module
    const sessionKeyData2 = encodeAbiParameters([{ type: "address" }], [sessionKeyEOA]);

    const erc20ModuleAddr = "0x000000D50C68705bd6897B2d17c7de32FB519fDA";
    const mockSessionModuleAddr = "0x7Ba4a7338D7A90dfA465cF975Cc6691812C3772E";

    const sessionTxData = await batchedSessionModule.createSessionData([
      {
        validUntil: 0,
        validAfter: 0,
        sessionValidationModule: erc20ModuleAddr,
        sessionPublicKey: sessionKeyEOA,
        sessionKeyData: sessionKeyData,
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

    // Check if session module is enabled
    const isEnabled = await smartAccount.isModuleEnabled(DEFAULT_SESSION_KEY_MANAGER_MODULE);
    if (!isEnabled) {
      const enableModuleTrx = await smartAccount.getEnableModuleData(DEFAULT_SESSION_KEY_MANAGER_MODULE);
      txArray.push(enableModuleTrx);
    }

    // Check if batched session module is enabled
    const isBRMenabled = await smartAccount.isModuleEnabled(DEFAULT_BATCHED_SESSION_ROUTER_MODULE);
    if (!isBRMenabled) {
      // -----> enableModule batched session router module
      const tx2 = await smartAccount.getEnableModuleData(DEFAULT_BATCHED_SESSION_ROUTER_MODULE);
      txArray.push(tx2);
    }

    txArray.push(setSessionAllowedTrx);

    const userOpResponse1 = await smartAccount.sendTransaction(txArray, { paymasterServiceData: { mode: PaymasterMode.SPONSORED } }); // this user op will enable the modules and setup session allowed calls
    const transactionDetails = await userOpResponse1.wait();
    expect(transactionDetails.success).toBe("true");
    Logger.log("Tx Hash: ", transactionDetails.receipt.transactionHash);

    const usdcBalance = await checkBalance(publicClient, smartAccountAddress, "0xdA5289fCAAF71d52a80A254da614a192b693e977");
    expect(usdcBalance).toBeGreaterThan(0);

    smartAccount = smartAccount.setActiveValidationModule(batchedSessionModule);

    // WARNING* If the smart account does not have enough USDC, user op execution will FAIL
    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function transfer(address _to, uint256 _value)"]),
      functionName: "transfer",
      args: [recipient, parseUnits("0.01", 6)],
    });

    const encodedCall2 = encodeFunctionData({
      abi: parseAbi(["function transfer(address _to, uint256 _value)"]),
      functionName: "transfer",
      args: ["0xd3C85Fdd3695Aee3f0A12B3376aCD8DC54020549", parseUnits("0.001", 6)],
    });

    const transferTx = {
      to: "0xdA5289fCAAF71d52a80A254da614a192b693e977",
      data: encodedCall,
    };

    const transferTx2 = {
      to: "0xdA5289fCAAF71d52a80A254da614a192b693e977",
      data: encodedCall2,
    };

    const activeModule = smartAccount.activeValidationModule;
    expect(activeModule).toEqual(batchedSessionModule);

    const maticBalanceBefore = await checkBalance(publicClient, smartAccountAddress);

    // failing with dummyTx because of invalid sessionKeyData
    const userOpResponse2 = await smartAccount.sendTransaction([transferTx, transferTx2], {
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

    const receipt = await userOpResponse2.wait();

    expect(receipt.success).toBe("true");

    expect(userOpResponse2.userOpHash).toBeTruthy();
    expect(userOpResponse2.userOpHash).not.toBeNull();

    const maticBalanceAfter = await checkBalance(publicClient, smartAccountAddress);

    expect(maticBalanceAfter).toEqual(maticBalanceBefore);

    Logger.log(`Tx at: https://jiffyscan.xyz/userOpHash/${userOpResponse2.userOpHash}?network=mumbai`);
  }, 60000);
});
