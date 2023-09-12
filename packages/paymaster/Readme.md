# **Paymaster**

ERC4337, Account abstraction, introduces the concept of Paymasters. These specialised entities play a pivotal role in revolutionising the traditional gas payment system in EVM transactions. Paymasters, acting as third-party intermediaries, possess the capability to sponsor gas fees for an account, provided specific predefined conditions are satisfied.

## Installation

Using `npm` package manager

```bash
npm i @biconomy/paymaster
```

OR

Using `yarn` package manager

```bash
yarn add @biconomy/paymaster
```

**Usage**

```typescript
// This is how you create paymaster instance in your dapp's
import { IPaymaster, BiconomyPaymaster } from "@biconomy/paymaster";

// Currently this package only exports Biconomy Paymaster which acts as a Hybrid paymaster for gas abstraction. You can sponsor user transactions but can also make users pay gas in supported ERC20 tokens.

const paymaster = new BiconomyPaymaster({
  paymasterUrl: "", // you can get this value from biconomy dashboard. https://dashboard.biconomy.io
});
```

**paymasterUrl** you can get this value from biconomy dashboard.

Following are the methods that can be called on paymaster instance

```typescript
export interface IHybridPaymaster<T> extends IPaymaster {
  getPaymasterAndData(userOp: Partial<UserOperation>, paymasterServiceData?: T): Promise<PaymasterAndDataResponse>;
  buildTokenApprovalTransaction(tokenPaymasterRequest: BiconomyTokenPaymasterRequest, provider: Provider): Promise<Transaction>;
  getPaymasterFeeQuotesOrData(userOp: Partial<UserOperation>, paymasterServiceData: FeeQuotesOrDataDto): Promise<FeeQuotesOrDataResponse>;
}
```

One can also build their own Paymaster API class and submit a PR or just provide instance of it in the account package / use standalone to generate paymasterAndData

It should follow below Interface.

```typescript
export interface IPaymaster {
  // Implementing class may add extra parameter (for example paymasterServiceData with it's own type) in below function signature
  getPaymasterAndData(userOp: Partial<UserOperation>): Promise<PaymasterAndDataResponse>;
  getDummyPaymasterAndData(userOp: Partial<UserOperation>): Promise<string>;
}
```

### Below API methods can be used for Biconomy Hybrid paymaster

**getPaymasterAndData**

This function accepts a **`Partial<UserOperation>`** object that includes all properties of **`userOp`** except for the **`signature`** and **`paymasterAndData`** field. It returns **`paymasterAndData`** as part of the **`PaymasterAndDataResponse`**

**buildTokenApprovalTransaction**

This function is specifically used for token paymaster sponsorship. The primary purpose of this function is to create an approve transaction for paymaster that gets batched with the rest of your transactions.

Note: You don't need to call this function. It will automatically get called as part of the **`buildTokenPaymasterUserOp`** function call.

**getPaymasterFeeQuotesOrData**

This function is used to fetch quote information or paymaster data based on provided userOperation and paymasterServiceData. If explicit mode is not provided it tries for sponsorship first and then falls back to serving fee quotes for supported/requested token/s

Note: This function can return **paymasterAndData** as well in case all of the policies checks get passed.
