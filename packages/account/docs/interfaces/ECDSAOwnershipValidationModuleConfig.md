[@biconomy/account](../README.md) / [Exports](../modules.md) / ECDSAOwnershipValidationModuleConfig

# Interface: ECDSAOwnershipValidationModuleConfig

## Hierarchy

- `BaseValidationModuleConfig`

  ↳ **`ECDSAOwnershipValidationModuleConfig`**

## Table of contents

### Properties

- [entryPointAddress](ECDSAOwnershipValidationModuleConfig.md#entrypointaddress)
- [moduleAddress](ECDSAOwnershipValidationModuleConfig.md#moduleaddress)
- [signer](ECDSAOwnershipValidationModuleConfig.md#signer)
- [version](ECDSAOwnershipValidationModuleConfig.md#version)

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

../../modules/dist/types/utils/Types.d.ts:13

___

### signer

• **signer**: [`SupportedSigner`](../modules.md#supportedsigner)

Signer: viemWallet or ethers signer. Ingested when passed into smartAccount

#### Defined in

../../modules/dist/types/utils/Types.d.ts:17

___

### version

• `Optional` **version**: ``"V1_0_0"``

Version of the module

#### Defined in

../../modules/dist/types/utils/Types.d.ts:15
