[@biconomy/account](../README.md) / [Exports](../modules.md) / IBundler

# Interface: IBundler

## Implemented by

- [`Bundler`](../classes/Bundler.md)

## Table of contents

### Methods

- [estimateUserOpGas](IBundler.md#estimateuseropgas)
- [getBundlerUrl](IBundler.md#getbundlerurl)
- [getGasFeeValues](IBundler.md#getgasfeevalues)
- [getUserOpByHash](IBundler.md#getuseropbyhash)
- [getUserOpReceipt](IBundler.md#getuseropreceipt)
- [getUserOpStatus](IBundler.md#getuseropstatus)
- [sendUserOp](IBundler.md#senduserop)

## Methods

### estimateUserOpGas

▸ **estimateUserOpGas**(`_userOp`, `stateOverrideSet?`): `Promise`\<`UserOpGasResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_userOp` | `Partial`\<`UserOperationStruct`\> |
| `stateOverrideSet?` | `StateOverrideSet` |

#### Returns

`Promise`\<`UserOpGasResponse`\>

#### Defined in

../../bundler/dist/types/interfaces/IBundler.d.ts:5

___

### getBundlerUrl

▸ **getBundlerUrl**(): `string`

#### Returns

`string`

#### Defined in

../../bundler/dist/types/interfaces/IBundler.d.ts:11

___

### getGasFeeValues

▸ **getGasFeeValues**(): `Promise`\<`GasFeeValues`\>

#### Returns

`Promise`\<`GasFeeValues`\>

#### Defined in

../../bundler/dist/types/interfaces/IBundler.d.ts:9

___

### getUserOpByHash

▸ **getUserOpByHash**(`_userOpHash`): `Promise`\<`UserOpByHashResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_userOpHash` | `string` |

#### Returns

`Promise`\<`UserOpByHashResponse`\>

#### Defined in

../../bundler/dist/types/interfaces/IBundler.d.ts:8

___

### getUserOpReceipt

▸ **getUserOpReceipt**(`_userOpHash`): `Promise`\<[`UserOpReceipt`](../modules.md#useropreceipt)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_userOpHash` | `string` |

#### Returns

`Promise`\<[`UserOpReceipt`](../modules.md#useropreceipt)\>

#### Defined in

../../bundler/dist/types/interfaces/IBundler.d.ts:7

___

### getUserOpStatus

▸ **getUserOpStatus**(`_userOpHash`): `Promise`\<[`UserOpStatus`](../modules.md#useropstatus)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_userOpHash` | `string` |

#### Returns

`Promise`\<[`UserOpStatus`](../modules.md#useropstatus)\>

#### Defined in

../../bundler/dist/types/interfaces/IBundler.d.ts:10

___

### sendUserOp

▸ **sendUserOp**(`_userOp`, `_simulationType?`): `Promise`\<[`UserOpResponse`](../modules.md#useropresponse)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_userOp` | `UserOperationStruct` |
| `_simulationType?` | `SimulationType` |

#### Returns

`Promise`\<[`UserOpResponse`](../modules.md#useropresponse)\>

#### Defined in

../../bundler/dist/types/interfaces/IBundler.d.ts:6
