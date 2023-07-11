# Biconomy SDK
The Biconomy Software Development Kit (SDK) build purely on atop of ERC4337 solution, presents a comprehensive range of solutions, from user onboarding to sustained engagement, specifically designed for decentralised applications (dApps). This SDK functions in a non-custodial fashion, provides a unified solution that enhances the user experience within your dApp.

# installation
Using `npm` package manager

```bash
npm i @biconomy/core-types @biconomy/account @biconomy/bundler @biconomy/paymaster
```
OR

```bash
yarn add @biconomy/core-types @biconomy/account @biconomy/bundler @biconomy/paymaster
```

Building and sending userOperation is the main offering of any tool kit built for ERC4337. A prime example of such a toolkit is the Biconomy account package. Crafted with the needs of developers in mind, this package provides seamless integration of the crucial features associated with ERC-4337. It simplifies the process of building and sending UserOperations, thereby streamlining the development and management of decentralised applications (dApps).

The Biconomy account package does this by providing a set of methods that make it easy for developers to create UserOperations. This, coupled with the sophisticated backend of the Biconomy platform, ensures efficient and reliable transmission of these operations on EVM networks.

### Bundler

In the context of  (ERC4337), the concept of a bundler plays a central role in the infrastructure. This concept is integral to the operation of account abstraction across any network that utilizes the Ethereum Virtual Machine (EVM). 

Bundler infrastructure is designed and implemented in accordance with standardised specifications. This standardisation across all bundlers offers a significant advantage, particularly when it comes to interoperability with various tools and services, such as the Biconomy SDK.

## configuration
| Key                | Description |
| -------------------| ------------- |
| bundlerUrl         | Represent ERC4337 spec implemented bundler url. you can get one from biconomy dashboard. Alternatively you can supply any of your preferred|
| chainId            | This represents the network your smart wallet transactions will be conducted on. Take a look following Link for supported chain id's |
| entryPointAddress  | Since entrypoint can have different addresses you can call getSupportedEntryPoints() on bundler instance for supported addresses list|

```typescript
// This is how you create bundler instance in your dapp's
import { IBundler, Bundler } from '@biconomy/bundler'
import { ChainId } from "@biconomy/core-types";

const bundler: IBundler = new Bundler({
    bundlerUrl: '',      
    chainId: ChainId.POLYGON_MAINNET,
    entryPointAddress: '',
  })
```

### Paymaster

ERC4337, Account abstraction, introduces the concept of Paymasters. These specialised entities play a pivotal role in revolutionising the traditional gas payment system in EVM transactions. Paymasters, acting as third-party intermediaries, possess the capability to sponsor gas fees for an account, provided specific predefined conditions are satisfied.

**paymasterUrl** you can get this value from biconomy dashboard. https://dashboard.biconomy.io

```typescript
// This is how you create paymaster instance in your dapp's
import { IPaymaster, BiconomyPaymaster } from '@biconomy/paymaster'

  const paymaster: IPaymaster = new BiconomyPaymaster({
    paymasterUrl: '' // you can get this value from biconomy dashboard. https://dashboard.biconomy.io
  })
```

## Smart Account instance configuration

| Key           | Description |
| ------------- | ------------- |
| signer        | This signer will be used for signing userOps for any transactions you build. You can supply your your EOA wallet signer|
| chainId       | This represents the network your smart wallet transactions will be conducted on. Take a look following Link for supported chain id's |
| rpcUrl        | This represents the EVM node RPC URL you'll interact with, adjustable according to your needs. We recommend to use some private node url for efficient userOp building|
| paymaster     | you can pass same paymaster instance that you have build in previous step. Alternatively, you can skip this if you are not interested in sponsoring transaction using paymaster|
|               | Note: if you don’t pass| paymaster instance your smart account need to pay for transaction fee|
| bundler       | You can pass same bundler instance that you have build in previous step. Alternatively, you can skip this if you are only interested in building userOP|


## Example Script Usage

```typescript
// This is how you create BiconomySmartAccount instance in your dapp's

import { BiconomySmartAccount, BiconomySmartAccountConfig } from "@biconomy/account"
import { IHybridPaymaster, PaymasterMode, SponsorUserOperationDto, PaymasterFeeQuote } from '@biconomy/paymaster'

const biconomySmartAccountConfig: BiconomySmartAccountConfig = {
    signer: wallet.getSigner(),
    chainId: ChainId.POLYGON_MAINNET, 
    rpcUrl: '',
    paymaster: paymaster, //you can skip paymaster instance if not interested in transaction sposoring
    bundler: bundler,
}

const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig)
const biconomySmartAccount =  await biconomyAccount.init()

// native token transfer transaction creation
// you can create any sort of transaction following same structure
const transaction = {
  to: '0x85B51B068bF0fefFEFD817882a14f6F5BDF7fF2E',
  data: '0x',
  value: ethers.utils.parseEther('0.1'),
}

// building userOperation
const builtUserOp = await biconomySmartAccount.buildUserOp([transaction])

const biconomyPaymaster = biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>
let paymasterServiceData: SponsorUserOperationDto = {
        mode: PaymasterMode.SPONSORED,
        calculateGasLimits: true
}

const paymasterAndDataWithLimits = await biconomyPaymaster.getPaymasterAndData( userOp, paymasterServiceData)
userOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData
userOp.callGasLimit = paymasterAndDataWithLimits.callGasLimit ?? finalUserOp.callGasLimit
userOp.verificationGasLimit = paymasterAndDataWithLimits.verificationGasLimit ?? finalUserOp.verificationGasLimit
userOp.preVerificationGas = paymasterAndDataWithLimits.preVerificationGas ?? finalUserOp.preVerificationGas

```

**paymasterServiceData** is an object that contains information about the paymaster service, including its mode, gas limit calculations, and sponsorship information.
**paymasterAndDataWithLimits** is an object obtained by calling the getPaymasterAndData function on biconomyPaymaster with userOp (user operation) and paymasterServiceData as parameters. It contains the paymaster data and gas limits.
This code is generating paymasterAndData and updating gas Limits to ensure transaction fee can be sponsors by dapp in native tokens.

```typescript
const userOpResponse = await smartAccount.sendUserOp(userOp)
const transactionDetail = await userOpResponse.wait()
console.log("transaction detail below")
console.log(transactionDetail)
```
Finally we send the userOp and save the value to a variable named userOpResponse and get the transactionDetail after calling ```typescript userOpResponse.wait()```

```typescript
const transactionDetail = await userOpResponse.wait(5)
console.log("transaction detail below")
console.log(transactionDetail)
```
You can also give confirmation count to wait function to await until transaction reached desired confirmation count