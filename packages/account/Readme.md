# Biconomy SDK

![Biconomy SDK](https://img.shields.io/badge/Biconomy-SDK-blue.svg)
![TypeScript](https://img.shields.io/badge/-TypeScript-blue)
![Test Coverage](https://img.shields.io/badge/Coverage-79.82%25-green.svg)

## 👋 Introduction

The Biconomy SDK is your all-in-one toolkit for building decentralized applications (dApps) with **ERC4337 Account Abstraction** and **Smart Accounts**. It is designed for seamless user experiences and offers non-custodial solutions for user onboarding, sending transactions (userOps), gas sponsorship and much more.

## ⚙️ installation

```bash
npm i @biconomy/account
```

## 🛠️ Quickstart

```typescript
import { createSmartAccountClient } from "@biconomy/account";

const smartAccount = await createSmartAccountClient({
  signer: viemWalletOrEthersSigner,
  bundlerUrl: "", // From dashboard.biconomy.io
  biconomyPaymasterApiKey: "", // From dashboard.biconomy.io
});

const { wait } = await smartAccount.sendTransaction({ to: "0x...", value: 1 });

const {
  receipt: { transactionHash },
  userOpHash,
} = await wait();
```

## 🌟 Features

- **ERC4337 Account Abstraction**: Simplify user operations and gas payments.
- **Smart Accounts**: Enhance user experience with modular smart accounts.
- **Paymaster Service**: Enable third-party gas sponsorship.
- **Bundler Infrastructure**: Ensure efficient and reliable transaction bundling.

For a step-by-step guide on integrating **ERC4337 Account Abstraction** and **Smart Accounts** into your dApp using the Biconomy SDK, refer to the [official documentation](https://docs.biconomy.io/docs/overview). You can also start with Quick start [here](https://docs.biconomy.io/quickstart).

## 📚 Resources

- [Biconomy Documentation](https://docs.biconomy.io/)
- [Biconomy Dashboard](https://dashboard.biconomy.io)
- [TSDoc](https://bcnmy.github.io/biconomy-client-sdk)

## 💼 Example Usages

### [Initialise the smartAccount](https://bcnmy.github.io/biconomy-client-sdk/functions/createSmartAccountClient.html)

| Key                                                                                                            | Description                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [signer](https://bcnmy.github.io/biconomy-client-sdk/packages/account/docs/interfaces/SmartAccountSigner.html) | This signer will be used for signing userOps for any transactions you build. Will accept ethers.JsonRpcSigner as well as a viemWallet |
| [biconomyPaymasterApiKey](https://dashboard.biconomy.io)                                                       | You can pass in a biconomyPaymasterApiKey necessary for sponsoring transactions (retrieved from the biconomy dashboard)               |
| [bundlerUrl](https://dashboard.biconomy.io)                                                                    | You can pass in a bundlerUrl (retrieved from the biconomy dashboard) for sending transactions                                         |

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
  biconomyPaymasterApiKey,
});
```

### [Send some ETH, have gas sponsored](https://bcnmy.github.io/biconomy-client-sdk/classes/BiconomySmartAccountV2.html#sendTransaction)

| Key                                                                               | Description                                                    |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [oneOrManyTx](https://bcnmy.github.io/biconomy-client-sdk/types/Transaction.html) | Submit multiple or one transactions                            |
| [userOpReceipt](https://bcnmy.github.io/biconomy-client-sdk/types/UserOpReceipt)  | Returned information about your tx, receipts, userOpHashes etc |

```typescript
const oneOrManyTx = { to: "0x...", value: 1 };

const { wait } = await smartAccount.sendTransaction(oneOrManyTx, {
  mode: PaymasterMode.SPONSORED,
});

const {
  receipt: { transactionHash },
  userOpHash,
} = await wait();
```

### [Mint two NFTs, pay gas with token](https://bcnmy.github.io/biconomy-client-sdk/classes/BiconomySmartAccountV2.html#getTokenFees)

| Key                                                                                                      | Description                                |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [buildUseropDto](https://bcnmy.github.io/biconomy-client-sdk/types/BuildUserOpOptions.html)              | Options for building a userOp              |
| [paymasterServiceData](https://bcnmy.github.io/biconomy-client-sdk/types/PaymasterUserOperationDto.html) | PaymasterOptions set in the buildUseropDto |

```typescript
import { encodeFunctionData, parseAbi } from "viem";

const encodedCall = encodeFunctionData({
  abi: parseAbi(["function safeMint(address to) public"]),
  functionName: "safeMint",
  args: ["0x..."],
});

const tx = {
  to: nftAddress,
  data: encodedCall,
};
const oneOrManyTx = [tx, tx]; // Mint twice
const paymasterServiceData = {
  mode: PaymasterMode.ERC20,
  preferredToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
};
const buildUseropDto = { paymasterServiceData };

const { wait } = await smartAccount.sendTransaction(oneOrManyTx, buildUseropDto);

const {
  receipt: { transactionHash },
  userOpHash,
} = await wait();
```

## 🤝 Contributing

Community contributions are welcome! For guidelines on contributing, please read our [contribution guidelines](./CONTRIBUTING.md).

## 📜 License

This project is licensed under the MIT License. See the [LICENSE.md](./LICENSE.md) file for details.
