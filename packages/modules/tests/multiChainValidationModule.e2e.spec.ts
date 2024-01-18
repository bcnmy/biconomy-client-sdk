import { BiconomyPaymaster, PaymasterMode } from "@biconomy/paymaster";
import { TestData } from "../../../tests";
import { createSmartWalletClient } from "../../account/src/index";
import { Hex, encodeFunctionData, parseAbi } from "viem";
import { DEFAULT_MULTICHAIN_MODULE, MultiChainValidationModule } from "@biconomy/modules";

describe("Account with MultiChainValidation Module Tests", () => {
  let mumbai: TestData;
  let baseGoerli: TestData;

  beforeEach(() => {
    // @ts-ignore: Comes from setup-e2e-tests
    [mumbai, baseGoerli] = testDataPerChain;
  });

  it("Should mint an NFT gasless on baseGoerli and mumbai", async () => {
    const {
      whale: { alchemyWalletClientSigner: signerMumbai, publicAddress: recipientForBothChains },
      biconomyPaymasterApiKey: biconomyPaymasterApiKeyMumbai,
      bundlerUrl: bundlerUrlMumbai,
    } = mumbai;

    const {
      whale: { alchemyWalletClientSigner: signerBase },
      biconomyPaymasterApiKey: biconomyPaymasterApiKeyBase,
      bundlerUrl: bundlerUrlBase,
    } = baseGoerli;

    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";

    const multiChainModule = await MultiChainValidationModule.create({
      signer: signerMumbai,
      moduleAddress: DEFAULT_MULTICHAIN_MODULE,
    });

    const [polygonAccount, baseAccount] = await Promise.all([
      createSmartWalletClient({
        chainId: 80001,
        signer: signerMumbai,
        bundlerUrl: bundlerUrlMumbai,
        defaultValidationModule: multiChainModule,
        activeValidationModule: multiChainModule,
        biconomyPaymasterApiKey: biconomyPaymasterApiKeyMumbai,
      }),
      createSmartWalletClient({
        chainId: 84531,
        signer: signerBase,
        bundlerUrl: bundlerUrlBase,
        defaultValidationModule: multiChainModule,
        activeValidationModule: multiChainModule,
        biconomyPaymasterApiKey: biconomyPaymasterApiKeyBase,
      }),
    ]);

    const polygonPaymaster: BiconomyPaymaster = polygonAccount.paymaster as BiconomyPaymaster;
    const basePaymaster: BiconomyPaymaster = baseAccount.paymaster as BiconomyPaymaster;

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address owner) view returns (uint balance)"]),
      functionName: "safeMint",
      args: [recipientForBothChains],
    });

    const transaction = {
      to: nftAddress,
      data: encodedCall,
      value: 0,
    };

    const [partialUserOp1, partialUserOp2] = await Promise.all([baseAccount.buildUserOp([transaction]), polygonAccount.buildUserOp([transaction])]);

    // Setup paymaster and data for base account
    const basePaymasterData = await basePaymaster.getPaymasterAndData(partialUserOp1, {
      mode: PaymasterMode.SPONSORED,
    });

    partialUserOp1.paymasterAndData = basePaymasterData.paymasterAndData;
    partialUserOp1.callGasLimit = basePaymasterData.callGasLimit;
    partialUserOp1.verificationGasLimit = basePaymasterData.verificationGasLimit;
    partialUserOp1.preVerificationGas = basePaymasterData.preVerificationGas;

    // Setup paymaster and data for polygon account
    const polygonPaymasterData = await polygonPaymaster.getPaymasterAndData(partialUserOp2, {
      mode: PaymasterMode.SPONSORED,
    });

    partialUserOp2.paymasterAndData = polygonPaymasterData.paymasterAndData;
    partialUserOp2.callGasLimit = polygonPaymasterData.callGasLimit;
    partialUserOp2.verificationGasLimit = polygonPaymasterData.verificationGasLimit;
    partialUserOp2.preVerificationGas = polygonPaymasterData.preVerificationGas;

    // Sign the user ops using multiChainModule
    const returnedOps = await multiChainModule.signUserOps([
      { userOp: partialUserOp1, chainId: 84531 },
      { userOp: partialUserOp2, chainId: 80001 },
    ]);

    // Send the signed user ops on both chains
    const userOpResponse1 = await baseAccount.sendSignedUserOp(returnedOps[0] as any);
    const userOpResponse2 = await polygonAccount.sendSignedUserOp(returnedOps[1] as any);

    console.log(userOpResponse1.userOpHash, "MULTICHAIN BASE USER OP HASH");
    console.log(userOpResponse2.userOpHash, "MULTICHAIN POLYGON USER OP HASH");

    expect(userOpResponse1.userOpHash).toBeTruthy();
    expect(userOpResponse2.userOpHash).toBeTruthy();
  }, 30000);
});
