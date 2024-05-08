### Create and Use a Session

| Key                                                                                         | Description           |
| ------------------------------------------------------------------------------------------- | --------------------- |
| [sessionConfigs](https://bcnmy.github.io/biconomy-client-sdk/types/BuildUserOpOptions.html) | CreateSessionConfig[] |

```typescript
import {
  createSmartAccountClient,
  createSession,
  createSessionSmartAccountClient,
} from "@biconomy-devx/account";
import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { mainnet as chain } from "viem/chains";

const account = privateKeyToAccount(generatePrivateKey());
const signer = createWalletClient({ account, chain, transport: http() });
const smartAccount = await createSmartAccountClient({
  signer,
  bundlerUrl,
  paymasterUrl,
}); // Retrieve bundler and pymaster urls from dashboard
const smartAccountAddress = await smartAccount.getAccountAddress();

const { sessionKeyAddress, sessionStorageClient } =
  await createAndStoreNewSessionKey(smartAccount, chain);

const { wait, session } = await createSession(
  smartAccount,
  sessionKeyAddress,
  [
    {
      sessionKeyAddress,
      contractAddress: nftAddress,
      functionSelector: "safeMint(address)",
      rules: [
        {
          offset: 0,
          condition: 0,
          referenceValue: pad(smartAccountAddress, { size: 32 }),
        },
      ],
      interval: {
        validUntil: 0,
        validAfter: 0,
      },
      valueLimit: 0n,
    },
  ],
  sessionStorageClient,
  {
    paymasterServiceData: { mode: PaymasterMode.SPONSORED },
  }
);

const {
  receipt: { transactionHash },
} = await wait();

const smartAccountWithSession = await createSessionSmartAccountClient(
  {
    accountAddress: smartAccountAddress, // Set the account address on behalf of the user
    bundlerUrl,
    paymasterUrl,
    chainId,
  },
  session
);

const { wait: mintWait } = await smartAccountWithSession.sendTransaction(
  {
    to: nftAddress,
    data: encodeFunctionData({
      abi: parseAbi(["function safeMint(address _to)"]),
      functionName: "safeMint",
      args: [smartAccountAddress],
    }),
  },
  {
    paymasterServiceData: { mode: PaymasterMode.SPONSORED },
  }
);

const { success } = await mintWait();
```
