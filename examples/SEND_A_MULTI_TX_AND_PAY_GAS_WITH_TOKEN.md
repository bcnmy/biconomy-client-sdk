### [Send a multi tx and pay gas with a token](https://bcnmy.github.io/biconomy-client-sdk/classes/BiconomySmartAccountV2.html#getTokenFees)

| Key                                                                                                      | Description                                |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [buildUseropDto](https://bcnmy.github.io/biconomy-client-sdk/types/BuildUserOpOptions.html)              | Options for building a userOp              |
| [paymasterServiceData](https://bcnmy.github.io/biconomy-client-sdk/types/PaymasterUserOperationDto.html) | PaymasterOptions set in the buildUseropDto |

```typescript
import { encodeFunctionData, parseAbi, createWalletClient, http, createPublicClient } from "viem";
import { createSmartAccountClient } from "@biconomy/account";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { mainnet as chain } from "viem/chains";

const account = privateKeyToAccount(generatePrivateKey());
const signer = createWalletClient({ account, chain, transport: http() });
const smartAccount = await createSmartAccountClient({ signer, bundlerUrl, paymasterUrl }); // Retrieve bundler and pymaster urls from dashboard

const preferredToken = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"; // USDC

const tx = {
  to: nftAddress,
  data: encodeFunctionData({
    abi: parseAbi(["function safeMint(address to) public"]),
    functionName: "safeMint",
    args: ["0x..."],
  }),
};

const buildUseropDto = {
  paymasterServiceData: {
    mode: PaymasterMode.ERC20,
    preferredToken,
  },
};

const { wait } = await smartAccount.sendTransaction(
  [tx, tx] /* Mint twice */,
  buildUseropDto
);

const {
  receipt: { transactionHash },
  userOpHash,
  success,
} = await wait();
```
