[![Biconomy](https://img.shields.io/badge/Made_with_%F0%9F%8D%8A_by-Biconomy-ff4e17?style=flat)](https://biconomy.io) [![License MIT](https://img.shields.io/badge/License-MIT-blue?&style=flat)](./LICENSE) [![codecov](https://codecov.io/gh/bcnmy/biconomy-client-sdk/graph/badge.svg?token=DTdIR5aBDA)](https://codecov.io/gh/bcnmy/biconomy-client-sdk)

# SDK 🚀

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bcnmy/biconomy-client-sdk)

The Biconomy SDK is your all-in-one toolkit for building decentralized applications (dApps) with **ERC4337 Account Abstraction** and **Smart Accounts**. It is designed for seamless user experiences and offers non-custodial solutions for user onboarding, sending transactions (userOps), gas sponsorship and much more.

> :warning: **Building with React?**: [Use our hooks package](https://github.com/bcnmy/useAA)

## 📚 Table of Contents

- [SDK 🚀](#sdk-)

  - [📚 Table of Contents](#-table-of-contents)
  - [🛠️ Quickstart](#-quickstart)

    - [Prerequisites](#prerequisites)
    - [Installation](#installation)

  - [📄 Documentation and Resources](#-documentation-and-resources)
  - [💼 Examples](#-examples)
  - [License](#license)
  - [Connect with Biconomy 🍊](#connect-with-biconomy-🍊)

## 🛠️ Quickstart

### Installation

1. **Add the package and install dependencies:**

```bash
bun add @biconomy/account viem
```

2. **Install dependencies:**

```bash
bun i
```

```typescript
import { createSmartAccountClient } from "@biconomy/account";

const smartAccount = await createSmartAccountClient({
  signer: viemWalletOrEthersSigner,
  bundlerUrl: "", // From dashboard.biconomy.io
  paymasterUrl: "", // From dashboard.biconomy.io
});

const { wait } = await smartAccount.sendTransaction({ to: "0x...", value: 1 });

const {
  receipt: { transactionHash },
  success,
} = await wait();
```

## Documentation and Resources

For a comprehensive understanding of our project and to contribute effectively, please refer to the following resources:

- [**Biconomy Documentation**](https://docs.biconomy.io)
- [**Biconomy Dashboard**](https://dashboard.biconomy.io)
- [**API Documentation**](https://bcnmy.github.io/biconomy-client-sdk)
- [**Contributing Guidelines**](./CONTRIBUTING.md): Learn how to contribute to our project, from code contributions to documentation improvements.
- [**Code of Conduct**](./CODE_OF_CONDUCT.md): Our commitment to fostering an open and welcoming environment.
- [**Security Policy**](./SECURITY.md): Guidelines for reporting security vulnerabilities.
- [**Changelog**](./CHANGELOG.md): Stay updated with the changes and versions

## 💼 Examples

- [Initialise a smartAccount](examples/INITIALISE_A_SMART_CONTRACT.md)
- [send some eth with sponsorship](examples/SEND_SOME_ETH_WITH_SPONSORSHIP.md)
- [send a multi tx and pay gas with an erc20 token](examples/SEND_A_MULTI_TX_AND_PAY_GAS_WITH_TOKEN.md)
- [create and use a session](examples/CREATE_AND_USE_A_SESSION.md)
- [create and use a batch session](examples/CREATE_AND_USE_A_BATCH_SESSION.md)

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details

## Connect with Biconomy 🍊

[![Website](https://img.shields.io/badge/🍊-Website-ff4e17?style=for-the-badge&logoColor=white)](https://biconomy.io) [![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/biconomy) [![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/biconomy) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/company/biconomy) [![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/biconomy) [![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/channel/UC0CtA-Dw9yg-ENgav_VYjRw) [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/bcnmy/)
