[@biconomy/account](README.md) / Exports

# @biconomy/account

## Table of contents

### Enumerations

- [PaymasterMode](enums/PaymasterMode.md)

### Classes

- [BiconomySmartAccountV2](classes/BiconomySmartAccountV2.md)
- [Bundler](classes/Bundler.md)
- [EthersSigner](classes/EthersSigner.md)
- [LocalAccountSigner](classes/LocalAccountSigner.md)
- [Paymaster](classes/Paymaster.md)
- [WalletClientSigner](classes/WalletClientSigner.md)

### Interfaces

- [BalancePayload](interfaces/BalancePayload.md)
- [BatchedSessionRouterModuleConfig](interfaces/BatchedSessionRouterModuleConfig.md)
- [ECDSAOwnershipValidationModuleConfig](interfaces/ECDSAOwnershipValidationModuleConfig.md)
- [GasOverheads](interfaces/GasOverheads.md)
- [IBundler](interfaces/IBundler.md)
- [IHybridPaymaster](interfaces/IHybridPaymaster.md)
- [IPaymaster](interfaces/IPaymaster.md)
- [LightSigner](interfaces/LightSigner.md)
- [MultiChainValidationModuleConfig](interfaces/MultiChainValidationModuleConfig.md)
- [SessionKeyManagerModuleConfig](interfaces/SessionKeyManagerModuleConfig.md)
- [SessionValidationModuleConfig](interfaces/SessionValidationModuleConfig.md)
- [SmartAccountSigner](interfaces/SmartAccountSigner.md)
- [TransactionDetailsForUserOp](interfaces/TransactionDetailsForUserOp.md)

### Type Aliases

