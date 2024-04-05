[@biconomy/account](../README.md) / [Exports](../modules.md) / IHybridPaymaster

# Interface: IHybridPaymaster\<T\>

## Type parameters

| Name |
| :------ |
| `T` |

## Hierarchy

- [`IPaymaster`](IPaymaster.md)

  ↳ **`IHybridPaymaster`**

## Implemented by

- [`Paymaster`](../classes/Paymaster.md)

## Table of contents

### Methods

- [buildTokenApprovalTransaction](IHybridPaymaster.md#buildtokenapprovaltransaction)
- [getDummyPaymasterAndData](IHybridPaymaster.md#getdummypaymasteranddata)
- [getPaymasterAndData](IHybridPaymaster.md#getpaymasteranddata)
- [getPaymasterFeeQuotesOrData](IHybridPaymaster.md#getpaymasterfeequotesordata)

## Methods

### buildTokenApprovalTransaction

▸ **buildTokenApprovalTransaction**(`_tokenPaymasterRequest`): `Promise`\<`Transaction`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_tokenPaymasterRequest` | `BiconomyTokenPaymasterRequest` |

#### Returns

`Promise`\<`Transaction`\>

#### Defined in

../../paymaster/dist/types/interfaces/IHybridPaymaster.d.ts:7

___

### getDummyPaymasterAndData

▸ **getDummyPaymasterAndData**(`_userOp`, `_paymasterServiceData?`): `Promise`\<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_userOp` | `Partial`\<`UserOperationStruct`\> |
| `_paymasterServiceData?` | `T` |

#### Returns

`Promise`\<`string`\>

#### Overrides

[IPaymaster](IPaymaster.md).[getDummyPaymasterAndData](IPaymaster.md#getdummypaymasteranddata)

#### Defined in

../../paymaster/dist/types/interfaces/IHybridPaymaster.d.ts:6

___

### getPaymasterAndData

▸ **getPaymasterAndData**(`_userOp`, `_paymasterServiceData?`): `Promise`\<`PaymasterAndDataResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_userOp` | `Partial`\<`UserOperationStruct`\> |
| `_paymasterServiceData?` | `T` |

#### Returns

`Promise`\<`PaymasterAndDataResponse`\>

#### Overrides

[IPaymaster](IPaymaster.md).[getPaymasterAndData](IPaymaster.md#getpaymasteranddata)

#### Defined in

../../paymaster/dist/types/interfaces/IHybridPaymaster.d.ts:5

___

### getPaymasterFeeQuotesOrData

▸ **getPaymasterFeeQuotesOrData**(`_userOp`, `_paymasterServiceData`): `Promise`\<[`FeeQuotesOrDataResponse`](../modules.md#feequotesordataresponse)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_userOp` | `Partial`\<`UserOperationStruct`\> |
| `_paymasterServiceData` | `FeeQuotesOrDataDto` |

#### Returns

`Promise`\<[`FeeQuotesOrDataResponse`](../modules.md#feequotesordataresponse)\>

#### Defined in

../../paymaster/dist/types/interfaces/IHybridPaymaster.d.ts:8
