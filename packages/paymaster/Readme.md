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
import { IPaymaster, BiconomyPaymaster } from '@biconomy/paymaster'

  const paymaster = new BiconomyPaymaster({
    paymasterUrl: '' // you can get this value from biconomy dashboard. https://dashboard.biconomy.io
  })
```

**paymasterUrl** you can get this value from biconomy dashboard.

Following are the methods that can be called on paymaster instance 

```typescript
export interface IHybridPaymaster<T> extends IPaymaster {
  getPaymasterAndData(
    userOp: Partial<UserOperation>,
    paymasterServiceData?: T
  ): Promise<PaymasterAndDataResponse>
  buildTokenApprovalTransaction(
    tokenPaymasterRequest: BiconomyTokenPaymasterRequest,
    provider: Provider
  ): Promise<Transaction>
  getPaymasterFeeQuotesOrData(
    userOp: Partial<UserOperation>,
    paymasterServiceData: FeeQuotesOrDataDto
  ): Promise<FeeQuotesOrDataResponse>
}
```

**getPaymasterAndData**

This function accepts a **`Partial<UserOperation>`** object that includes all properties of **`userOp`** except for the **`signature`** field. It returns **`paymasterAndData`** as part of the **`PaymasterAndDataResponse`**. The **`paymasterAndData`** string is signed by the paymaster's verifier signer, which will eventually result in the payment of your transaction fee by the paymaster.

**buildTokenApprovalTransaction**

This function is specifically used for token paymaster sponsorship. The primary purpose of this function is to create an approve transaction that gets batched with the rest of your transactions. This way, you will be paying the paymaster in ERC20 tokens, which will result in the paymaster paying on your behalf in native tokens.

Note: you don’t need to call this function. it will automatically get **buildTokenPaymasterUserOp** using account package

**getPaymasterFeeQuotesOrData**

This function is used to fetch quote information or data base on provider userOperation and paymasterServiceData. 

```typescript
const feeQuotesResponse =
        await biconomyPaymaster.getPaymasterFeeQuotesOrData(partialUserOp, {
          mode: PaymasterMode.ERC20,
          calculateGasLimits: true,
          tokenList: [],
          preferredToken: "" // you can also supply preferred token value
        });
```

If you supply specific address in tokenList array. System will return fee quotes for those specific token. Alternatively, you can supply preferredToken address you wants to pay in. 

Note: This function can return **paymasterAndData** as well in case all of the policies checks get pass.

Here is Token paymaster sponsorship example in typescript

```typescript

import { BiconomySmartAccount, BiconomySmartAccountConfig, DEFAULT_ENTRYPOINT_ADDRESS } from "@biconomy/account"

import {
    IHybridPaymaster,
    BiconomyPaymaster,
    PaymasterFeeQuote,
    PaymasterMode,
    SponsorUserOperationDto,
} from '@biconomy/paymaster'

const bundler: IBundler = new Bundler({
        bundlerUrl: '', // get this bundlerUrl from dashboard https://dashboard.biconomy.io/
        chainId: ChainId.POLYGON_MUMBAI,
        entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS
    })

const paymaster = new BiconomyPaymaster({
        paymasterUrl: '' // get this paymasterUrl from dashboard https://dashboard.biconomy.io/
    });

const biconomySmartAccountConfig: BiconomySmartAccountConfig = {
        signer: walletSigner, 
        chainId: ChainId.POLYGON_MUMBAI,
        paymaster: paymaster,
        bundler: bundler,
    }
// here we are initialising BiconomySmartAccount instance
const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig)
const biconomySmartAccount = await biconomyAccount.init()
// Next step is to construct our transaction which will take the following values

const transaction = {
    to: '0x322Af0da66D00be980C7aa006377FCaaEee3BDFD',
    data: '0x',
    value: ethers.utils.parseEther('0.1'),
  }
// you can change transaction object with any sort of transaction you wants to make
let partialUserOp = await biconomySmartAccount.buildUserOp([transaction])
let finalUserOp = partialUserOp;

// we have build partial userOp with required values
// Next step is fetch fee quotes info
const biconomyPaymaster =
biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>

const feeQuotesResponse = await biconomyPaymaster.getPaymasterFeeQuotesOrData(partialUserOp, {
          mode: PaymasterMode.ERC20,
          calculateGasLimits: true,
          tokenList: [],
 });
// here we set the mode value to ERC20 since we wanted to pay in token

const feeQuotes = feeQuotesResponse.feeQuotes as PaymasterFeeQuote[]
console.log('feeQuotes ', feeQuotes);
// feeQuotes contains quotes for defaul supported token
const spender = feeQuotesResponse.tokenPaymasterAddress || ""
// here spender is our paymaster address to which we will give access of our tokens
finalUserOp = await biconomySmartAccount.buildTokenPaymasterUserOp(
        partialUserOp,
        {
          feeQuote: feeQuotes[0],
          spender: spender,
          maxApproval: false,
        }
      )
// Now at this stage our userOp has update callData that includes approve trasaction information as well

let paymasterServiceData = {
        mode: PaymasterMode.ERC20,
        calculateGasLimits: true,
        feeTokenAddress: feeQuotes[0].tokenAddress,
      }
// At this stage we wanted to getPaymasterAndData and for that we need to prepare paymasterServiceData object, that includes feeTokenAddress that we have choosen to pay as fee
      
const paymasterAndDataWithLimits = await biconomyPaymaster.getPaymasterAndData(
            finalUserOp,
            paymasterServiceData
        );

finalUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData;
finalUserOp.callGasLimit = paymasterAndDataWithLimits.callGasLimit ?? finalUserOp.callGasLimit;
finalUserOp.verificationGasLimit = paymasterAndDataWithLimits.verificationGasLimit ?? finalUserOp.verificationGasLimit;
    finalUserOp.preVerificationGas = paymasterAndDataWithLimits.preVerificationGas ?? finalUserOp.preVerificationGas;

// Now we have got paymasteeAndData and some updated gasLimits. We have updated those values in finalUserOp

const userOpResponse = await smartAccount.sendUserOp(finalUserOp)
const transactionDetail = await userOpResponse.wait()
console.log(transactionDetail)

// Finally we have send the userOp and save the value to a variable named userOpResponse and get the transactionDetail after calling userOpResponse.wait()

const transactionDetail = await userOpResponse.wait(5)

console.log(transactionDetail)

// You can also give confirmation count to wait function to await until transaction reached desired confirmation count

```