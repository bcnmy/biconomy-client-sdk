import { DEFAULT_SESSION_KEY_MANAGER_MODULE, SessionKeyManagerModule } from "@biconomy/modules";
import { SessionFileStorage } from "./utils/customSession";
import { privateKeyToAccount } from "viem/accounts";
import { WalletClientSigner, createSmartWalletClient } from "../../src/index";
import { Hex, createWalletClient, encodeAbiParameters, encodeFunctionData, getContract, http, parseAbi, parseUnits, toHex } from "viem";
import { PaymasterMode } from "@biconomy/paymaster";

describe("Account Tests", () => {
  const sessionFileStorage: SessionFileStorage = new SessionFileStorage(DEFAULT_SESSION_KEY_MANAGER_MODULE);

  // it("Should create custom session storage", async () => {
  //   const wallet = privateKeyToAccount(`0x${process.env.E2E_PRIVATE_KEY_ONE}`);
  //   const sessionKeyEOA = wallet.address;

  //   await sessionFileStorage.addSigner({ pbKey: sessionKeyEOA, pvKey: "0x2e5d78c6f2e6dca5fcbb22cca841d6c43465c483f59cbd6839a24d4ec89b977b" });

  //   const addedSigner = await sessionFileStorage.getSignerByKey(sessionKeyEOA);

  //   expect(addedSigner).toBeTruthy();
  // });

  // it("Should create and setup Session Module", async () => {
  //   try {
  //     const wallet = privateKeyToAccount(`0x${process.env.E2E_PRIVATE_KEY_ONE}`);
  //     const sessionKeyEOA = wallet.address;

  //     await sessionFileStorage.addSigner({ pbKey: sessionKeyEOA, pvKey: `0x${process.env.E2E_PRIVATE_KEY_ONE}` });

  //     const addedSigner = await sessionFileStorage.getSignerByKey(sessionKeyEOA);

  //     expect(addedSigner).toBeTruthy();

  //     const smartWallet = await createSmartWalletClient({
  //       chainId: 80001,
  //       signer: addedSigner,
  //       bundlerUrl: "https://bundler.biconomy.io/api/v2/80001/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
  //       biconomyPaymasterApiKey: "nxPxZluSF.aeacea05-e564-4bd2-b8d8-94a8167fb192",
  //     });

  //     const sessionModule = await SessionKeyManagerModule.create({
  //       moduleAddress: DEFAULT_SESSION_KEY_MANAGER_MODULE,
  //       smartAccountAddress: await smartWallet.getAddress(),
  //       sessionStorageClient: sessionFileStorage,
  //     });

  //     const sessionKeyData = encodeAbiParameters([{ name: "owner", type: "address" }], ["0xd3C85Fdd3695Aee3f0A12B3376aCD8DC54020549"]);

  //     const sessionTxData = await sessionModule.createSessionData([
  //       {
  //         validUntil: 0,
  //         validAfter: 0,
  //         sessionValidationModule: DEFAULT_SESSION_KEY_MANAGER_MODULE,
  //         sessionPublicKey: sessionKeyEOA,
  //         sessionKeyData: sessionKeyData,
  //       },
  //     ]);

  //     const setSessionAllowedTrx = {
  //       to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
  //       data: sessionTxData.data,
  //       value: 0,
  //     };

  //     const txArray: any = [];

  //     const isEnabled = await smartWallet.isModuleEnabled(DEFAULT_SESSION_KEY_MANAGER_MODULE);
  //     if (!isEnabled) {
  //       console.log("MODULE NOT ENABLED");
  //       const enableModuleTrx = await smartWallet.getEnableModuleData(DEFAULT_SESSION_KEY_MANAGER_MODULE);
  //       txArray.push(enableModuleTrx);
  //     } else {
  //       console.log("MODULE ALREADY ENABLED");
  //     }

  //     txArray.push(setSessionAllowedTrx);

  //     const partialUserOp = await smartWallet.buildUserOp(txArray, {
  //       paymasterServiceData: {
  //         mode: PaymasterMode.SPONSORED,
  //       },
  //     });

  //     const userOpResponse = await smartWallet.sendUserOp(partialUserOp);
  //     console.log(`Tx at: https://jiffyscan.xyz/userOpHash/${userOpResponse.userOpHash}?network=mumbai`);

  //     const transactionDetails = await userOpResponse.wait();
  //     console.log("txHash", transactionDetails.receipt.transactionHash);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }, 50000);

  it("Should send a user op using Session Validation Module", async () => {
    try {
      // Creating wallet and session
      const wallet = privateKeyToAccount(`0x${process.env.E2E_PRIVATE_KEY_ONE}`);
      const sessionKeyEOA = wallet.address;
      let sessionSigner: WalletClientSigner;

      try {
        sessionSigner = await sessionFileStorage.getSignerByKey(sessionKeyEOA);
      } catch (error) {
        sessionSigner = await sessionFileStorage.addSigner({ pbKey: sessionKeyEOA, pvKey: `0x${process.env.E2E_PRIVATE_KEY_ONE}` });
      }

      expect(sessionSigner).toBeTruthy();

      // Create smart account
      let smartWallet = await createSmartWalletClient({
        chainId: 80001,
        signer: sessionSigner,
        bundlerUrl: "https://bundler.biconomy.io/api/v2/80001/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
        biconomyPaymasterApiKey: "nxPxZluSF.aeacea05-e564-4bd2-b8d8-94a8167fb192",
      });

      // Create session module
      const sessionModule = await SessionKeyManagerModule.create({
        moduleAddress: DEFAULT_SESSION_KEY_MANAGER_MODULE,
        smartAccountAddress: await smartWallet.getAddress(),
        sessionStorageClient: sessionFileStorage,
      });

      // Set enabled call on session
      const sessionKeyData = encodeAbiParameters(
        [{ type: "address" }, { type: "address" }, { type: "address" }, { type: "uint256" }],
        [
          sessionKeyEOA,
          "0xdA5289fCAAF71d52a80A254da614a192b693e977", // erc20 token address
          "0xfCF6Eb210E5Fd84D679b14fe170f9aB05C9B21e7", // receiver address
          parseUnits("10", 6),
        ],
      );

      const erc20ModuleAddr = "0x000000D50C68705bd6897B2d17c7de32FB519fDA";

      const sessionTxData = await sessionModule.createSessionData([
        {
          validUntil: 0,
          validAfter: 0,
          sessionValidationModule: erc20ModuleAddr,
          sessionPublicKey: sessionKeyEOA,
          sessionKeyData: sessionKeyData,
        },
      ]);

      const setSessionAllowedTrx = {
        to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
        data: sessionTxData.data,
        value: 0,
      };

      const txArray: any = [];

      // Check if module is enabled
      const isEnabled = await smartWallet.isModuleEnabled(DEFAULT_SESSION_KEY_MANAGER_MODULE);
      if (!isEnabled) {
        const enableModuleTrx = await smartWallet.getEnableModuleData(DEFAULT_SESSION_KEY_MANAGER_MODULE);
        txArray.push(enableModuleTrx);
        txArray.push(setSessionAllowedTrx);
      } else {
        console.log("MODULE ALREADY ENABLED");
        txArray.push(setSessionAllowedTrx);
      }

      const userOp = await smartWallet.buildUserOp(txArray, {
        skipBundlerGasEstimation: false,
      });

      const userOpResponse1 = await smartWallet.sendUserOp(userOp);
      const transactionDetails = await userOpResponse1.wait();
      console.log("Tx Hash: ", transactionDetails.receipt.transactionHash);

      const encodedCall = encodeFunctionData({
        abi: parseAbi(["function transfer(address _to, uint256 _value)"]),
        functionName: "transfer",
        args: ["0xfCF6Eb210E5Fd84D679b14fe170f9aB05C9B21e7", parseUnits("1", 6)],
      });

      const transferTx = {
        to: "0xdA5289fCAAF71d52a80A254da614a192b693e977", //erc20 token address
        data: encodedCall,
        value: 0,
      };

      smartWallet = smartWallet.setActiveValidationModule(sessionModule);

      console.log("BEFORE Transfer tx");
      const transferUserOp = await smartWallet.buildUserOp([transferTx], {
        skipBundlerGasEstimation: false,
        params: {
          sessionSigner: sessionSigner,
          sessionValidationModule: erc20ModuleAddr.toLowerCase() as Hex,
        },
      });
      console.log("AFTER Transfer tx");

      const userOpResponse2 = await smartWallet.sendUserOp(transferUserOp, {
        sessionSigner: sessionSigner,
        sessionValidationModule: erc20ModuleAddr,
      });
      const transactionDetails2 = await userOpResponse2.wait();
      console.log("Tx Hash: ", transactionDetails2.receipt.transactionHash);

      // console.log(`Tx at: https://jiffyscan.xyz/userOpHash/${userOpResponse2.userOpHash}?network=mumbai`);
    } catch (error) {
      console.log(error);
    }
  }, 50000);
});
