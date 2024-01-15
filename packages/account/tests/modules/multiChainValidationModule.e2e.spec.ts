import { BiconomyPaymaster, PaymasterMode, SponsorUserOperationDto } from "@biconomy/paymaster";
import { TestData } from "..";
import { BiconomySmartAccountV2, createSmartWalletClient } from "../../src/index";
import { Hex, createWalletClient, encodeFunctionData, http, parseAbi } from "viem";
import { UserOperationStruct, WalletClientSigner } from "@alchemy/aa-core";
import { checkBalance, entryPointABI } from "../utils";
import { DEFAULT_MULTICHAIN_MODULE, MultiChainValidationModule } from "@biconomy/modules";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseGoerli } from "viem/chains";

describe("Account with MultiChainValidation Module Tests", () => {
  let chainData: TestData;

  beforeEach(() => {
    // @ts-ignore
    chainData = testDataPerChain[0];
  });

  it("Should mint an NFT gasless on Base Goerli and Polygon Mumbai", async () => {
    const {
      whale: { alchemyWalletClientSigner, publicAddress: recipient },
      biconomyPaymasterApiKey,
      bundlerUrl,
    } = chainData;

    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";

    const multiChainModule = await MultiChainValidationModule.create({
        signer: alchemyWalletClientSigner,
        moduleAddress: DEFAULT_MULTICHAIN_MODULE,
    });

    const polygonAccount = await createSmartWalletClient({
      chainId: 80001,
      signer: alchemyWalletClientSigner,
      bundlerUrl,
      defaultValidationModule: multiChainModule,
      activeValidationModule: multiChainModule,
      biconomyPaymasterApiKey
    });

    const polygonPaymaster: BiconomyPaymaster = polygonAccount.paymaster as BiconomyPaymaster;

    const baseWallet = privateKeyToAccount(`0x${process.env.E2E_PRIVATE_KEY_ONE}`);
    const baseClient = createWalletClient({
      account: baseWallet,
      chain: baseGoerli,
      transport: http(baseGoerli.rpcUrls.public.http[0]),
    });
    const baseSigner = new WalletClientSigner(baseClient, "json-rpc");

    const baseAccount = await createSmartWalletClient({
      chainId: 84531,
      signer: baseSigner,
      bundlerUrl: "https://bundler.biconomy.io/api/v2/84531/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
      defaultValidationModule: multiChainModule,
      activeValidationModule: multiChainModule,
      biconomyPaymasterApiKey: process.env.E2E_BICO_PAYMASTER_KEY_BASE
    });

    const basePaymaster: BiconomyPaymaster = baseAccount.paymaster as BiconomyPaymaster;

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address owner) view returns (uint balance)"]),
      functionName: "safeMint",
      args: [recipient],
    });

    const transaction = {
      to: nftAddress, 
      data: encodedCall,
      value: 0,
    };

    let partialUserOp1 = await baseAccount.buildUserOp([transaction]);
    let partialUserOp2 = await polygonAccount.buildUserOp([transaction]);

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
    const returnedOps = await multiChainModule.signUserOps([{userOp: partialUserOp1, chainId: 84531}, {userOp: partialUserOp2, chainId: 80001}]);

    // Send the signed user ops on both chains
    const userOpResponse1 = await baseAccount.sendSignedUserOp(returnedOps[0] as any)
    const userOpResponse2 = await polygonAccount.sendSignedUserOp(returnedOps[1] as any)

    console.log(userOpResponse1.userOpHash, 'BASE USER OP HASH');
    console.log(userOpResponse2.userOpHash, 'POLYGON USER OP HASH');

    expect(userOpResponse1.userOpHash).toBeTruthy();
    expect(userOpResponse2.userOpHash).toBeTruthy();

  }, 30000);
});