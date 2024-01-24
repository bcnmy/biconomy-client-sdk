# Biconomy SDK: Your Gateway to ERC4337 Account Abstraction & Smart Accounts 🛠️

![Biconomy SDK](https://img.shields.io/badge/Biconomy-SDK-blue.svg) ![TypeScript](https://img.shields.io/badge/-TypeScript-blue) ![Test Coverage](https://img.shields.io/badge/Coverage-45%25-yellow.svg)

<p align="center"><img src="./assets/readme/biconomy-client-sdk.png" width="550" alt="Biconomy SDK Banner"></p>

## Introduction

The Biconomy SDK is your all-in-one toolkit for building decentralized applications (dApps) with **ERC4337 Account Abstraction** and **Smart Accounts**. This SDK is designed for seamless user experiences and offers non-custodial solutions for user onboarding, transaction management, and gas abstraction.

<p align="center"><img src="./assets/readme/biconomy-sdk.png" width="550" alt="Biconomy SDK Diagram"></p>

## 🌟 Features

- **ERC4337 Account Abstraction**: Simplify user operations and gas payments.
- **Smart Accounts**: Enhance user experience with modular smart accounts.
- **Paymaster Service**: Enable third-party gas sponsorship.
- **Bundler Infrastructure**: Ensure efficient and reliable transaction bundling.
- **Backend Node**: Manage chain configurations and gas estimations.

## 📦 Packages

### Account

Unlock the full potential of **ERC4337 Account Abstraction** with methods that simplify the creation and dispatch of UserOperations, streamlining dApp development and management.

```javascript

import { createSmartAccountClient } from "@biconomy/account";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonMumbai } from "viem/chains";

const account = privateKeyToAccount(config.privateKey as Hex);
const signer = createWalletClient({
  account,
  chain: polygonMumbai,
  transport: http(),
});

const bundlerUrl = 'https://bundler.biconomy.io/api/v2/80001/<API_KEY>'
// Please go to https://dashboard.biconomy.io and generate bundler url

const biconomySmartAccount = await createSmartAccountClient({ bundlerUrl, signer });
console.log("address: ", await biconomySmartAccount.getAccountAddress());
```

### Paymaster

Acting as third-party intermediaries, Paymasters have the capability to sponsor gas fees for an account, provided specific predefined conditions are met. Additionally, they can accept gas payments in ERC20 tokens from users' smart accounts, with the Paymaster managing the conversion to native tokens for gas payment.

```javascript
import { Paymaster, IPaymaster } from "@biconomy/account";
const paymasterUrl = "";
// Please go to https://dashboard.biconomy.io to setup a paymasterUrl
// ...
const biconomySmartAccount = await createSmartAccountClient({ bundlerUrl, signer, paymasterUrl });
```

## 🛠️ Quickstart

For a step-by-step guide on integrating **ERC4337 Account Abstraction** and **Smart Accounts** into your dApp using the Biconomy SDK, refer to the [official documentation](https://docs.biconomy.io/docs/overview). You can also start with Quick explore here https://docs.biconomy.io/docs/category/quick-explore

## 📚 Resources

- [Biconomy Documentation](https://docs.biconomy.io/docs/overview)
- [Biconomy Dashboard](https://dashboard.biconomy.io/)
- [TSDoc](https://bcnmy.github.io/biconomy-client-sdk)

## 🤝 Contributing

Community contributions are welcome! For guidelines on contributing, please read our [contribution guidelines](./CONTRIBUTING.md).

## 📜 License

This project is licensed under the MIT License. See the [LICENSE.md](./LICENSE.md) file for details.
