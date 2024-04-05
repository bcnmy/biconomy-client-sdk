[@biconomy/account](../README.md) / [Exports](../modules.md) / Bundler

# Class: Bundler

This class implements IBundler interface.
Implementation sends UserOperation to a bundler URL as per ERC4337 standard.
Checkout the proposal for more details on Bundlers.

## Implements

- [`IBundler`](../interfaces/IBundler.md)

## Table of contents

### Constructors

- [constructor](Bundler.md#constructor)

### Properties

- [UserOpReceiptIntervals](Bundler.md#useropreceiptintervals)
- [UserOpReceiptMaxDurationIntervals](Bundler.md#useropreceiptmaxdurationintervals)
- [UserOpWaitForTxHashIntervals](Bundler.md#useropwaitfortxhashintervals)
- [UserOpWaitForTxHashMaxDurationIntervals](Bundler.md#useropwaitfortxhashmaxdurationintervals)
- [bundlerConfig](Bundler.md#bundlerconfig)
- [provider](Bundler.md#provider)

### Methods

- [estimateUserOpGas](Bundler.md#estimateuseropgas)
- [getBundlerUrl](Bundler.md#getbundlerurl)
- [getGasFeeValues](Bundler.md#getgasfeevalues)
- [getUserOpByHash](Bundler.md#getuseropbyhash)
- [getUserOpReceipt](Bundler.md#getuseropreceipt)
- [getUserOpStatus](Bundler.md#getuseropstatus)
- [sendUserOp](Bundler.md#senduserop)
- [create](Bundler.md#create)

## Constructors

### constructor

• **new Bundler**(`bundlerConfig`): [`Bundler`](Bundler.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `bundlerConfig` | `Bundlerconfig` |

#### Returns

[`Bundler`](Bundler.md)

#### Defined in

../../bundler/dist/types/Bundler.d.ts:25

## Properties

### UserOpReceiptIntervals

• **UserOpReceiptIntervals**: `Object`

#### Defined in

../../bundler/dist/types/Bundler.d.ts:12

___

### UserOpReceiptMaxDurationIntervals

• **UserOpReceiptMaxDurationIntervals**: `Object`

#### Defined in

../../bundler/dist/types/Bundler.d.ts:18

___

### UserOpWaitForTxHashIntervals

• **UserOpWaitForTxHashIntervals**: `Object`

#### Defined in

../../bundler/dist/types/Bundler.d.ts:15

___

### UserOpWaitForTxHashMaxDurationIntervals

• **UserOpWaitForTxHashMaxDurationIntervals**: `Object`

#### Defined in

../../bundler/dist/types/Bundler.d.ts:21

___

### bundlerConfig

• `Private` **bundlerConfig**: `any`

#### Defined in

../../bundler/dist/types/Bundler.d.ts:11

___

### provider

• `Private` **provider**: `any`

#### Defined in

../../bundler/dist/types/Bundler.d.ts:24

## Methods

### estimateUserOpGas

▸ **estimateUserOpGas**(`userOp`, `stateOverrideSet?`): `Promise`\<`UserOpGasResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userOp` | `UserOperationStruct` |
| `stateOverrideSet?` | `StateOverrideSet` |

#### Returns

`Promise`\<`UserOpGasResponse`\>

Promise<UserOpGasPricesResponse>

**`Description`**

This function will fetch gasPrices from bundler

#### Implementation of

[IBundler](../interfaces/IBundler.md).[estimateUserOpGas](../interfaces/IBundler.md#estimateuseropgas)

#### Defined in

../../bundler/dist/types/Bundler.d.ts:32

___

### getBundlerUrl

▸ **getBundlerUrl**(): `string`

#### Returns

`string`

#### Implementation of

[IBundler](../interfaces/IBundler.md).[getBundlerUrl](../interfaces/IBundler.md#getbundlerurl)

#### Defined in

../../bundler/dist/types/Bundler.d.ts:26

___

### getGasFeeValues

▸ **getGasFeeValues**(): `Promise`\<`GasFeeValues`\>

#### Returns

`Promise`\<`GasFeeValues`\>

**`Description`**

This function will return the gas fee values

#### Implementation of

[IBundler](../interfaces/IBundler.md).[getGasFeeValues](../interfaces/IBundler.md#getgasfeevalues)

#### Defined in

../../bundler/dist/types/Bundler.d.ts:64

___

### getUserOpByHash

▸ **getUserOpByHash**(`userOpHash`): `Promise`\<`UserOpByHashResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userOpHash` | `string` |

#### Returns

`Promise`\<`UserOpByHashResponse`\>

Promise<UserOpByHashResponse>

**`Description`**

this function will return UserOpByHashResponse for given UserOpHash

#### Implementation of

[IBundler](../interfaces/IBundler.md).[getUserOpByHash](../interfaces/IBundler.md#getuseropbyhash)

#### Defined in

../../bundler/dist/types/Bundler.d.ts:60

___

### getUserOpReceipt

▸ **getUserOpReceipt**(`userOpHash`): `Promise`\<[`UserOpReceipt`](../modules.md#useropreceipt)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userOpHash` | `string` |

#### Returns

`Promise`\<[`UserOpReceipt`](../modules.md#useropreceipt)\>

Promise<UserOpReceipt>

**`Description`**

This function will return userOpReceipt for a given userOpHash

#### Implementation of

[IBundler](../interfaces/IBundler.md).[getUserOpReceipt](../interfaces/IBundler.md#getuseropreceipt)

#### Defined in

../../bundler/dist/types/Bundler.d.ts:46

___

### getUserOpStatus

▸ **getUserOpStatus**(`userOpHash`): `Promise`\<[`UserOpStatus`](../modules.md#useropstatus)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userOpHash` | `string` |

#### Returns

`Promise`\<[`UserOpStatus`](../modules.md#useropstatus)\>

Promise<UserOpReceipt>

**`Description`**

This function will return userOpReceipt for a given userOpHash

#### Implementation of

[IBundler](../interfaces/IBundler.md).[getUserOpStatus](../interfaces/IBundler.md#getuseropstatus)

#### Defined in

../../bundler/dist/types/Bundler.d.ts:53

___

### sendUserOp

▸ **sendUserOp**(`userOp`, `simulationParam?`): `Promise`\<[`UserOpResponse`](../modules.md#useropresponse)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userOp` | `UserOperationStruct` |
| `simulationParam?` | `SimulationType` |

#### Returns

`Promise`\<[`UserOpResponse`](../modules.md#useropresponse)\>

Promise<UserOpResponse>

**`Description`**

This function will send signed userOp to bundler to get mined on chain

#### Implementation of

[IBundler](../interfaces/IBundler.md).[sendUserOp](../interfaces/IBundler.md#senduserop)

#### Defined in

../../bundler/dist/types/Bundler.d.ts:39

___

### create

▸ **create**(`config`): `Promise`\<[`Bundler`](Bundler.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | `Bundlerconfig` |

#### Returns

`Promise`\<[`Bundler`](Bundler.md)\>

#### Defined in

../../bundler/dist/types/Bundler.d.ts:65
