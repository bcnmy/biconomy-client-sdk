import { BiconomyPaymaster, PaymasterMode, SponsorUserOperationDto } from "@biconomy/paymaster";
import { TestData } from "..";
import { BiconomySmartAccountV2, createSmartWalletClient } from "../../src/index";
import { Hex, encodeFunctionData, parseAbi } from "viem";
import { UserOperationStruct } from "@alchemy/aa-core";
import { checkBalance, entryPointABI } from "../utils";
import { DEFAULT_MULTICHAIN_MODULE, MultiChainValidationModule } from "@biconomy/modules";

describe("Account with MultiChainValidation Module Tests", () => {
  let chainData: TestData;

  beforeEach(() => {
    // @ts-ignore
    chainData = testDataPerChain[0];
  });

  it("Should create a multi chain user op", async () => {
    const {
      whale: { signer, publicAddress: recipient },
      biconomyPaymasterApiKey,
      bundlerUrl,
    } = chainData;

    const nftAddress: Hex = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
    
    const multiChainModule: MultiChainValidationModule = await MultiChainValidationModule.create({
        signer: signer,
        moduleAddress: DEFAULT_MULTICHAIN_MODULE,
    });

    const polygonAccount = await createSmartWalletClient({
      chainId: 80001,
      signer,
      bundlerUrl,
      defaultValidationModule: multiChainModule,
      activeValidationModule: multiChainModule,
      biconomyPaymasterApiKey
    });

    const goerliAccount = await createSmartWalletClient({
      chainId: 5,
      signer,
      bundlerUrl: "https://bundler.biconomy.io/api/v2/5/cJPK7B3ru.dd7f7861-190d-45ic-af80-6877f74b8f44",
      defaultValidationModule: multiChainModule,
      activeValidationModule: multiChainModule,
      biconomyPaymasterApiKey: process.env.E2E_BICO_PAYMASTER_KEY_GOERLI!,
    });

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address owner) view returns (uint balance)"]),
      functionName: "safeMint",
      args: [recipient],
    });

    const transaction = {
      to: nftAddress, // NFT address
      data: encodedCall,
      value: 0,
    };

    let partialUserOp1 = await goerliAccount.buildUserOp([transaction], 
      {
        paymasterServiceData: {
          mode: PaymasterMode.SPONSORED,
        }
      }  
    );

    let partialUserOp2 = await polygonAccount.buildUserOp([transaction], 
      {
        paymasterServiceData: {
          mode: PaymasterMode.SPONSORED,
        }
      }  
    );

    const signedUserOps = await multiChainModule.signUserOps([{userOp: partialUserOp1, chainId: 5}, {userOp: partialUserOp2, chainId: 80001}]);

    const userOpResponse1 = await goerliAccount.sendSignedUserOp(signedUserOps[0]);
    const userOpResponse2 = await goerliAccount.sendSignedUserOp(signedUserOps[1]);

    // const returnedOp1 = await goerliAccount.signUserOp(partialUserOp1);
    // const returnedOp2 = await polygonAccount.signUserOp(partialUserOp2);

    // const userOpResponse1 = await goerliAccount.sendSignedUserOp(returnedOp1 as any);
    // const transactionDetails1 = await userOpResponse1.wait();
    // console.log(transactionDetails1);
    // const userOpResponse2 = await polygonAccount.sendSignedUserOp(returnedOp2 as any);
    // const transactionDetails2 = await userOpResponse2.wait();
    // console.log(transactionDetails2);
    

  }, 30000);
});
