[@biconomy/account](../README.md) / [Exports](../modules.md) / Paymaster

# Class: Paymaster

**`Dev`**

Hybrid - Generic Gas Abstraction paymaster

## Implements

- [`IHybridPaymaster`](../interfaces/IHybridPaymaster.md)\<[`SponsorUserOperationDto`](../modules.md#sponsoruseroperationdto)\>

## Table of contents

### Constructors

- [constructor](Paymaster.md#constructor)

### Properties

- [paymasterConfig](Paymaster.md#paymasterconfig)
- [prepareUserOperation](Paymaster.md#prepareuseroperation)

### Methods

- [buildTokenApprovalTransaction](Paymaster.md#buildtokenapprovaltransaction)
- [getDummyPaymasterAndData](Paymaster.md#getdummypaymasteranddata)
- [getPaymasterAndData](Paymaster.md#getpaymasteranddata)
- [getPaymasterFeeQuotesOrData](Paymaster.md#getpaymasterfeequotesordata)
- [create](Paymaster.md#create)

## Constructors

### constructor

• **new Paymaster**(`config`): [`Paymaster`](Paymaster.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | `PaymasterConfig` |

#### Returns

[`Paymaster`](Paymaster.md)

#### Defined in

../../paymaster/dist/types/BiconomyPaymaster.d.ts:9

## Properties

### paymasterConfig

• **paymasterConfig**: `PaymasterConfig`

#### Defined in

../../paymaster/dist/types/BiconomyPaymaster.d.ts:8

___

### prepareUserOperation

• `Private` **prepareUserOperation**: `any`

**`Dev`**

Prepares the user operation by resolving properties and converting certain values to hexadecimal format.

**`Param`**

The partial user operation.

#### Defined in

../../paymaster/dist/types/BiconomyPaymaster.d.ts:15

## Methods

### buildTokenApprovalTransaction

▸ **buildTokenApprovalTransaction**(`tokenPaymasterRequest`): `Promise`\<`Transaction`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `tokenPaymasterRequest` | `BiconomyTokenPaymasterRequest` | The token paymaster request data. This will include information about chosen feeQuote, spender address and optional flag to provide maxApproval |

#### Returns

`Promise`\<`Transaction`\>

A Promise that resolves to the built transaction object.

**`Dev`**

Builds a token approval transaction for the Biconomy token paymaster.

#### Implementation of

[IHybridPaymaster](../interfaces/IHybridPaymaster.md).[buildTokenApprovalTransaction](../interfaces/IHybridPaymaster.md#buildtokenapprovaltransaction)

#### Defined in

../../paymaster/dist/types/BiconomyPaymaster.d.ts:22

___

### getDummyPaymasterAndData

▸ **getDummyPaymasterAndData**(`_userOp`, `_paymasterServiceData?`): `Promise`\<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_userOp` | `Partial`\<`UserOperationStruct`\> |
| `_paymasterServiceData?` | [`SponsorUserOperationDto`](../modules.md#sponsoruseroperationdto) |

#### Returns

`Promise`\<`string`\>

"0x"

#### Implementation of

[IHybridPaymaster](../interfaces/IHybridPaymaster.md).[getDummyPaymasterAndData](../interfaces/IHybridPaymaster.md#getdummypaymasteranddata)

#### Defined in

../../paymaster/dist/types/BiconomyPaymaster.d.ts:43

___

### getPaymasterAndData

▸ **getPaymasterAndData**(`userOp`, `paymasterServiceData?`): `Promise`\<`PaymasterAndDataResponse`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `userOp` | `Partial`\<`UserOperationStruct`\> | The partial user operation. |
| `paymasterServiceData?` | [`SponsorUserOperationDto`](../modules.md#sponsoruseroperationdto) | Optional paymaster service data. |

#### Returns

`Promise`\<`PaymasterAndDataResponse`\>

A Promise that resolves to the paymaster and data string.

**`Dev`**

Retrieves the paymaster and data based on the provided user operation and paymaster service data.

#### Implementation of

[IHybridPaymaster](../interfaces/IHybridPaymaster.md).[getPaymasterAndData](../interfaces/IHybridPaymaster.md#getpaymasteranddata)

#### Defined in

../../paymaster/dist/types/BiconomyPaymaster.d.ts:36

___

### getPaymasterFeeQuotesOrData

▸ **getPaymasterFeeQuotesOrData**(`userOp`, `paymasterServiceData`): `Promise`\<[`FeeQuotesOrDataResponse`](../modules.md#feequotesordataresponse)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `userOp` | `Partial`\<`UserOperationStruct`\> | The partial user operation. |
| `paymasterServiceData` | `FeeQuotesOrDataDto` | The paymaster service data containing token information and sponsorship details. Devs can send just the preferred token or array of token addresses in case of mode "ERC20" and sartAccountInfo in case of "sponsored" mode. |

#### Returns

`Promise`\<[`FeeQuotesOrDataResponse`](../modules.md#feequotesordataresponse)\>

A Promise that resolves to the fee quotes or data response.

**`Dev`**

Retrieves paymaster fee quotes or data based on the provided user operation and paymaster service data.

#### Implementation of

[IHybridPaymaster](../interfaces/IHybridPaymaster.md).[getPaymasterFeeQuotesOrData](../interfaces/IHybridPaymaster.md#getpaymasterfeequotesordata)

#### Defined in

../../paymaster/dist/types/BiconomyPaymaster.d.ts:29

___

### create

▸ **create**(`config`): `Promise`\<[`Paymaster`](Paymaster.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | `PaymasterConfig` |

#### Returns

`Promise`\<[`Paymaster`](Paymaster.md)\>

#### Defined in

../../paymaster/dist/types/BiconomyPaymaster.d.ts:44
