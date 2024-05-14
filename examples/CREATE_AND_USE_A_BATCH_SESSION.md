### Create and Use a Batch Session

| Key                                                                                                           | Description                                          |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [sessionConfigs](https://bcnmy.github.io/biconomy-client-sdk/interfaces/CreateSessionDataParams.html)         | svm criteria                                         |
| [createERC20SessionDatum](https://bcnmy.github.io/biconomy-client-sdk/functions/createERC20SessionDatum.html) | helper that returns erc20 svm data (not recommended) |
| [createABISessionDatum](https://bcnmy.github.io/biconomy-client-sdk/types/createABISessionDatum.html)         | helper that returns abi svm data (recommended)       |

```typescript
import {
  createSmartAccountClient,
  createSession,
  createSessionSmartAccountClient,
  Rule,
  PaymasterMode,
  Policy,
} from "@biconomy/account";
import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { mainnet as chain } from "viem/chains";

const withSponsorship = {
  paymasterServiceData: { mode: PaymasterMode.SPONSORED },
};

const account = privateKeyToAccount(generatePrivateKey());
const signer = createWalletClient({ account, chain, transport: http() });
const smartAccount = await createSmartAccountClient({
  signer,
  bundlerUrl,
  paymasterUrl,
});

// Retrieve bundler and pymaster urls from dashboard
const smartAccountAddress = await smartAccount.getAccountAddress();

// creates a store for the session, and saves the keys to it to be later retrieved
const { sessionKeyAddress, sessionStorageClient } = await createSessionKeyEOA(
  smartAccount,
  chain
);

const leaves: CreateSessionParams[] = [
  createERC20SessionDatum({
    interval: {
      validUntil: 0,
      validAfter: 0,
    },
    sessionKeyAddress,
    sessionKeyData: encodeAbiParameters(
      [
        { type: "address" },
        { type: "address" },
        { type: "address" },
        { type: "uint256" },
      ],
      [sessionKeyAddress, token, recipient, amount]
    ),
  }),
  createABISessionDatum({
    interval: {
      validUntil: 0,
      validAfter: 0,
    },
    sessionKeyAddress,
    contractAddress: nftAddress,
    functionSelector: "safeMint(address)",
    rules: [
      {
        offset: 0,
        condition: 0,
        referenceValue: smartAccountAddress,
      },
    ],
    valueLimit: 0n,
  }),
];

const { wait, session } = await createBatchSession(
  smartAccount,
  sessionKeyAddress,
  sessionStorageClient,
  leaves,
  withSponsorship
);

const {
  receipt: { transactionHash },
  success,
} = await wait();

const smartAccountWithSession = await createSessionSmartAccountClient(
  {
    accountAddress: smartAccountAddress, // Set the account address on behalf of the user
    bundlerUrl,
    paymasterUrl,
    chainId,
  },
  session,
  true // if batching
);

const transferTx: Transaction = {
  to: token,
  data: encodeFunctionData({
    abi: parseAbi(["function transfer(address _to, uint256 _value)"]),
    functionName: "transfer",
    args: [recipient, amount],
  }),
};
const nftMintTx: Transaction = {
  to: nftAddress,
  data: encodeFunctionData({
    abi: parseAbi(["function safeMint(address _to)"]),
    functionName: "safeMint",
    args: [smartAccountAddress],
  }),
};

const txs = [transferTx, nftMintTx];

const batchSessionParams = await getBatchSessionTxParams(
  ["ERC20", "ABI"],
  txs,
  session,
  chain
);

const { wait: sessionWait } = await smartAccountWithSession.sendTransaction(
  txs,
  {
    ...batchSessionParams,
    ...withSponsorship,
  }
);

const { success } = await sessionWait();
```
