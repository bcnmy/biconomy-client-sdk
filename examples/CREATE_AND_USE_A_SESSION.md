### Create and Use a Session

| Key                                                                             | Description |
| ------------------------------------------------------------------------------- | ----------- |
| [sessionConfigs](https://bcnmy.github.io/biconomy-client-sdk/types/Policy.html) | Policy[]    |
| [rules](https://bcnmy.github.io/biconomy-client-sdk/types/Policy.html)          | Rule[]      |

```typescript
import {
  createSmartAccountClient,
  createSession,
  createSessionSmartAccountClient,
  Rule,
  Policy,
} from "@biconomy/account";
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

// creates a store for the session, and saves the keys to it to be later retrieved
const { sessionKeyAddress, sessionStorageClient } = await createSessionKeyEOA(
  smartAccount,
  chain
);

// The rules that govern the method from the whitelisted contract
const rules: Rule = [
  {
    /** The index of the param from the selected contract function upon which the condition will be applied */
    offset: 0,
    /**
     * Conditions:
     *
     * 0 - Equal
     * 1 - Less than or equal
     * 2 - Less than
     * 3 - Greater than or equal
     * 4 - Greater than
     * 5 - Not equal
     */
    condition: 0,
    /** The value to compare against */
    referenceValue: smartAccountAddress,
  },
];

/** The policy is made up of a list of rules applied to the contract method with and interval */
const policy: Policy[] = [
  {
    /** The address of the sessionKey upon which the policy is to be imparted */
    sessionKeyAddress,
    /** The address of the contract to be included in the policy */
    contractAddress: nftAddress,
    /** The specific function selector from the contract to be included in the policy */
    functionSelector: "safeMint(address)",
    /** The list of rules which make up the policy */
    rules,
    /** The time interval within which the session is valid */
    interval: {
      validUntil: 0,
      validAfter: 0,
    },
    /** The maximum value that can be transferred in a single transaction */
    valueLimit: 0n,
  },
];

const { wait, session } = await createSession(
  smartAccount,
  policy,
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