- [BaseSmartAccountConfig](modules.md#basesmartaccountconfig)
- [BiconomyFactories](modules.md#biconomyfactories)
- [BiconomyFactoriesByVersion](modules.md#biconomyfactoriesbyversion)
- [BiconomyImplementations](modules.md#biconomyimplementations)
- [BiconomyImplementationsByVersion](modules.md#biconomyimplementationsbyversion)
- [BiconomySmartAccountV2Config](modules.md#biconomysmartaccountv2config)
- [BiconomySmartAccountV2ConfigBaseProps](modules.md#biconomysmartaccountv2configbaseprops)
- [BiconomySmartAccountV2ConfigConstructorProps](modules.md#biconomysmartaccountv2configconstructorprops)
- [BiconomyTokenPaymasterRequest](modules.md#biconomytokenpaymasterrequest)
- [BuildUserOpOptions](modules.md#builduseropoptions)
- [ConditionalBundlerProps](modules.md#conditionalbundlerprops)
- [ConditionalValidationProps](modules.md#conditionalvalidationprops)
- [CounterFactualAddressParam](modules.md#counterfactualaddressparam)
- [EntryPointAddresses](modules.md#entrypointaddresses)
- [EntryPointAddressesByVersion](modules.md#entrypointaddressesbyversion)
- [EstimateUserOpGasParams](modules.md#estimateuseropgasparams)
- [FeeQuotesOrDataResponse](modules.md#feequotesordataresponse)
- [InitializeV2Data](modules.md#initializev2data)
- [InitilizationData](modules.md#initilizationdata)
- [NonceOptions](modules.md#nonceoptions)
- [Overrides](modules.md#overrides)
- [PaymasterFeeQuote](modules.md#paymasterfeequote)
- [PaymasterUserOperationDto](modules.md#paymasteruseroperationdto)
- [QueryParamsForAddressResolver](modules.md#queryparamsforaddressresolver)
- [RequireAtLeastOne](modules.md#requireatleastone)
- [ResolvedBundlerProps](modules.md#resolvedbundlerprops)
- [ResolvedValidationProps](modules.md#resolvedvalidationprops)
- [SimulationType](modules.md#simulationtype)
- [SmartAccountConfig](modules.md#smartaccountconfig)
- [SmartAccountInfo](modules.md#smartaccountinfo)
- [SmartWalletConfig](modules.md#smartwalletconfig)
- [SponsorUserOperationDto](modules.md#sponsoruseroperationdto)
- [SupportedSigner](modules.md#supportedsigner)
- [SupportedToken](modules.md#supportedtoken)
- [Transaction](modules.md#transaction)
- [UserOpReceipt](modules.md#useropreceipt)
- [UserOpResponse](modules.md#useropresponse)
- [UserOpStatus](modules.md#useropstatus)
- [ValueOrData](modules.md#valueordata)

### Variables

- [ADDRESS\_RESOLVER\_ADDRESS](modules.md#address_resolver_address)
- [ADDRESS\_ZERO](modules.md#address_zero)
- [BICONOMY\_FACTORY\_ADDRESSES](modules.md#biconomy_factory_addresses)
- [BICONOMY\_FACTORY\_ADDRESSES\_BY\_VERSION](modules.md#biconomy_factory_addresses_by_version)
- [BICONOMY\_IMPLEMENTATION\_ADDRESSES](modules.md#biconomy_implementation_addresses)
- [BICONOMY\_IMPLEMENTATION\_ADDRESSES\_BY\_VERSION](modules.md#biconomy_implementation_addresses_by_version)
- [DEFAULT\_BATCHED\_SESSION\_ROUTER\_MODULE](modules.md#default_batched_session_router_module)
- [DEFAULT\_BICONOMY\_FACTORY\_ADDRESS](modules.md#default_biconomy_factory_address)
- [DEFAULT\_BICONOMY\_IMPLEMENTATION\_ADDRESS](modules.md#default_biconomy_implementation_address)
- [DEFAULT\_ECDSA\_OWNERSHIP\_MODULE](modules.md#default_ecdsa_ownership_module)
- [DEFAULT\_ENTRYPOINT\_ADDRESS](modules.md#default_entrypoint_address)
- [DEFAULT\_FALLBACK\_HANDLER\_ADDRESS](modules.md#default_fallback_handler_address)
- [DEFAULT\_MULTICHAIN\_MODULE](modules.md#default_multichain_module)
- [DEFAULT\_SESSION\_KEY\_MANAGER\_MODULE](modules.md#default_session_key_manager_module)
- [DefaultGasLimit](modules.md#defaultgaslimit)
- [EIP1559\_UNSUPPORTED\_NETWORKS](modules.md#eip1559_unsupported_networks)
- [ENTRYPOINT\_ADDRESSES](modules.md#entrypoint_addresses)
- [ENTRYPOINT\_ADDRESSES\_BY\_VERSION](modules.md#entrypoint_addresses_by_version)
- [ERC20\_ABI](modules.md#erc20_abi)
- [ERROR\_MESSAGES](modules.md#error_messages)
- [NATIVE\_TOKEN\_ALIAS](modules.md#native_token_alias)
- [PROXY\_CREATION\_CODE](modules.md#proxy_creation_code)

### Functions

- [addressEquals](modules.md#addressequals)
- [compareChainIds](modules.md#comparechainids)
- [convertSigner](modules.md#convertsigner)
- [createBatchedSessionRouterModule](modules.md#createbatchedsessionroutermodule)
- [createBundler](modules.md#createbundler)
- [createECDSAOwnershipValidationModule](modules.md#createecdsaownershipvalidationmodule)
- [createERC20SessionValidationModule](modules.md#createerc20sessionvalidationmodule)
- [createMultiChainValidationModule](modules.md#createmultichainvalidationmodule)
- [createPaymaster](modules.md#createpaymaster)
- [createSessionKeyManagerModule](modules.md#createsessionkeymanagermodule)
- [createSmartAccountClient](modules.md#createsmartaccountclient)
- [extractChainIdFromBundlerUrl](modules.md#extractchainidfrombundlerurl)
- [getChain](modules.md#getchain)
- [isNullOrUndefined](modules.md#isnullorundefined)
- [isValidRpcUrl](modules.md#isvalidrpcurl)
- [packUserOp](modules.md#packuserop)

## Type Aliases

### BaseSmartAccountConfig

Ƭ **BaseSmartAccountConfig**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountAddress?` | `string` | accountAddress: address of the smart account, potentially counterfactual |
| `chainId?` | `number` | chainId: chainId of the network |
| `entryPointAddress?` | `string` | entryPointAddress: address of the smart account entry point |
| `index?` | `number` | index: helps to not conflict with other smart account instances |
| `overheads?` | `Partial`\<[`GasOverheads`](interfaces/GasOverheads.md)\> | overheads: [GasOverheads](interfaces/GasOverheads.md) |
| `paymaster?` | [`IPaymaster`](interfaces/IPaymaster.md) | paymaster: [IPaymaster](interfaces/IPaymaster.md) interface |
| `provider?` | `WalletClient` | provider: WalletClientSigner from viem |

#### Defined in

[utils/Types.ts:59](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L59)

___

### BiconomyFactories

Ƭ **BiconomyFactories**: `Record`\<`string`, `string`\>

#### Defined in

[utils/Types.ts:16](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L16)

___

### BiconomyFactoriesByVersion

Ƭ **BiconomyFactoriesByVersion**: `Record`\<`string`, `string`\>

#### Defined in

[utils/Types.ts:19](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L19)

___

### BiconomyImplementations

Ƭ **BiconomyImplementations**: `Record`\<`string`, `string`\>

#### Defined in

[utils/Types.ts:17](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L17)

___

### BiconomyImplementationsByVersion

Ƭ **BiconomyImplementationsByVersion**: `Record`\<`string`, `string`\>

#### Defined in

[utils/Types.ts:20](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L20)

___

### BiconomySmartAccountV2Config

Ƭ **BiconomySmartAccountV2Config**: [`BiconomySmartAccountV2ConfigBaseProps`](modules.md#biconomysmartaccountv2configbaseprops) & [`BaseSmartAccountConfig`](modules.md#basesmartaccountconfig) & [`ConditionalBundlerProps`](modules.md#conditionalbundlerprops) & [`ConditionalValidationProps`](modules.md#conditionalvalidationprops)

#### Defined in

[utils/Types.ts:145](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L145)

___

### BiconomySmartAccountV2ConfigBaseProps

Ƭ **BiconomySmartAccountV2ConfigBaseProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `activeValidationModule?` | `BaseValidationModule` | activeValidationModule: The active validation module. Will default to the defaultValidationModule |
| `biconomyPaymasterApiKey?` | `string` | biconomyPaymasterApiKey: The API key retrieved from the Biconomy dashboard |
| `defaultFallbackHandler?` | `Hex` | defaultFallbackHandler: override the default fallback contract address |
| `factoryAddress?` | `Hex` | Factory address of biconomy factory contract or some other contract you have deployed on chain |
| `implementationAddress?` | `Hex` | implementation of smart contract address or some other contract you have deployed and want to override |
| `maxIndexForScan?` | `number` | the index of SA the EOA have generated and till which indexes the upgraded SA should scan |
| `paymasterUrl?` | `string` | paymasterUrl: The Paymaster URL retrieved from the Biconomy dashboard |
| `rpcUrl?` | `string` | rpcUrl: Rpc url, optional, we set default rpc url if not passed. |
| `scanForUpgradedAccountsFromV1?` | `boolean` | scanForUpgradedAccountsFromV1: set to true if you you want the userwho was using biconomy SA v1 to upgrade to biconomy SA v2 |
| `senderAddress?` | `Hex` | Sender address: If you want to override the Signer address with some other address and get counterfactual address can use this to pass the EOA and get SA address |
| `viemChain?` | `Chain` | Can be used to optionally override the chain with a custom chain if it doesn't already exist in viems list of supported chains |

#### Defined in

[utils/Types.ts:121](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L121)

___

### BiconomySmartAccountV2ConfigConstructorProps

Ƭ **BiconomySmartAccountV2ConfigConstructorProps**: [`BiconomySmartAccountV2ConfigBaseProps`](modules.md#biconomysmartaccountv2configbaseprops) & [`BaseSmartAccountConfig`](modules.md#basesmartaccountconfig) & [`ResolvedBundlerProps`](modules.md#resolvedbundlerprops) & [`ResolvedValidationProps`](modules.md#resolvedvalidationprops)

#### Defined in

[utils/Types.ts:150](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L150)

___

### BiconomyTokenPaymasterRequest

Ƭ **BiconomyTokenPaymasterRequest**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `feeQuote` | [`PaymasterFeeQuote`](modules.md#paymasterfeequote) | feeQuote: [PaymasterFeeQuote](modules.md#paymasterfeequote) |
| `maxApproval?` | `boolean` | maxApproval: If set to true, the paymaster will approve the maximum amount of tokens required for the transaction. Not recommended |
| `skipPatchCallData?` | `boolean` | - |
| `spender` | `Hex` | spender: The address of the spender who is paying for the transaction, this can usually be set to feeQuotesResponse.tokenPaymasterAddress |

#### Defined in

[utils/Types.ts:76](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L76)

___

### BuildUserOpOptions

Ƭ **BuildUserOpOptions**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `forceEncodeForBatch?` | `boolean` | forceEncodeForBatch: For encoding the user operation for batch |
| `nonceOptions?` | [`NonceOptions`](modules.md#nonceoptions) | nonceOptions: For overriding the nonce |
| `params?` | `ModuleInfo` | params relevant to the module, mostly relevant to sessions |
| `paymasterServiceData?` | [`PaymasterUserOperationDto`](modules.md#paymasteruseroperationdto) | paymasterServiceData: Options specific to transactions that involve a paymaster |
| `simulationType?` | [`SimulationType`](modules.md#simulationtype) | simulationType: Determine which parts of the tx a bundler will simulate: "validation" \| "validation_and_execution". |
| `stateOverrideSet?` | `StateOverrideSet` | stateOverrideSet: For overriding the state |
| `useEmptyDeployCallData?` | `boolean` | set to true if the tx is being used *only* to deploy the smartContract, so "0x" is set as the userOp.callData |

#### Defined in

[utils/Types.ts:155](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L155)

___

### ConditionalBundlerProps

Ƭ **ConditionalBundlerProps**: [`RequireAtLeastOne`](modules.md#requireatleastone)\<\{ `bundler`: [`IBundler`](interfaces/IBundler.md) ; `bundlerUrl`: `string`  }, ``"bundler"`` \| ``"bundlerUrl"``\>

#### Defined in

[utils/Types.ts:92](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L92)

___

### ConditionalValidationProps

Ƭ **ConditionalValidationProps**: [`RequireAtLeastOne`](modules.md#requireatleastone)\<\{ `defaultValidationModule`: `BaseValidationModule` ; `signer`: [`SupportedSigner`](modules.md#supportedsigner)  }, ``"defaultValidationModule"`` \| ``"signer"``\>

#### Defined in

[utils/Types.ts:102](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L102)

___

### CounterFactualAddressParam

Ƭ **CounterFactualAddressParam**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `index?` | `number` | - |
| `maxIndexForScan?` | `number` | the index of SA the EOA have generated and till which indexes the upgraded SA should scan |
| `scanForUpgradedAccountsFromV1?` | `boolean` | scanForUpgradedAccountsFromV1: set to true if you you want the userwho was using biconomy SA v1 to upgrade to biconomy SA v2 |
| `validationModule?` | `BaseValidationModule` | - |

#### Defined in

[utils/Types.ts:261](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L261)

___

### EntryPointAddresses

Ƭ **EntryPointAddresses**: `Record`\<`string`, `string`\>

#### Defined in

[utils/Types.ts:15](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L15)

___

### EntryPointAddressesByVersion

Ƭ **EntryPointAddressesByVersion**: `Record`\<`string`, `string`\>

#### Defined in

[utils/Types.ts:18](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L18)

___

### EstimateUserOpGasParams

Ƭ **EstimateUserOpGasParams**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `paymasterServiceData?` | [`SponsorUserOperationDto`](modules.md#sponsoruseroperationdto) | paymasterServiceData: Options specific to transactions that involve a paymaster |
| `userOp` | `Partial`\<`UserOperationStruct`\> | - |

#### Defined in

[utils/Types.ts:235](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L235)

___

### FeeQuotesOrDataResponse

Ƭ **FeeQuotesOrDataResponse**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `callGasLimit?` | `BigNumberish` | - |
| `feeQuotes?` | [`PaymasterFeeQuote`](modules.md#paymasterfeequote)[] | Array of results from the paymaster |
| `paymasterAndData?` | `Uint8Array` \| `Hex` | Relevant Data returned from the paymaster |
| `preVerificationGas?` | `BigNumberish` | - |
| `tokenPaymasterAddress?` | `Hex` | Normally set to the spender in the proceeding call to send the tx |
| `verificationGasLimit?` | `BigNumberish` | - |

#### Defined in

../../paymaster/dist/types/utils/Types.d.ts:99

___

### InitializeV2Data

Ƭ **InitializeV2Data**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `accountIndex?` | `number` |

#### Defined in

[utils/Types.ts:231](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L231)

___

### InitilizationData

Ƭ **InitilizationData**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `accountIndex?` | `number` |
| `signerAddress?` | `string` |

#### Defined in

[utils/Types.ts:202](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L202)

___

### NonceOptions

Ƭ **NonceOptions**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `nonceKey?` | `number` | nonceKey: The key to use for nonce |
| `nonceOverride?` | `number` | nonceOverride: The nonce to use for the transaction |

#### Defined in

[utils/Types.ts:176](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L176)

___

### Overrides

Ƭ **Overrides**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `callGasLimit?` | `Hex` |
| `maxFeePerGas?` | `Hex` |
| `maxPriorityFeePerGas?` | `Hex` |
| `paymasterData?` | `Hex` |
| `preVerificationGas?` | `Hex` |
| `signature?` | `Hex` |
| `verificationGasLimit?` | `Hex` |

#### Defined in

[utils/Types.ts:185](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L185)

___

### PaymasterFeeQuote

Ƭ **PaymasterFeeQuote**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `decimal` | `number` | decimal: Token decimal |
| `logoUrl?` | `string` | - |
| `maxGasFee` | `number` | maxGasFee: in wei |
| `maxGasFeeUSD?` | `number` | maxGasFee: in dollars |
| `premiumPercentage` | `number` | The premium paid on the token |
| `symbol` | `string` | symbol: Token symbol |
| `tokenAddress` | `string` | tokenAddress: Token address |
| `usdPayment?` | `number` | - |
| `validUntil?` | `number` | validUntil: Unix timestamp |

#### Defined in

../../paymaster/dist/types/utils/Types.d.ts:72

___

### PaymasterUserOperationDto

Ƭ **PaymasterUserOperationDto**: [`SponsorUserOperationDto`](modules.md#sponsoruseroperationdto) & `FeeQuotesOrDataDto` & \{ `calculateGasLimits?`: `boolean` ; `expiryDuration?`: `number` ; `feeQuote?`: [`PaymasterFeeQuote`](modules.md#paymasterfeequote) ; `feeTokenAddress?`: `string` ; `maxApproval?`: `boolean` ; `mode`: [`PaymasterMode`](enums/PaymasterMode.md) ; `skipPatchCallData?`: `boolean` ; `smartAccountInfo?`: `SmartAccountData` ; `spender?`: `Hex` ; `webhookData?`: `Record`\<`string`, `any`\>  }

#### Defined in

[utils/Types.ts:207](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L207)

___

### QueryParamsForAddressResolver

Ƭ **QueryParamsForAddressResolver**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `eoaAddress` | `Hex` |
| `index` | `number` |
| `maxIndexForScan?` | `number` |
| `moduleAddress` | `Hex` |
| `moduleSetupData` | `Hex` |

#### Defined in

[utils/Types.ts:270](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L270)

___

### RequireAtLeastOne

Ƭ **RequireAtLeastOne**\<`T`, `Keys`\>: `Pick`\<`T`, `Exclude`\<keyof `T`, `Keys`\>\> & \{ [K in Keys]-?: Required\<Pick\<T, K\>\> & Partial\<Pick\<T, Exclude\<Keys, K\>\>\> }[`Keys`]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `T` |
| `Keys` | extends keyof `T` = keyof `T` |

#### Defined in

[utils/Types.ts:87](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L87)

___

### ResolvedBundlerProps

Ƭ **ResolvedBundlerProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `bundler` | [`IBundler`](interfaces/IBundler.md) |

#### Defined in

[utils/Types.ts:99](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L99)

___

### ResolvedValidationProps

Ƭ **ResolvedValidationProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `activeValidationModule` | `BaseValidationModule` | activeValidationModule: BaseValidationModule. The active validation module. Will default to the defaultValidationModule |
| `chainId` | `number` | chainId: chainId of the network |
| `defaultValidationModule` | `BaseValidationModule` | defaultValidationModule: BaseValidationModule |
| `signer` | [`SmartAccountSigner`](interfaces/SmartAccountSigner.md) | signer: ethers Wallet, viemWallet or alchemys SmartAccountSigner |

#### Defined in

[utils/Types.ts:110](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L110)

___

### SimulationType

Ƭ **SimulationType**: ``"validation"`` \| ``"validation_and_execution"``

#### Defined in

[utils/Types.ts:183](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L183)

___

### SmartAccountConfig

Ƭ **SmartAccountConfig**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `bundler?` | [`IBundler`](interfaces/IBundler.md) | factoryAddress: address of the smart account factory |
| `entryPointAddress` | `string` | entryPointAddress: address of the entry point |

#### Defined in

[utils/Types.ts:22](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L22)

___

### SmartAccountInfo

Ƭ **SmartAccountInfo**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountAddress` | `Hex` | accountAddress: The address of the smart account |
| `currentImplementation` | `string` | currentImplementation: The address of the current implementation |
| `currentVersion` | `string` | currentVersion: The version of the smart account |
| `deploymentIndex` | `BigNumberish` | deploymentIndex: The index of the deployment |
| `factoryAddress` | `Hex` | factoryAddress: The address of the smart account factory |
| `factoryVersion` | `string` | factoryVersion: The version of the factory |

#### Defined in

[utils/Types.ts:278](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L278)

___

### SmartWalletConfig

Ƭ **SmartWalletConfig**: [`BiconomySmartAccountV2Config`](modules.md#biconomysmartaccountv2config)

#### Defined in

[index.ts:49](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/index.ts#L49)

___

### SponsorUserOperationDto

Ƭ **SponsorUserOperationDto**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `calculateGasLimits?` | `boolean` | Always recommended, especially when using token paymaster |
| `expiryDuration?` | `number` | Expiry duration in seconds |
| `feeTokenAddress?` | `string` | the fee-paying token address |
| `mode` | [`PaymasterMode`](enums/PaymasterMode.md) | mode: sponsored or erc20 |
| `smartAccountInfo?` | `SmartAccountData` | Smart account meta data |
| `webhookData?` | `Record`\<`string`, `any`\> | Webhooks to be fired after user op is sent |

#### Defined in

../../paymaster/dist/types/utils/Types.d.ts:23

___

### SupportedSigner

Ƭ **SupportedSigner**: [`SmartAccountSigner`](interfaces/SmartAccountSigner.md) \| `WalletClient` \| `Signer` \| [`LightSigner`](interfaces/LightSigner.md)

#### Defined in

../../common/dist/types/utils/Types.d.ts:5

___

### SupportedToken

Ƭ **SupportedToken**: `Omit`\<[`PaymasterFeeQuote`](modules.md#paymasterfeequote), ``"maxGasFeeUSD"`` \| ``"usdPayment"`` \| ``"maxGasFee"`` \| ``"validUntil"``\>

#### Defined in

[utils/Types.ts:304](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L304)

___

### Transaction

Ƭ **Transaction**: \{ `to`: `string`  } & [`ValueOrData`](modules.md#valueordata)

#### Defined in

[utils/Types.ts:300](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L300)

___

### UserOpReceipt

Ƭ **UserOpReceipt**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `actualGasCost` | `Hex` |
| `actualGasUsed` | `Hex` |
| `entryPoint` | `string` |
| `logs` | `any`[] |
| `paymaster` | `string` |
| `reason` | `string` |
| `receipt` | `any` |
| `success` | ``"true"`` \| ``"false"`` |
| `userOpHash` | `string` |

#### Defined in

../../bundler/dist/types/utils/Types.d.ts:25

___

### UserOpResponse

Ƭ **UserOpResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `userOpHash` | `string` |
| `wait` | (`_confirmations?`: `number`) => `Promise`\<[`UserOpReceipt`](modules.md#useropreceipt)\> |
| `waitForTxHash` | () => `Promise`\<[`UserOpStatus`](modules.md#useropstatus)\> |

#### Defined in

../../bundler/dist/types/utils/Types.d.ts:60

___

### UserOpStatus

Ƭ **UserOpStatus**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `state` | `string` |
| `transactionHash?` | `string` |
| `userOperationReceipt?` | [`UserOpReceipt`](modules.md#useropreceipt) |

#### Defined in

../../bundler/dist/types/utils/Types.d.ts:36

___

### ValueOrData

Ƭ **ValueOrData**: [`RequireAtLeastOne`](modules.md#requireatleastone)\<\{ `data`: `string` ; `value`: `BigNumberish` \| `string`  }, ``"value"`` \| ``"data"``\>

#### Defined in

[utils/Types.ts:293](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Types.ts#L293)

## Variables

### ADDRESS\_RESOLVER\_ADDRESS

• `Const` **ADDRESS\_RESOLVER\_ADDRESS**: ``"0x00000E81673606e07fC79CE5F1b3B26957844468"``

#### Defined in

[utils/Constants.ts:52](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L52)

___

### ADDRESS\_ZERO

• `Const` **ADDRESS\_ZERO**: ``"0x0000000000000000000000000000000000000000"``

#### Defined in

[utils/Constants.ts:10](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L10)

___

### BICONOMY\_FACTORY\_ADDRESSES

• `Const` **BICONOMY\_FACTORY\_ADDRESSES**: [`BiconomyFactories`](modules.md#biconomyfactories)

#### Defined in

[utils/Constants.ts:22](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L22)

___

### BICONOMY\_FACTORY\_ADDRESSES\_BY\_VERSION

• `Const` **BICONOMY\_FACTORY\_ADDRESSES\_BY\_VERSION**: [`BiconomyFactoriesByVersion`](modules.md#biconomyfactoriesbyversion)

#### Defined in

[utils/Constants.ts:39](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L39)

___

### BICONOMY\_IMPLEMENTATION\_ADDRESSES

• `Const` **BICONOMY\_IMPLEMENTATION\_ADDRESSES**: [`BiconomyImplementations`](modules.md#biconomyimplementations)

#### Defined in

[utils/Constants.ts:29](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L29)

___

### BICONOMY\_IMPLEMENTATION\_ADDRESSES\_BY\_VERSION

• `Const` **BICONOMY\_IMPLEMENTATION\_ADDRESSES\_BY\_VERSION**: [`BiconomyImplementationsByVersion`](modules.md#biconomyimplementationsbyversion)

#### Defined in

[utils/Constants.ts:43](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L43)

___

### DEFAULT\_BATCHED\_SESSION\_ROUTER\_MODULE

• `Const` **DEFAULT\_BATCHED\_SESSION\_ROUTER\_MODULE**: ``"0x00000D09967410f8C76752A104c9848b57ebba55"``

#### Defined in

../../modules/dist/types/utils/Constants.d.ts:21

___

### DEFAULT\_BICONOMY\_FACTORY\_ADDRESS

• `Const` **DEFAULT\_BICONOMY\_FACTORY\_ADDRESS**: ``"0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5"``

#### Defined in

[utils/Constants.ts:20](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L20)

___

### DEFAULT\_BICONOMY\_IMPLEMENTATION\_ADDRESS

• `Const` **DEFAULT\_BICONOMY\_IMPLEMENTATION\_ADDRESS**: ``"0x0000002512019Dafb59528B82CB92D3c5D2423aC"``

#### Defined in

[utils/Constants.ts:28](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L28)

___

### DEFAULT\_ECDSA\_OWNERSHIP\_MODULE

• `Const` **DEFAULT\_ECDSA\_OWNERSHIP\_MODULE**: ``"0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e"``

#### Defined in

../../modules/dist/types/utils/Constants.d.ts:12

___

### DEFAULT\_ENTRYPOINT\_ADDRESS

• `Const` **DEFAULT\_ENTRYPOINT\_ADDRESS**: ``"0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789"``

#### Defined in

[utils/Constants.ts:13](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L13)

___

### DEFAULT\_FALLBACK\_HANDLER\_ADDRESS

• `Const` **DEFAULT\_FALLBACK\_HANDLER\_ADDRESS**: ``"0x0bBa6d96BD616BedC6BFaa341742FD43c60b83C1"``

#### Defined in

[utils/Constants.ts:21](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L21)

___

### DEFAULT\_MULTICHAIN\_MODULE

• `Const` **DEFAULT\_MULTICHAIN\_MODULE**: ``"0x000000824dc138db84FD9109fc154bdad332Aa8E"``

#### Defined in

../../modules/dist/types/utils/Constants.d.ts:26

___

### DEFAULT\_SESSION\_KEY\_MANAGER\_MODULE

• `Const` **DEFAULT\_SESSION\_KEY\_MANAGER\_MODULE**: ``"0x000002FbFfedd9B33F4E7156F2DE8D48945E7489"``

#### Defined in

../../modules/dist/types/utils/Constants.d.ts:16

___

### DefaultGasLimit

• `Const` **DefaultGasLimit**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `callGasLimit` | `number` |
| `preVerificationGas` | `number` |
| `verificationGasLimit` | `number` |

#### Defined in

[utils/Constants.ts:54](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L54)

___

### EIP1559\_UNSUPPORTED\_NETWORKS

• `Const` **EIP1559\_UNSUPPORTED\_NETWORKS**: `number`[]

#### Defined in

[utils/Constants.ts:47](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L47)

___

### ENTRYPOINT\_ADDRESSES

• `Const` **ENTRYPOINT\_ADDRESSES**: [`EntryPointAddresses`](modules.md#entrypointaddresses)

#### Defined in

[utils/Constants.ts:14](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L14)

___

### ENTRYPOINT\_ADDRESSES\_BY\_VERSION

• `Const` **ENTRYPOINT\_ADDRESSES\_BY\_VERSION**: [`EntryPointAddressesByVersion`](modules.md#entrypointaddressesbyversion)

#### Defined in

[utils/Constants.ts:34](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L34)

___

### ERC20\_ABI

• `Const` **ERC20\_ABI**: `string`[]

#### Defined in

[utils/Constants.ts:70](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L70)

___

### ERROR\_MESSAGES

• `Const` **ERROR\_MESSAGES**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `ACCOUNT_ALREADY_DEPLOYED` | `string` |
| `CHAIN_NOT_FOUND` | `string` |
| `FAILED_FEE_QUOTE_FETCH` | `string` |
| `NO_FEE_QUOTE` | `string` |
| `NO_NATIVE_TOKEN_BALANCE_DURING_DEPLOY` | `string` |
| `SPENDER_REQUIRED` | `string` |

#### Defined in

[utils/Constants.ts:60](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L60)

___

### NATIVE\_TOKEN\_ALIAS

• `Const` **NATIVE\_TOKEN\_ALIAS**: ``"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"``

#### Defined in

[utils/Constants.ts:69](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L69)

___

### PROXY\_CREATION\_CODE

• `Const` **PROXY\_CREATION\_CODE**: ``"0x6080346100aa57601f61012038819003918201601f19168301916001600160401b038311848410176100af578084926020946040528339810103126100aa57516001600160a01b0381168082036100aa5715610065573055604051605a90816100c68239f35b60405162461bcd60e51b815260206004820152601e60248201527f496e76616c696420696d706c656d656e746174696f6e206164647265737300006044820152606490fd5b600080fd5b634e487b7160e01b600052604160045260246000fdfe608060405230546000808092368280378136915af43d82803e156020573d90f35b3d90fdfea2646970667358221220a03b18dce0be0b4c9afe58a9eb85c35205e2cf087da098bbf1d23945bf89496064736f6c63430008110033"``

#### Defined in

[utils/Constants.ts:49](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Constants.ts#L49)

## Functions

### addressEquals

▸ **addressEquals**(`a?`, `b?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `a?` | `string` |
| `b?` | `string` |

#### Returns

`boolean`

#### Defined in

[utils/Utils.ts:89](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Utils.ts#L89)

___

### compareChainIds

▸ **compareChainIds**(`signer`, `biconomySmartAccountConfig`, `skipChainIdCalls`): `Promise`\<`void` \| `Error`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `signer` | [`SupportedSigner`](modules.md#supportedsigner) |
| `biconomySmartAccountConfig` | [`BiconomySmartAccountV2Config`](modules.md#biconomysmartaccountv2config) |
| `skipChainIdCalls` | `boolean` |

#### Returns

`Promise`\<`void` \| `Error`\>

#### Defined in

[utils/Utils.ts:53](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Utils.ts#L53)

___

### convertSigner

▸ **convertSigner**(`signer`, `skipChainIdCalls?`): `Promise`\<`SmartAccountResult`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `signer` | [`SupportedSigner`](modules.md#supportedsigner) |
| `skipChainIdCalls?` | `boolean` |

#### Returns

`Promise`\<`SmartAccountResult`\>

#### Defined in

../../common/dist/types/utils/Helpers/convertSigner.d.ts:8

___

### createBatchedSessionRouterModule

▸ **createBatchedSessionRouterModule**(`moduleConfig`): `Promise`\<`BatchedSessionRouterModule`\>

Asynchronously creates and initializes an instance of SessionKeyManagerModule

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `moduleConfig` | [`BatchedSessionRouterModuleConfig`](interfaces/BatchedSessionRouterModuleConfig.md) | The configuration for the module |

#### Returns

`Promise`\<`BatchedSessionRouterModule`\>

A Promise that resolves to an instance of SessionKeyManagerModule

#### Defined in

../../modules/dist/types/index.d.ts:12

___

### createBundler

▸ **createBundler**(`config`): `Promise`\<[`Bundler`](classes/Bundler.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | `Bundlerconfig` |

#### Returns

`Promise`\<[`Bundler`](classes/Bundler.md)\>

#### Defined in

../../bundler/dist/types/index.d.ts:6

___

### createECDSAOwnershipValidationModule

▸ **createECDSAOwnershipValidationModule**(`moduleConfig`): `Promise`\<`ECDSAOwnershipValidationModule`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `moduleConfig` | [`ECDSAOwnershipValidationModuleConfig`](interfaces/ECDSAOwnershipValidationModuleConfig.md) |

#### Returns

`Promise`\<`ECDSAOwnershipValidationModule`\>

#### Defined in

../../modules/dist/types/index.d.ts:14

___

### createERC20SessionValidationModule

▸ **createERC20SessionValidationModule**(`moduleConfig`): `Promise`\<`ERC20SessionValidationModule`\>

Asynchronously creates and initializes an instance of ERC20SessionValidationModule

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `moduleConfig` | [`SessionValidationModuleConfig`](interfaces/SessionValidationModuleConfig.md) | The configuration for the module |

#### Returns

`Promise`\<`ERC20SessionValidationModule`\>

A Promise that resolves to an instance of ERC20SessionValidationModule

#### Defined in

../../modules/dist/types/index.d.ts:16

___

### createMultiChainValidationModule

▸ **createMultiChainValidationModule**(`moduleConfig`): `Promise`\<`MultiChainValidationModule`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `moduleConfig` | [`MultiChainValidationModuleConfig`](interfaces/MultiChainValidationModuleConfig.md) |

#### Returns

`Promise`\<`MultiChainValidationModule`\>

#### Defined in

../../modules/dist/types/index.d.ts:13

___

### createPaymaster

▸ **createPaymaster**(`config`): `Promise`\<[`Paymaster`](classes/Paymaster.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | `PaymasterConfig` |

#### Returns

`Promise`\<[`Paymaster`](classes/Paymaster.md)\>

#### Defined in

../../paymaster/dist/types/index.d.ts:7

___

### createSessionKeyManagerModule

▸ **createSessionKeyManagerModule**(`moduleConfig`): `Promise`\<`SessionKeyManagerModule`\>

Asynchronously creates and initializes an instance of SessionKeyManagerModule

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `moduleConfig` | [`SessionKeyManagerModuleConfig`](interfaces/SessionKeyManagerModuleConfig.md) | The configuration for the module |

#### Returns

`Promise`\<`SessionKeyManagerModule`\>

A Promise that resolves to an instance of SessionKeyManagerModule

#### Defined in

../../modules/dist/types/index.d.ts:15

___

### createSmartAccountClient

▸ **createSmartAccountClient**(`biconomySmartAccountConfig`): `Promise`\<[`BiconomySmartAccountV2`](classes/BiconomySmartAccountV2.md)\>

Creates a new instance of BiconomySmartAccountV2

This method will create a BiconomySmartAccountV2 instance but will not deploy the Smart Account
Deployment of the Smart Account will be donewith the first user operation.

- Docs: https://docs.biconomy.io/Account/integration#integration-1

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `biconomySmartAccountConfig` | [`BiconomySmartAccountV2Config`](modules.md#biconomysmartaccountv2config) | Configuration for initializing the BiconomySmartAccountV2 instance. |

#### Returns

`Promise`\<[`BiconomySmartAccountV2`](classes/BiconomySmartAccountV2.md)\>

A promise that resolves to a new instance of BiconomySmartAccountV2.

**`Throws`**

An error if something is wrong with the smart account instance creation.

**`Example`**

```ts
import { createClient } from "viem"
import { createSmartAccountClient, BiconomySmartAccountV2 } from "@biconomy/account"
import { createWalletClient, http } from "viem";
import { polygonMumbai } from "viem/chains";

const signer = createWalletClient({
  account,
  chain: polygonMumbai,
  transport: http(),
});

const bundlerUrl = "" // Retrieve bundler url from dasboard

const smartAccountFromStaticCreate = await BiconomySmartAccountV2.create({ signer, bundlerUrl });

// Is the same as...

const smartAccount = await createSmartAccountClient({ signer, bundlerUrl });
```

#### Defined in

[index.ts:47](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/index.ts#L47)

___

### extractChainIdFromBundlerUrl

▸ **extractChainIdFromBundlerUrl**(`url`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |

#### Returns

`number`

#### Defined in

../../bundler/dist/types/utils/Utils.d.ts:1

___

### getChain

▸ **getChain**(`chainId`): `Chain`

Utility method for converting a chainId to a Chain object

#### Parameters

| Name | Type |
| :------ | :------ |
| `chainId` | `number` |

#### Returns

`Chain`

a Chain object for the given chainId

**`Throws`**

if the chainId is not found

#### Defined in

[utils/Utils.ts:98](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Utils.ts#L98)

___

### isNullOrUndefined

▸ **isNullOrUndefined**(`value`): value is undefined

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `any` |

#### Returns

value is undefined

#### Defined in

[utils/Utils.ts:49](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Utils.ts#L49)

___

### isValidRpcUrl

▸ **isValidRpcUrl**(`url`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |

#### Returns

`boolean`

#### Defined in

[utils/Utils.ts:84](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Utils.ts#L84)

___

### packUserOp

▸ **packUserOp**(`op`, `forSignature?`): `string`

pack the userOperation

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `op` | `Partial`\<`UserOperationStruct`\> | `undefined` |  |
| `forSignature` | `boolean` | `true` | "true" if the hash is needed to calculate the getUserOpHash() "false" to pack entire UserOp, for calculating the calldata cost of putting it on-chain. |

#### Returns

`string`

#### Defined in

[utils/Utils.ts:16](https://github.com/bcnmy/biconomy-client-sdk/blob/main/packages/account/src/utils/Utils.ts#L16)
