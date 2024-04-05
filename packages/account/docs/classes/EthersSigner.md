[@biconomy/account](../README.md) / [Exports](../modules.md) / EthersSigner

# Class: EthersSigner\<T\>

A signer that can sign messages and typed data.

**`Var`**

signerType - the type of the signer (e.g. local, hardware, etc.)

**`Var`**

inner - the inner client of

**`Method`**

getAddress - get the address of the signer

**`Method`**

signMessage - sign a message

**`Method`**

signTypedData - sign typed data

## Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `T` | extends `Signer` | the generic type of the inner client that the signer wraps to provide functionality such as signing, etc. |

## Implements

- [`SmartAccountSigner`](../interfaces/SmartAccountSigner.md)\<`T`\>

## Table of contents

### Constructors

- [constructor](EthersSigner.md#constructor)

### Properties

- [#private](EthersSigner.md##private)
- [inner](EthersSigner.md#inner)
- [signerType](EthersSigner.md#signertype)

### Methods

- [getAddress](EthersSigner.md#getaddress)
- [signMessage](EthersSigner.md#signmessage)
- [signTypedData](EthersSigner.md#signtypeddata)

## Constructors

### constructor

• **new EthersSigner**\<`T`\>(`inner`, `signerType`): [`EthersSigner`](EthersSigner.md)\<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Signer` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `inner` | `T` |
| `signerType` | `string` |

#### Returns

[`EthersSigner`](EthersSigner.md)\<`T`\>

#### Defined in

../../common/dist/types/utils/EthersSigner.d.ts:8

## Properties

### #private

• `Private` **#private**: `any`

#### Defined in

../../common/dist/types/utils/EthersSigner.d.ts:5

___

### inner

• **inner**: `T`

#### Implementation of

[SmartAccountSigner](../interfaces/SmartAccountSigner.md).[inner](../interfaces/SmartAccountSigner.md#inner)

#### Defined in

../../common/dist/types/utils/EthersSigner.d.ts:7

___

### signerType

• **signerType**: `string`

#### Implementation of

[SmartAccountSigner](../interfaces/SmartAccountSigner.md).[signerType](../interfaces/SmartAccountSigner.md#signertype)

#### Defined in

../../common/dist/types/utils/EthersSigner.d.ts:6

## Methods

### getAddress

▸ **getAddress**(): `Promise`\<\`0x$\{string}\`\>

#### Returns

`Promise`\<\`0x$\{string}\`\>

#### Implementation of

[SmartAccountSigner](../interfaces/SmartAccountSigner.md).[getAddress](../interfaces/SmartAccountSigner.md#getaddress)

#### Defined in

../../common/dist/types/utils/EthersSigner.d.ts:9

___

### signMessage

▸ **signMessage**(`_message`): `Promise`\<\`0x$\{string}\`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_message` | `SignableMessage` |

#### Returns

`Promise`\<\`0x$\{string}\`\>

#### Implementation of

[SmartAccountSigner](../interfaces/SmartAccountSigner.md).[signMessage](../interfaces/SmartAccountSigner.md#signmessage)

#### Defined in

../../common/dist/types/utils/EthersSigner.d.ts:10

___

### signTypedData

▸ **signTypedData**(`_notUsed`): `Promise`\<\`0x$\{string}\`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_notUsed` | `any` |

#### Returns

`Promise`\<\`0x$\{string}\`\>

#### Implementation of

[SmartAccountSigner](../interfaces/SmartAccountSigner.md).[signTypedData](../interfaces/SmartAccountSigner.md#signtypeddata)

#### Defined in

../../common/dist/types/utils/EthersSigner.d.ts:11
