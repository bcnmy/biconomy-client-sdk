# installation

Using `npm` package manager

```bash
npm i @biconomy-devx/account
```

OR

Using `yarn` package manager

```bash
yarn add @biconomy-devx/account
```

### Account

Integrating and deploying Smart Accounts, building and sending user operations is a key offering of any toolkit designed for ERC4337. This package seamlessly integrates the essential features associated with ERC-4337 and simplifies the development of your Dapp's account and transaction rails with added usability features.

The account package achieves this by providing a comprehensive set of methods that enable developers to effortlessly create UserOperations. Combined with the sophisticated, developer friendly and scalable infrastructure of Biconomy, it ensures efficient and reliable transmission of these operations across multiple EVM chains.

## Smart Account instance configuration

#### BiconomySmartAccount (V2 Smart Account)

| Key                     | Description                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| signer                  | This signer will be used for signing userOps for any transactions you build. You can supply your your EOA wallet signer |
| biconomyPaymasterApiKey | You can pass in a paymaster url necessary for sponsoring transactions (retrieved from the biconomy dashboard)           |
|                         | Note: If you don't pass the paymaster instance, your smart account will need funds to pay for transaction fees.         |
| bundlerUrl              | You can pass in a bundlerUrl (retrieved from the biconomy dashboard) for sending transactions                           |

## Example Usage

```typescript
// This is how you create a smartWallet in your dapp
import { Bundler, createSmartAccountClient } from "@biconomy-devx/account";
import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { mainnet as chain } from "viem/chains";

const account = privateKeyToAccount(generatePrivateKey());
const signer = createWalletClient({ account, chain, transport: http() });
const smartWallet = await createSmartAccountClient({ signer, bundlerUrl, biconomyPaymasterApiKey });

// Send some ETH
const { waitForTxHash } = await smartWallet.sendTransaction({ to: "0x...", value: 1 });
const {
  receipt: { transactionHash },
} = await waitForTxHash();
```
