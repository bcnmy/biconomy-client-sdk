### [Send some eth with sponsorship](https://bcnmy.github.io/biconomy-client-sdk/classes/BiconomySmartAccountV2.html#sendTransaction)

| Key                                                                               | Description                                                    |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [oneOrManyTx](https://bcnmy.github.io/biconomy-client-sdk/types/Transaction.html) | Submit multiple or one transactions                            |
| [userOpReceipt](https://bcnmy.github.io/biconomy-client-sdk/types/UserOpReceipt)  | Returned information about your tx, receipts, userOpHashes etc |

```typescript
import { createSmartAccountClient } from "@biconomy/account";
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

const oneOrManyTx = { to: "0x...", value: 1 };

const { wait } = await smartAccount.sendTransaction(oneOrManyTx, {
  paymasterServiceData: {
    mode: PaymasterMode.SPONSORED,
  },
});

const {
  receipt: { transactionHash },
  userOpHash,
  success,
} = await wait();
```
