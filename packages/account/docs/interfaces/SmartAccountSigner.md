[@biconomy/account](../README.md) / [Exports](../modules.md) / SmartAccountSigner

# Interface: SmartAccountSigner\<Inner\>

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
| `Inner` | `any` | the generic type of the inner client that the signer wraps to provide functionality such as signing, etc. |

## Implemented by

- [`EthersSigner`](../classes/EthersSigner.md)
- [`LocalAccountSigner`](../classes/LocalAccountSigner.md)
- [`WalletClientSigner`](../classes/WalletClientSigner.md)

## Table of contents

### Properties

- [getAddress](SmartAccountSigner.md#getaddress)
- [inner](SmartAccountSigner.md#inner)
- [signMessage](SmartAccountSigner.md#signmessage)
- [signTypedData](SmartAccountSigner.md#signtypeddata)
- [signerType](SmartAccountSigner.md#signertype)

## Properties

### getAddress

• **getAddress**: () => `Promise`\<\`0x$\{string}\`\>

#### Type declaration

▸ (): `Promise`\<\`0x$\{string}\`\>

##### Returns

`Promise`\<\`0x$\{string}\`\>

#### Defined in

../../../node_modules/@alchemy/aa-core/dist/types/signer/types.d.ts:32

___

### inner

• **inner**: `Inner`

#### Defined in

../../../node_modules/@alchemy/aa-core/dist/types/signer/types.d.ts:31

___

### signMessage

• **signMessage**: (`message`: `SignableMessage`) => `Promise`\<\`0x$\{string}\`\>

#### Type declaration

▸ (`message`): `Promise`\<\`0x$\{string}\`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `SignableMessage` |

##### Returns

`Promise`\<\`0x$\{string}\`\>

#### Defined in

../../../node_modules/@alchemy/aa-core/dist/types/signer/types.d.ts:33

___

### signTypedData

• **signTypedData**: \<TTypedData, TPrimaryType\>(`params`: `TypedDataDefinition`\<`TTypedData`, `TPrimaryType`\>) => `Promise`\<\`0x$\{string}\`\>

#### Type declaration

▸ \<`TTypedData`, `TPrimaryType`\>(`params`): `Promise`\<\`0x$\{string}\`\>

##### Type parameters

| Name | Type |
| :------ | :------ |
| `TTypedData` | extends \{ `address`: `undefined` ; `bool`: `undefined` ; `bytes`: `undefined` ; `bytes1`: `undefined` ; `bytes10`: `undefined` ; `bytes11`: `undefined` ; `bytes12`: `undefined` ; `bytes13`: `undefined` ; `bytes14`: `undefined` ; `bytes15`: `undefined` ; `bytes16`: `undefined` ; `bytes17`: `undefined` ; `bytes18`: `undefined` ; `bytes19`: `undefined` ; `bytes2`: `undefined` ; `bytes20`: `undefined` ; `bytes21`: `undefined` ; `bytes22`: `undefined` ; `bytes23`: `undefined` ; `bytes24`: `undefined` ; `bytes25`: `undefined` ; `bytes26`: `undefined` ; `bytes27`: `undefined` ; `bytes28`: `undefined` ; `bytes29`: `undefined` ; `bytes3`: `undefined` ; `bytes30`: `undefined` ; `bytes31`: `undefined` ; `bytes32`: `undefined` ; `bytes4`: `undefined` ; `bytes5`: `undefined` ; `bytes6`: `undefined` ; `bytes7`: `undefined` ; `bytes8`: `undefined` ; `bytes9`: `undefined` ; `int104`: `undefined` ; `int112`: `undefined` ; `int120`: `undefined` ; `int128`: `undefined` ; `int136`: `undefined` ; `int144`: `undefined` ; `int152`: `undefined` ; `int16`: `undefined` ; `int160`: `undefined` ; `int168`: `undefined` ; `int176`: `undefined` ; `int184`: `undefined` ; `int192`: `undefined` ; `int200`: `undefined` ; `int208`: `undefined` ; `int216`: `undefined` ; `int224`: `undefined` ; `int232`: `undefined` ; `int24`: `undefined` ; `int240`: `undefined` ; `int248`: `undefined` ; `int256`: `undefined` ; `int32`: `undefined` ; `int40`: `undefined` ; `int48`: `undefined` ; `int56`: `undefined` ; `int64`: `undefined` ; `int72`: `undefined` ; `int8`: `undefined` ; `int80`: `undefined` ; `int88`: `undefined` ; `int96`: `undefined` ; `string`: `undefined` ; `uint104`: `undefined` ; `uint112`: `undefined` ; `uint120`: `undefined` ; `uint128`: `undefined` ; `uint136`: `undefined` ; `uint144`: `undefined` ; `uint152`: `undefined` ; `uint16`: `undefined` ; `uint160`: `undefined` ; `uint168`: `undefined` ; `uint176`: `undefined` ; `uint184`: `undefined` ; `uint192`: `undefined` ; `uint200`: `undefined` ; `uint208`: `undefined` ; `uint216`: `undefined` ; `uint224`: `undefined` ; `uint232`: `undefined` ; `uint24`: `undefined` ; `uint240`: `undefined` ; `uint248`: `undefined` ; `uint256`: `undefined` ; `uint32`: `undefined` ; `uint40`: `undefined` ; `uint48`: `undefined` ; `uint56`: `undefined` ; `uint64`: `undefined` ; `uint72`: `undefined` ; `uint8`: `undefined` ; `uint80`: `undefined` ; `uint88`: `undefined` ; `uint96`: `undefined`  } \| \{ `[key: string]`: `unknown`;  } |
| `TPrimaryType` | extends `string` = `string` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `TypedDataDefinition`\<`TTypedData`, `TPrimaryType`\> |

##### Returns

`Promise`\<\`0x$\{string}\`\>

#### Defined in

../../../node_modules/@alchemy/aa-core/dist/types/signer/types.d.ts:34

___

### signerType

• **signerType**: `string`

#### Defined in

../../../node_modules/@alchemy/aa-core/dist/types/signer/types.d.ts:30
