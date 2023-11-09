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
// This is how you create BiconomySmartAccount instance in your dapp's

import { BiconomySmartAccount, BiconomySmartAccountConfig } from "@biconomy/account";

// Note that paymaster and bundler are optional. You can choose to create new instances of this later and make account API use
const biconomySmartAccountConfig: BiconomySmartAccountConfig = {
  signer: wallet.getSigner(),
  chainId: ChainId.POLYGON_MAINNET,
  rpcUrl: "",
  // paymaster: paymaster, // check the README.md section of Paymaster package
  // bundler: bundler, // check the README.md section of Bundler package
};

const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig);
const biconomySmartAccount = await biconomyAccount.init();

// native token transfer
// you can create any sort of transaction following same structure
const transaction = {
  to: "0x85B51B068bF0fefFEFD817882a14f6F5BDF7fF2E",
  data: "0x",
  value: ethers.utils.parseEther("0.1"),
};

// building partialUserOp
const partialUserOp = await biconomySmartAccount.buildUserOp([transaction]);

// using the paymaster package one can populate paymasterAndData to partial userOp. by default it is '0x'
```

```typescript
const userOpResponse = await smartAccount.sendUserOp(partialUserOp);
const transactionDetails = await userOpResponse.wait();
console.log("transaction details below");
console.log(transactionDetails);
```

Finally we send the userOp and save the value to a variable named userOpResponse and get the transactionDetails after calling `typescript userOpResponse.wait()`

```typescript
const transactionDetails = await userOpResponse.wait();
console.log("transaction details below");
console.log(transactionDetails);
```

#### BiconomySmartAccount (V2 Smart Account aka Modular Smart Account)

