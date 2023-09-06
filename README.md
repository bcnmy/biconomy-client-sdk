# Biconomy SDK: Your Gateway to ERC4337 Account Abstraction & Smart Accounts 🛠️

![Biconomy SDK](https://img.shields.io/badge/Biconomy-SDK-blue.svg) ![TypeScript](https://img.shields.io/badge/-TypeScript-blue) ![Test Coverage](https://img.shields.io/badge/Coverage-45%25-yellow.svg)

<p align="center"><img src="./assets/readme/biconomy-client-sdk.png" width="550" alt="Biconomy SDK Banner"></p>

## Introduction

The Biconomy SDK is your all-in-one toolkit for building decentralized applications (dApps) with **ERC4337 Account Abstraction** and **Smart Accounts**. This SDK is designed for seamless user experiences and offers non-custodial solutions for **ERC6900 compliant** user onboarding, transaction management, and gas abstraction.

<p align="center"><img src="./assets/readme/biconomy-sdk.png" width="550" alt="Biconomy SDK Diagram"></p>

## 🌟 Features

- **ERC4337 Account Abstraction**: Simplify user operations and gas payments.
- **Smart Accounts**: Enhance user experience with ERC6900 compliant accounts.
- **Paymaster Service**: Enable third-party gas sponsorship.
- **Bundler Infrastructure**: Ensure efficient and reliable transaction bundling.
- **Backend Node**: Manage chain configurations and gas estimations.

## 📦 Packages

### Account

Unlock the full potential of **ERC4337 Account Abstraction** with methods that simplify the creation and dispatch of UserOperations, streamlining dApp development and management.

```javascript
const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig);
const biconomySmartAccount =  await biconomyAccount.init();
console.log("owner: ", biconomySmartAccount.owner);
console.log("address: ", biconomySmartAccount.address);
```

### Bundler

Leverage standardized bundler infrastructure for efficient operation of account abstraction across EVM networks.

```javascript
const bundler: IBundler = new Bundler({
    bundlerUrl: '', // From Biconomy Dashboard
    chainId: ChainId.POLYGON_MUMBAI,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
});
```

### Paymaster

Acting as third-party intermediaries, Paymasters have the capability to sponsor gas fees for an account, provided specific predefined conditions are met.

```javascript
const paymaster: IPaymaster = new BiconomyPaymaster({
    paymasterUrl: '' // From Biconomy Dashboard
});
```

## 🛠️ Quickstart

For a step-by-step guide on integrating **ERC4337 Account Abstraction** and **Smart Accounts** into your dApp using the Biconomy SDK, refer to the [official documentation](https://docs.biconomy.io/docs/overview).

## 📚 Resources

- [Biconomy Documentation](https://docs.biconomy.io/docs/overview)
- [Biconomy Dashboard](https://dashboard.biconomy.io/)

## 🤝 Contributing

Community contributions are welcome! For guidelines on contributing, please read our [contribution guidelines](./CONTRIBUTING.md).

## 📜 License

This project is licensed under the MIT License. See the [LICENSE.md](./LICENSE.md) file for details.