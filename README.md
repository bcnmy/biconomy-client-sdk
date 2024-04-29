[![Biconomy](https://img.shields.io/badge/Made_with_%F0%9F%8D%8A_by-Biconomy-ff4e17?style=flat)](https://biconomy.io) [![License MIT](https://img.shields.io/badge/License-MIT-blue?&style=flat)](./LICENSE) [![codecov](https://codecov.io/gh/bcnmy/biconomy-client-sdk/graph/badge.svg?token=DTdIR5aBDA)](https://codecov.io/gh/bcnmy/biconomy-client-sdk)

# SDK 🚀

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bcnmy/biconomy-client-sdk)

The Biconomy SDK is your all-in-one toolkit for building decentralized applications (dApps) with **ERC4337 Account Abstraction** and **Smart Accounts**. It is designed for seamless user experiences and offers non-custodial solutions for user onboarding, sending transactions (userOps), gas sponsorship and much more.

## 📚 Table of Contents

- [SDK 🚀](#sdk-)

  - [📚 Table of Contents](#-table-of-contents)
  - [🛠️ Quickstart](#-quickstart)

    - [Prerequisites](#prerequisites)
    - [Installation](#installation)

  - [📄 Documentation and Resources](#-documentation-and-resources)
  - [💼 Examples](#-examples)

    - [🛠️ Initialise a smartAccount](#-initialise-a-smartAccount)
    - [📨 send some eth with sponsorship](#-send-some-eth-with-sponsorship)
    - [🔢 send a multi tx and pay gas with a token](#️-send-a-multi-tx-and-pay-gas-with-a-token)

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

### [Initialise a smartAccount](https://bcnmy.github.io/biconomy-client-sdk/functions/createSmartAccountClient.html)

| Key                                                                                                            | Description                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [signer](https://bcnmy.github.io/biconomy-client-sdk/packages/account/docs/interfaces/SmartAccountSigner.html) | This signer will be used for signing userOps for any transactions you build. Will accept ethers.JsonRpcSigner as well as a viemWallet |
| [paymasterUrl](https://dashboard.biconomy.io)                                                                  | You can pass in a paymasterUrl necessary for sponsoring transactions (retrieved from the biconomy dashboard)                          |
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
  paymasterUrl,
});
```

### [Send some eth with sponsorship](https://bcnmy.github.io/biconomy-client-sdk/classes/BiconomySmartAccountV2.html#sendTransaction)

| Key                                                                               | Description                                                    |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [oneOrManyTx](https://bcnmy.github.io/biconomy-client-sdk/types/Transaction.html) | Submit multiple or one transactions                            |
| [userOpReceipt](https://bcnmy.github.io/biconomy-client-sdk/types/UserOpReceipt)  | Returned information about your tx, receipts, userOpHashes etc |

```typescript
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

### [Send a multi tx and pay gas with a token](https://bcnmy.github.io/biconomy-client-sdk/classes/BiconomySmartAccountV2.html#getTokenFees)

| Key                                                                                                      | Description                                |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [buildUseropDto](https://bcnmy.github.io/biconomy-client-sdk/types/BuildUserOpOptions.html)              | Options for building a userOp              |
| [paymasterServiceData](https://bcnmy.github.io/biconomy-client-sdk/types/PaymasterUserOperationDto.html) | PaymasterOptions set in the buildUseropDto |

```typescript
import { encodeFunctionData, parseAbi } from "viem";
const preferredToken = "0x747A4168DB14F57871fa8cda8B5455D8C2a8e90a"; // USDC

const tx = {
  to: nftAddress,
  data: encodeFunctionData({
    abi: parseAbi(["function safeMint(address to) public"]),
    functionName: "safeMint",
    args: ["0x..."],
  }),
};

const buildUseropDto = {
  paymasterServiceData: {
    mode: PaymasterMode.ERC20,
    preferredToken,
  },
};

const { wait } = await smartAccount.sendTransaction(
  [tx, tx] /* Mint twice */,
  buildUseropDto
);

const {
  receipt: { transactionHash },
  userOpHash,
  success,
} = await wait();
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details

## Connect with Biconomy 🍊

[![Website](https://img.shields.io/badge/🍊-Website-ff4e17?style=for-the-badge&logoColor=white)](https://biconomy.io) [![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/biconomy) [![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/biconomy) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/company/biconomy) [![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/biconomy) [![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/channel/UC0CtA-Dw9yg-ENgav_VYjRw) [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/bcnmy/)
