# installation

Using `npm` package manager

```bash
npm i @biconomy/account
```

OR

Using `yarn` package manager

```bash
yarn add @biconomy/account
```

### Account

Integrating and deploying Smart Accounts, building and sending user operations is a key offering of any toolkit designed for ERC4337. This package seamlessly integrates the essential features associated with ERC-4337 and simplifies the development of your Dapp's account and transaction rails with added usability features.

The account package achieves this by providing a comprehensive set of methods that enable developers to effortlessly create UserOperations. Combined with the sophisticated, developer friendly and scalable infrastructure of Biconomy, it ensures efficient and reliable transmission of these operations across multiple EVM chains.

## Smart Account instance configuration

#### BiconomySmartAccount (V1 Smart Account)

| Key       | Description                                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| signer    | This signer will be used for signing userOps for any transactions you build. You can supply your your EOA wallet signer                                                         |
| chainId   | This represents the network your smart wallet transactions will be conducted on. Take a look following Link for supported chain id's                                            |
| rpcUrl    | This represents the EVM node RPC URL you'll interact with, adjustable according to your needs. We recommend to use some private node url for efficient userOp building          |
| paymaster | you can pass same paymaster instance that you have build in previous step. Alternatively, you can skip this if you are not interested in sponsoring transaction using paymaster |
|           | Note: if you don't pass the paymaster instance, your smart account will need funds to pay for transaction fees.                                                                 |
| bundler   | You can pass same bundler instance that you have build in previous step. Alternatively, you can skip this if you are only interested in building userOP                         |

## Example Usage

```typescript
// This is how you create a smartWallet in your dapp
import { Bundler, createSmartWalletClient } from "@biconomy/account";

const smartWallet = await createSmartWalletClient({
  chainId: 1,
  signer, // viem's WalletClientSigner
  bundler: new Bundler({
    bundlerUrl,
    chainId,
    entryPointAddress,
  }),
});

// Send some ETH
const { wait } = await smartWallet.sendTransaction({
  to: "0x...",
  value: 1,
  data: "0x",
});

const {
  receipt: { transactionHash },
} = await wait();
```
