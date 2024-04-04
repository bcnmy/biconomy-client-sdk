import { PaymasterMode } from "@biconomy/paymaster";
import { TestData } from "../../../tests";
import { createSmartAccountClient } from "../../account/src/index";
import { Hex, encodeFunctionData, parseAbi } from "viem";
import { DEFAULT_MULTICHAIN_MODULE, MultiChainValidationModule } from "@biconomy/modules";
import { Logger } from "@biconomy/common";

describe("MultiChainValidation Module Tests", () => {
  let optimism: TestData;
  let baseSepolia: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [optimism, baseSepolia] = testDataPerChain;
  });

  it("Should mint an NFT gasless on baseSepolia and optimism", async () => {
    const {
      whale: { alchemyWalletClientSigner: signerOptimism, publicAddress: recipientForBothChains },
      paymasterUrl: biconomyPaymasterApiKeyOptimism,
      bundlerUrl: bundlerUrlOptimism,
      chainId: chainIdOptimism,
    } = optimism;

    const {
      whale: { alchemyWalletClientSigner: signerBase },
      paymasterUrl: biconomyPaymasterApiKeyBase,
      bundlerUrl: bundlerUrlBase,
      chainId: chainIdBase,
    } = baseSepolia;

    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";

    const multiChainModule = await MultiChainValidationModule.create({
      signer: signerOptimism,
      moduleAddress: DEFAULT_MULTICHAIN_MODULE,
    });

    const [polygonAccount, baseAccount] = await Promise.all([
      createSmartAccountClient({
        chainId: chainIdOptimism,
        signer: signerOptimism,
        bundlerUrl: bundlerUrlOptimism,
        defaultValidationModule: multiChainModule,
        activeValidationModule: multiChainModule,
        paymasterUrl: biconomyPaymasterApiKeyOptimism,
      }),
      createSmartAccountClient({
        chainId: chainIdBase,
        signer: signerBase,
        bundlerUrl: bundlerUrlBase,
        defaultValidationModule: multiChainModule,
        activeValidationModule: multiChainModule,
        paymasterUrl: biconomyPaymasterApiKeyBase,
      }),
    ]);

    // Check if the smart account has been deployed
    const [isPolygonDeployed, isBaseDeployed] = await Promise.all([polygonAccount.isAccountDeployed(), baseAccount.isAccountDeployed()]);
    if (!isPolygonDeployed) {
      const { wait } = await polygonAccount.deploy({ paymasterServiceData: { mode: PaymasterMode.SPONSORED } });
      const { success } = await wait();
      expect(success).toBe("true");
    }
    if (!isBaseDeployed) {
      const { wait } = await baseAccount.deploy({ paymasterServiceData: { mode: PaymasterMode.SPONSORED } });
      const { success } = await wait();
      expect(success).toBe("true");
    }

    const moduleEnabled1 = await polygonAccount.isModuleEnabled(DEFAULT_MULTICHAIN_MODULE);
    const moduleActive1 = polygonAccount.activeValidationModule;
    expect(moduleEnabled1).toBeTruthy();
    expect(moduleActive1.getAddress()).toBe(DEFAULT_MULTICHAIN_MODULE);

    const moduleEnabled2 = await baseAccount.isModuleEnabled(DEFAULT_MULTICHAIN_MODULE);
    const moduleActive2 = polygonAccount.activeValidationModule;
    expect(moduleEnabled2).toBeTruthy();
    expect(moduleActive2.getAddress()).toBe(DEFAULT_MULTICHAIN_MODULE);

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address owner) view returns (uint balance)"]),
      functionName: "safeMint",
      args: [recipientForBothChains],
    });

    const transaction = {
      to: nftAddress,
      data: encodedCall,
    };

    const [partialUserOp1, partialUserOp2] = await Promise.all([
      baseAccount.buildUserOp([transaction], { paymasterServiceData: { mode: PaymasterMode.SPONSORED } }),
      polygonAccount.buildUserOp([transaction], { paymasterServiceData: { mode: PaymasterMode.SPONSORED } }),
    ]);

    expect(partialUserOp1.paymasterAndData).not.toBe("0x");
    expect(partialUserOp2.paymasterAndData).not.toBe("0x");

    // Sign the user ops using multiChainModule
    const returnedOps = await multiChainModule.signUserOps([
      { userOp: partialUserOp1, chainId: chainIdBase },
      { userOp: partialUserOp2, chainId: chainIdOptimism },
    ]);

    // Send the signed user ops on both chains
    const userOpResponse1 = await baseAccount.sendSignedUserOp(returnedOps[0] as any);
    const userOpResponse2 = await polygonAccount.sendSignedUserOp(returnedOps[1] as any);

    Logger.log(userOpResponse1.userOpHash, "MULTICHAIN BASE USER OP HASH");
    Logger.log(userOpResponse2.userOpHash, "MULTICHAIN POLYGON USER OP HASH");

    expect(userOpResponse1.userOpHash).toBeTruthy();
    expect(userOpResponse2.userOpHash).toBeTruthy();

    const { success: success1 } = await userOpResponse1.wait();
    const { success: success2 } = await userOpResponse2.wait();

    expect(success1).toBe("true");
    expect(success2).toBe("true");
  }, 50000);
});
