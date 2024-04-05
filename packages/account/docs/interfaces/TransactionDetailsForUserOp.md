[@biconomy/account](../README.md) / [Exports](../modules.md) / TransactionDetailsForUserOp

# Interface: TransactionDetailsForUserOp

## Table of contents

### Properties

- [data](TransactionDetailsForUserOp.md#data)
- [gasLimit](TransactionDetailsForUserOp.md#gaslimit)
- [maxFeePerGas](TransactionDetailsForUserOp.md#maxfeepergas)
- [maxPriorityFeePerGas](TransactionDetailsForUserOp.md#maxpriorityfeepergas)
- [nonce](TransactionDetailsForUserOp.md#nonce)
- [target](TransactionDetailsForUserOp.md#target)
- [value](TransactionDetailsForUserOp.md#value)

## Properties

### data

• **data**: `string`

data: The data to send to the contract

#### Defined in

[utils/Types.ts:248](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L248)

___

### gasLimit

• `Optional` **gasLimit**: `number` \| `bigint` \| \`0x$\{string}\`

gasLimit: The gas limit to use for the transaction

#### Defined in

[utils/Types.ts:252](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L252)

___

### maxFeePerGas

• `Optional` **maxFeePerGas**: `number` \| `bigint` \| \`0x$\{string}\`

maxFeePerGas: The maximum fee per gas to use for the transaction

#### Defined in

[utils/Types.ts:254](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L254)

___

### maxPriorityFeePerGas

• `Optional` **maxPriorityFeePerGas**: `number` \| `bigint` \| \`0x$\{string}\`

maxPriorityFeePerGas: The maximum priority fee per gas to use for the transaction

#### Defined in

[utils/Types.ts:256](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L256)

___

### nonce

• `Optional` **nonce**: `number` \| `bigint` \| \`0x$\{string}\`

nonce: The nonce to use for the transaction

#### Defined in

[utils/Types.ts:258](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L258)

___

### target

• **target**: `string`

target: The address of the contract to call

#### Defined in

[utils/Types.ts:246](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L246)

___

### value

• `Optional` **value**: `number` \| `bigint` \| \`0x$\{string}\`

value: The value to send to the contract

#### Defined in

[utils/Types.ts:250](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L250)
