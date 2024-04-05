[@biconomy/account](../README.md) / [Exports](../modules.md) / IPaymaster

# Interface: IPaymaster

## Hierarchy

- **`IPaymaster`**

  ↳ [`IHybridPaymaster`](IHybridPaymaster.md)

## Table of contents

### Methods

- [getDummyPaymasterAndData](IPaymaster.md#getdummypaymasteranddata)
- [getPaymasterAndData](IPaymaster.md#getpaymasteranddata)

## Methods

### getDummyPaymasterAndData

▸ **getDummyPaymasterAndData**(`_userOp`): `Promise`\<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_userOp` | `Partial`\<`UserOperationStruct`\> |

#### Returns

`Promise`\<`string`\>

#### Defined in

../../paymaster/dist/types/interfaces/IPaymaster.d.ts:5

___

### getPaymasterAndData

▸ **getPaymasterAndData**(`_userOp`): `Promise`\<`PaymasterAndDataResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_userOp` | `Partial`\<`UserOperationStruct`\> |

#### Returns

`Promise`\<`PaymasterAndDataResponse`\>

#### Defined in

../../paymaster/dist/types/interfaces/IPaymaster.d.ts:4
