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

const withSponsorship = {
  paymasterServiceData: { mode: PaymasterMode.SPONSORED },
};

const account = privateKeyToAccount(generatePrivateKey());
const signer = createWalletClient({ account, chain, transport: http() });
const smartAccount = await createSmartAccountClient({
  signer,
  bundlerUrl,
  paymasterUrl,
}); // Retrieve bundler and pymaster urls from dashboard
const smartAccountAddress = await smartAccount.getAccountAddress();

/**
 * Rule
 *
 * https://docs.biconomy.io/Modules/abiSessionValidationModule#rules
 *
 * Rules define permissions for the args of an allowed method. With rules, you can precisely define what should be the args of the transaction that is allowed for a given Session. Every Rule works with a single static arg or a 32-byte chunk of the dynamic arg.
 * Since the ABI Encoding translates every static param into a 32-bytes word, even the shorter ones (like address or uint8), every Rule defines a desired relation (Condition) between n-th 32bytes word of the calldata and a reference Value (that is obviously a 32-bytes word as well).
 * So, when dApp is creating a _sessionKeyData to enable a session, it should convert every shorter static arg to a 32bytes word to match how it will be actually ABI encoded in the userOp.callData.
 * For the dynamic args, like bytes, every 32-bytes word of the calldata such as offset of the bytes arg, length of the bytes arg, and n-th 32-bytes word of the bytes arg can be controlled by a dedicated Rule.
 */
const rules: Rule = [
  {
    /**
     *
     * offset
     *
     * https://docs.biconomy.io/Modules/abiSessionValidationModule#rules
     *
     * The offset in the ABI SVM contract helps locate the relevant data within the function call data, it serves as a reference point from which to start reading or extracting specific information required for validation. When processing function call data, particularly in low-level languages like Solidity assembly, it's necessary to locate where specific parameters or arguments are stored. The offset is used to calculate the starting position within the calldata where the desired data resides. Suppose we have a function call with multiple arguments passed as calldata. Each argument occupies a certain number of bytes, and the offset helps determine where each argument begins within the calldata.
     * Using the offset to Extract Data: In the contract, the offset is used to calculate the position within the calldata where specific parameters or arguments are located. Since every arg is a 32-bytes word, offsets are always multiplier of 32 (or of 0x20 in hex).
     * Let's see how the offset is applied to extract the to and value arguments of a transfer(address to, uint256 value) method:
     * - Extracting to Argument: The to argument is the first parameter of the transfer function, representing the recipient address. Every calldata starts with the 4-bytes method selector. However, the ABI SVM is adding the selector length itself, so for the first argument the offset will always be 0 (0x00);
     * - Extracting value Argument: The value argument is the second parameter of the transfer function, representing the amount of tokens to be transferred. To extract this argument, the offset for the value parameter would be calculated based on its position in the function calldata. Despite to is a 20-bytes address, in the solidity abi encoding it is always appended with zeroes to a 32-bytes word. So the offset for the second 32-bytes argument (which isthe value in our case) will be 32 (or 0x20 in hex).
     *
     * If you need to deal with dynamic-length arguments, such as bytes, please refer to this document https://docs.soliditylang.org/en/v0.8.24/abi-spec.html#function-selector-and-argument-encoding to learn more about how dynamic arguments are represented in the calldata and which offsets should be used to access them.
     */
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
    /** The address of the sessionKey upon which the policy is to be imparted. Can be optional if creating from scratch */
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

const { wait, session } = await createSession(smartAccount, policy, null, {
  paymasterServiceData: { mode: PaymasterMode.SPONSORED },
});

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
  smartAccountAddress // Storage client, full Session or smartAccount address if using default storage
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
  withSponsorship,
  {
    leafIndex: "LAST_LEAF",
    store: "DEFAULT_STORE", // Storage client, full Session or smartAccount address if using default storage
  },
);

const { success } = await mintWait();
```
