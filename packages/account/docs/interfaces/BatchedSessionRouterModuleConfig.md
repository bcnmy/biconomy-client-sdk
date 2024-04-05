[@biconomy/account](../README.md) / [Exports](../modules.md) / BatchedSessionRouterModuleConfig

# Interface: BatchedSessionRouterModuleConfig

## Hierarchy

- `BaseValidationModuleConfig`

  ↳ **`BatchedSessionRouterModuleConfig`**

## Table of contents

### Properties

- [entryPointAddress](BatchedSessionRouterModuleConfig.md#entrypointaddress)
- [moduleAddress](BatchedSessionRouterModuleConfig.md#moduleaddress)
- [sessionKeyManagerModule](BatchedSessionRouterModuleConfig.md#sessionkeymanagermodule)
- [sessionManagerModuleAddress](BatchedSessionRouterModuleConfig.md#sessionmanagermoduleaddress)
- [smartAccountAddress](BatchedSessionRouterModuleConfig.md#smartaccountaddress)
- [storageType](BatchedSessionRouterModuleConfig.md#storagetype)
- [version](BatchedSessionRouterModuleConfig.md#version)

## Properties

### entryPointAddress

• `Optional` **entryPointAddress**: \`0x$\{string}\`

entryPointAddress: address of the entry point

#### Inherited from

BaseValidationModuleConfig.entryPointAddress

#### Defined in

../../modules/dist/types/utils/Types.d.ts:9

___

### moduleAddress

• `Optional` **moduleAddress**: \`0x$\{string}\`

Address of the module

#### Defined in

../../modules/dist/types/utils/Types.d.ts:39

___

### sessionKeyManagerModule

• `Optional` **sessionKeyManagerModule**: `SessionKeyManagerModule`

Session Key Manager module: Could be BaseValidationModule

#### Defined in

../../modules/dist/types/utils/Types.d.ts:43

___

### sessionManagerModuleAddress

• `Optional` **sessionManagerModuleAddress**: \`0x$\{string}\`

Session Key Manager module address

#### Defined in

../../modules/dist/types/utils/Types.d.ts:45

___

### smartAccountAddress

• **smartAccountAddress**: `string`

Address of the associated smart account

#### Defined in

../../modules/dist/types/utils/Types.d.ts:47

___

### storageType

• `Optional` **storageType**: `LOCAL_STORAGE`

Storage type, e.g. local storage

#### Defined in

../../modules/dist/types/utils/Types.d.ts:49

___

### version

• `Optional` **version**: ``"V1_0_0"``

Version of the module

#### Defined in

../../modules/dist/types/utils/Types.d.ts:41
