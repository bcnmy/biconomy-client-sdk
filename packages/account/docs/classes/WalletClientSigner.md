[@biconomy/account](../README.md) / [Exports](../modules.md) / WalletClientSigner

# Class: WalletClientSigner

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

## Implements

- [`SmartAccountSigner`](../interfaces/SmartAccountSigner.md)\<`WalletClient`\>

## Table of contents

### Constructors

- [constructor](WalletClientSigner.md#constructor)

### Properties

- [getAddress](WalletClientSigner.md#getaddress)
- [inner](WalletClientSigner.md#inner)
- [signMessage](WalletClientSigner.md#signmessage)
- [signTypedData](WalletClientSigner.md#signtypeddata)
- [signerType](WalletClientSigner.md#signertype)

## Constructors

### constructor

• **new WalletClientSigner**(`client`, `signerType`): [`WalletClientSigner`](WalletClientSigner.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `client` | `Object` | - |
| `client.account` | `undefined` \| `Account` | The Account of the Client. |
| `client.addChain` | (`args`: `AddChainParameters`) => `Promise`\<`void`\> | Adds an EVM chain to the wallet. - Docs: https://viem.sh/docs/actions/wallet/addChain - JSON-RPC Methods: [`eth_addEthereumChain`](https://eips.ethereum.org/EIPS/eip-3085) **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { optimism } from 'viem/chains' const client = createWalletClient({ transport: custom(window.ethereum), }) await client.addChain({ chain: optimism }) ``` |
| `client.batch?` | `Object` | Flags for batch settings. |
| `client.batch.multicall?` | `boolean` \| \{ `batchSize?`: `number` ; `wait?`: `number`  } | Toggle to enable `eth_call` multicall aggregation. |
| `client.cacheTime` | `number` | Time (in ms) that cached data will remain in memory. |
| `client.ccipRead?` | ``false`` \| \{ `request?`: (`parameters`: `CcipRequestParameters`) => `Promise`\<\`0x$\{string}\`\>  } | [CCIP Read](https://eips.ethereum.org/EIPS/eip-3668) configuration. |
| `client.chain` | `undefined` \| `Chain` | Chain for the client. |
| `client.deployContract` | \<abi, chainOverride\>(`args`: `DeployContractParameters`\<`abi`, `undefined` \| `Chain`, `undefined` \| `Account`, `chainOverride`\>) => `Promise`\<\`0x$\{string}\`\> | Deploys a contract to the network, given bytecode and constructor arguments. - Docs: https://viem.sh/docs/contract/deployContract - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/contracts/deploying-contracts **`Example`** ```ts import { createWalletClient, http } from 'viem' import { privateKeyToAccount } from 'viem/accounts' import { mainnet } from 'viem/chains' const client = createWalletClient({ account: privateKeyToAccount('0x…'), chain: mainnet, transport: http(), }) const hash = await client.deployContract({ abi: [], account: '0x…, bytecode: '0x608060405260405161083e38038061083e833981016040819052610...', }) ``` |
| `client.extend` | \<client\>(`fn`: (`client`: `Client`\<`Transport`, `undefined` \| `Chain`, `undefined` \| `Account`, `WalletRpcSchema`, `WalletActions`\<`undefined` \| `Chain`, `undefined` \| `Account`\>\>) => `client`) => `Client`\<`Transport`, `undefined` \| `Chain`, `undefined` \| `Account`, `WalletRpcSchema`, \{ [K in string \| number \| symbol]: client[K] } & `WalletActions`\<`undefined` \| `Chain`, `undefined` \| `Account`\>\> | - |
| `client.getAddresses` | () => `Promise`\<`GetAddressesReturnType`\> | Returns a list of account addresses owned by the wallet or client. - Docs: https://viem.sh/docs/actions/wallet/getAddresses - JSON-RPC Methods: [`eth_accounts`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_accounts) **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const accounts = await client.getAddresses() ``` |
| `client.getChainId` | () => `Promise`\<`number`\> | Returns the chain ID associated with the current network. - Docs: https://viem.sh/docs/actions/public/getChainId - JSON-RPC Methods: [`eth_chainId`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_chainid) **`Example`** ```ts import { createWalletClient, http } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const chainId = await client.getChainId() // 1 ``` |
| `client.getPermissions` | () => `Promise`\<`GetPermissionsReturnType`\> | Gets the wallets current permissions. - Docs: https://viem.sh/docs/actions/wallet/getPermissions - JSON-RPC Methods: [`wallet_getPermissions`](https://eips.ethereum.org/EIPS/eip-2255) **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const permissions = await client.getPermissions() ``` |
| `client.key` | `string` | A key for the client. |
| `client.name` | `string` | A name for the client. |
| `client.pollingInterval` | `number` | Frequency (in ms) for polling enabled actions & events. Defaults to 4_000 milliseconds. |
| `client.prepareTransactionRequest` | \<TRequest, TChainOverride, TAccountOverride\>(`args`: `PrepareTransactionRequestParameters`\<`undefined` \| `Chain`, `undefined` \| `Account`, `TChainOverride`, `TAccountOverride`, `TRequest`\>) => `Promise`\<\{ [K in string \| number \| symbol]: (UnionRequiredBy\<Extract\<UnionOmit\<(...), (...)\> & ((...) extends (...) ? (...) : (...)) & ((...) extends (...) ? (...) : (...)), IsNever\<(...)\> extends true ? unknown : ExactPartial\<(...)\>\> & Object, ParameterTypeToParameters\<TRequest["parameters"] extends PrepareTransactionRequestParameterType[] ? any[any][number] : PrepareTransactionRequestParameterType\>\> & (unknown extends TRequest["kzg"] ? Object : Pick\<TRequest, "kzg"\>))[K] }\> | Prepares a transaction request for signing. - Docs: https://viem.sh/docs/actions/wallet/prepareTransactionRequest **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const request = await client.prepareTransactionRequest({ account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e', to: '0x0000000000000000000000000000000000000000', value: 1n, }) ``` **`Example`** ```ts // Account Hoisting import { createWalletClient, http } from 'viem' import { privateKeyToAccount } from 'viem/accounts' import { mainnet } from 'viem/chains' const client = createWalletClient({ account: privateKeyToAccount('0x…'), chain: mainnet, transport: custom(window.ethereum), }) const request = await client.prepareTransactionRequest({ to: '0x0000000000000000000000000000000000000000', value: 1n, }) ``` |
| `client.request` | `EIP1193RequestFn`\<`WalletRpcSchema`\> | Request function wrapped with friendly error handling |
| `client.requestAddresses` | () => `Promise`\<`RequestAddressesReturnType`\> | Requests a list of accounts managed by a wallet. - Docs: https://viem.sh/docs/actions/wallet/requestAddresses - JSON-RPC Methods: [`eth_requestAccounts`](https://eips.ethereum.org/EIPS/eip-1102) Sends a request to the wallet, asking for permission to access the user's accounts. After the user accepts the request, it will return a list of accounts (addresses). This API can be useful for dapps that need to access the user's accounts in order to execute transactions or interact with smart contracts. **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const accounts = await client.requestAddresses() ``` |
| `client.requestPermissions` | (`args`: \{ `eth_accounts`: `Record`\<`string`, `any`\>  }) => `Promise`\<`RequestPermissionsReturnType`\> | Requests permissions for a wallet. - Docs: https://viem.sh/docs/actions/wallet/requestPermissions - JSON-RPC Methods: [`wallet_requestPermissions`](https://eips.ethereum.org/EIPS/eip-2255) **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const permissions = await client.requestPermissions({ eth_accounts: {} }) ``` |
| `client.sendRawTransaction` | (`args`: `SendRawTransactionParameters`) => `Promise`\<\`0x$\{string}\`\> | Sends a **signed** transaction to the network - Docs: https://viem.sh/docs/actions/wallet/sendRawTransaction - JSON-RPC Method: [`eth_sendRawTransaction`](https://ethereum.github.io/execution-apis/api-documentation/) **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { mainnet } from 'viem/chains' import { sendRawTransaction } from 'viem/wallet' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const hash = await client.sendRawTransaction({ serializedTransaction: '0x02f850018203118080825208808080c080a04012522854168b27e5dc3d5839bab5e6b39e1a0ffd343901ce1622e3d64b48f1a04e00902ae0502c4728cbf12156290df99c3ed7de85b1dbfe20b5c36931733a33' }) ``` |
| `client.sendTransaction` | \<TRequest, TChainOverride\>(`args`: `SendTransactionParameters`\<`undefined` \| `Chain`, `undefined` \| `Account`, `TChainOverride`, `TRequest`\>) => `Promise`\<\`0x$\{string}\`\> | Creates, signs, and sends a new transaction to the network. - Docs: https://viem.sh/docs/actions/wallet/sendTransaction - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/transactions/sending-transactions - JSON-RPC Methods: - JSON-RPC Accounts: [`eth_sendTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendtransaction) - Local Accounts: [`eth_sendRawTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendrawtransaction) **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const hash = await client.sendTransaction({ account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e', to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', value: 1000000000000000000n, }) ``` **`Example`** ```ts // Account Hoisting import { createWalletClient, http } from 'viem' import { privateKeyToAccount } from 'viem/accounts' import { mainnet } from 'viem/chains' const client = createWalletClient({ account: privateKeyToAccount('0x…'), chain: mainnet, transport: http(), }) const hash = await client.sendTransaction({ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', value: 1000000000000000000n, }) ``` |
| `client.signMessage` | (`args`: `SignMessageParameters`\<`undefined` \| `Account`\>) => `Promise`\<\`0x$\{string}\`\> | Calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`. - Docs: https://viem.sh/docs/actions/wallet/signMessage - JSON-RPC Methods: - JSON-RPC Accounts: [`personal_sign`](https://docs.metamask.io/guide/signing-data#personal-sign) - Local Accounts: Signs locally. No JSON-RPC request. With the calculated signature, you can: - use [`verifyMessage`](https://viem.sh/docs/utilities/verifyMessage) to verify the signature, - use [`recoverMessageAddress`](https://viem.sh/docs/utilities/recoverMessageAddress) to recover the signing address from a signature. **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const signature = await client.signMessage({ account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e', message: 'hello world', }) ``` **`Example`** ```ts // Account Hoisting import { createWalletClient, http } from 'viem' import { privateKeyToAccount } from 'viem/accounts' import { mainnet } from 'viem/chains' const client = createWalletClient({ account: privateKeyToAccount('0x…'), chain: mainnet, transport: http(), }) const signature = await client.signMessage({ message: 'hello world', }) ``` |
| `client.signTransaction` | \<TChainOverride\>(`args`: `SignTransactionParameters`\<`undefined` \| `Chain`, `undefined` \| `Account`, `TChainOverride`\>) => `Promise`\<\`0x02$\{string}\` \| \`0x01$\{string}\` \| \`0x03$\{string}\` \| `TransactionSerializedLegacy`\> | Signs a transaction. - Docs: https://viem.sh/docs/actions/wallet/signTransaction - JSON-RPC Methods: - JSON-RPC Accounts: [`eth_signTransaction`](https://ethereum.github.io/execution-apis/api-documentation/) - Local Accounts: Signs locally. No JSON-RPC request. **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const request = await client.prepareTransactionRequest({ account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e', to: '0x0000000000000000000000000000000000000000', value: 1n, }) const signature = await client.signTransaction(request) ``` **`Example`** ```ts // Account Hoisting import { createWalletClient, http } from 'viem' import { privateKeyToAccount } from 'viem/accounts' import { mainnet } from 'viem/chains' const client = createWalletClient({ account: privateKeyToAccount('0x…'), chain: mainnet, transport: custom(window.ethereum), }) const request = await client.prepareTransactionRequest({ to: '0x0000000000000000000000000000000000000000', value: 1n, }) const signature = await client.signTransaction(request) ``` |
| `client.signTypedData` | \<TTypedData, TPrimaryType\>(`args`: `SignTypedDataParameters`\<`TTypedData`, `TPrimaryType`, `undefined` \| `Account`\>) => `Promise`\<\`0x$\{string}\`\> | Signs typed data and calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`. - Docs: https://viem.sh/docs/actions/wallet/signTypedData - JSON-RPC Methods: - JSON-RPC Accounts: [`eth_signTypedData_v4`](https://docs.metamask.io/guide/signing-data#signtypeddata-v4) - Local Accounts: Signs locally. No JSON-RPC request. **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const signature = await client.signTypedData({ account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e', domain: { name: 'Ether Mail', version: '1', chainId: 1, verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC', }, types: { Person: [ { name: 'name', type: 'string' }, { name: 'wallet', type: 'address' }, ], Mail: [ { name: 'from', type: 'Person' }, { name: 'to', type: 'Person' }, { name: 'contents', type: 'string' }, ], }, primaryType: 'Mail', message: { from: { name: 'Cow', wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826', }, to: { name: 'Bob', wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB', }, contents: 'Hello, Bob!', }, }) ``` **`Example`** ```ts // Account Hoisting import { createWalletClient, http } from 'viem' import { privateKeyToAccount } from 'viem/accounts' import { mainnet } from 'viem/chains' const client = createWalletClient({ account: privateKeyToAccount('0x…'), chain: mainnet, transport: http(), }) const signature = await client.signTypedData({ domain: { name: 'Ether Mail', version: '1', chainId: 1, verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC', }, types: { Person: [ { name: 'name', type: 'string' }, { name: 'wallet', type: 'address' }, ], Mail: [ { name: 'from', type: 'Person' }, { name: 'to', type: 'Person' }, { name: 'contents', type: 'string' }, ], }, primaryType: 'Mail', message: { from: { name: 'Cow', wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826', }, to: { name: 'Bob', wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB', }, contents: 'Hello, Bob!', }, }) ``` |
| `client.switchChain` | (`args`: `SwitchChainParameters`) => `Promise`\<`void`\> | Switch the target chain in a wallet. - Docs: https://viem.sh/docs/actions/wallet/switchChain - JSON-RPC Methods: [`eth_switchEthereumChain`](https://eips.ethereum.org/EIPS/eip-3326) **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { mainnet, optimism } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) await client.switchChain({ id: optimism.id }) ``` |
| `client.transport` | `TransportConfig`\<`string`, `EIP1193RequestFn`\> & `Record`\<`string`, `any`\> | The RPC transport |
| `client.type` | `string` | The type of client. |
| `client.uid` | `string` | A unique ID for the client. |
| `client.watchAsset` | (`args`: `WatchAssetParams`) => `Promise`\<`boolean`\> | Adds an EVM chain to the wallet. - Docs: https://viem.sh/docs/actions/wallet/watchAsset - JSON-RPC Methods: [`eth_switchEthereumChain`](https://eips.ethereum.org/EIPS/eip-747) **`Example`** ```ts import { createWalletClient, custom } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const success = await client.watchAsset({ type: 'ERC20', options: { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', decimals: 18, symbol: 'WETH', }, }) ``` |
| `client.writeContract` | \<abi, functionName, args, TChainOverride\>(`args`: `WriteContractParameters`\<`abi`, `functionName`, `args`, `undefined` \| `Chain`, `undefined` \| `Account`, `TChainOverride`\>) => `Promise`\<\`0x$\{string}\`\> | Executes a write function on a contract. - Docs: https://viem.sh/docs/contract/writeContract - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/contracts/writing-to-contracts A "write" function on a Solidity contract modifies the state of the blockchain. These types of functions require gas to be executed, and hence a [Transaction](https://viem.sh/docs/glossary/terms) is needed to be broadcast in order to change the state. Internally, uses a [Wallet Client](https://viem.sh/docs/clients/wallet) to call the [`sendTransaction` action](https://viem.sh/docs/actions/wallet/sendTransaction) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData). __Warning: The `write` internally sends a transaction – it does not validate if the contract write will succeed (the contract may throw an error). It is highly recommended to [simulate the contract write with `contract.simulate`](https://viem.sh/docs/contract/writeContract#usage) before you execute it.__ **`Example`** ```ts import { createWalletClient, custom, parseAbi } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const hash = await client.writeContract({ address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2', abi: parseAbi(['function mint(uint32 tokenId) nonpayable']), functionName: 'mint', args: [69420], }) ``` **`Example`** ```ts // With Validation import { createWalletClient, custom, parseAbi } from 'viem' import { mainnet } from 'viem/chains' const client = createWalletClient({ chain: mainnet, transport: custom(window.ethereum), }) const { request } = await client.simulateContract({ address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2', abi: parseAbi(['function mint(uint32 tokenId) nonpayable']), functionName: 'mint', args: [69420], } const hash = await client.writeContract(request) ``` |
| `signerType` | `string` | - |

#### Returns

[`WalletClientSigner`](WalletClientSigner.md)

#### Defined in

../../../node_modules/@alchemy/aa-core/dist/types/signer/wallet-client.d.ts:6

## Properties

### getAddress

• **getAddress**: () => `Promise`\<\`0x$\{string}\`\>

#### Type declaration

▸ (): `Promise`\<\`0x$\{string}\`\>

##### Returns

`Promise`\<\`0x$\{string}\`\>

#### Implementation of

[SmartAccountSigner](../interfaces/SmartAccountSigner.md).[getAddress](../interfaces/SmartAccountSigner.md#getaddress)

#### Defined in

../../../node_modules/@alchemy/aa-core/dist/types/signer/wallet-client.d.ts:7

___

### inner

• **inner**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `account` | `undefined` \| `Account` | The Account of the Client. |
| `addChain` | (`args`: `AddChainParameters`) => `Promise`\<`void`\> | - |
| `batch?` | \{ `multicall?`: `boolean` \| \{ `batchSize?`: `number` ; `wait?`: `number`  }  } | Flags for batch settings. |
| `batch.multicall?` | `boolean` \| \{ `batchSize?`: `number` ; `wait?`: `number`  } | Toggle to enable `eth_call` multicall aggregation. |
| `cacheTime` | `number` | Time (in ms) that cached data will remain in memory. |
| `ccipRead?` | ``false`` \| \{ `request?`: (`parameters`: `CcipRequestParameters`) => `Promise`\<\`0x$\{string}\`\>  } | [CCIP Read](https://eips.ethereum.org/EIPS/eip-3668) configuration. |
| `chain` | `undefined` \| `Chain` | Chain for the client. |
| `deployContract` | \<abi, chainOverride\>(`args`: `DeployContractParameters`\<`abi`, `undefined` \| `Chain`, `undefined` \| `Account`, `chainOverride`\>) => `Promise`\<\`0x$\{string}\`\> | - |
| `extend` | \<client\>(`fn`: (`client`: `Client`\<`Transport`, `undefined` \| `Chain`, `undefined` \| `Account`, `WalletRpcSchema`, `WalletActions`\<`undefined` \| `Chain`, `undefined` \| `Account`\>\>) => `client`) => `Client`\<`Transport`, `undefined` \| `Chain`, `undefined` \| `Account`, `WalletRpcSchema`, \{ [K in string \| number \| symbol]: client[K] } & `WalletActions`\<`undefined` \| `Chain`, `undefined` \| `Account`\>\> | - |
| `getAddresses` | () => `Promise`\<`GetAddressesReturnType`\> | - |
| `getChainId` | () => `Promise`\<`number`\> | - |
| `getPermissions` | () => `Promise`\<`GetPermissionsReturnType`\> | - |
| `key` | `string` | A key for the client. |
| `name` | `string` | A name for the client. |
| `pollingInterval` | `number` | Frequency (in ms) for polling enabled actions & events. Defaults to 4_000 milliseconds. |
| `prepareTransactionRequest` | \<TRequest, TChainOverride, TAccountOverride\>(`args`: `PrepareTransactionRequestParameters`\<`undefined` \| `Chain`, `undefined` \| `Account`, `TChainOverride`, `TAccountOverride`, `TRequest`\>) => `Promise`\<\{ [K in string \| number \| symbol]: (UnionRequiredBy\<Extract\<UnionOmit\<(...), (...)\> & ((...) extends (...) ? (...) : (...)) & ((...) extends (...) ? (...) : (...)), IsNever\<(...)\> extends true ? unknown : ExactPartial\<(...)\>\> & Object, ParameterTypeToParameters\<TRequest["parameters"] extends PrepareTransactionRequestParameterType[] ? any[any][number] : PrepareTransactionRequestParameterType\>\> & (unknown extends TRequest["kzg"] ? Object : Pick\<TRequest, "kzg"\>))[K] }\> | - |
| `request` | `EIP1193RequestFn`\<`WalletRpcSchema`\> | Request function wrapped with friendly error handling |
| `requestAddresses` | () => `Promise`\<`RequestAddressesReturnType`\> | - |
| `requestPermissions` | (`args`: \{ `eth_accounts`: `Record`\<`string`, `any`\>  }) => `Promise`\<`RequestPermissionsReturnType`\> | - |
| `sendRawTransaction` | (`args`: `SendRawTransactionParameters`) => `Promise`\<\`0x$\{string}\`\> | - |
| `sendTransaction` | \<TRequest, TChainOverride\>(`args`: `SendTransactionParameters`\<`undefined` \| `Chain`, `undefined` \| `Account`, `TChainOverride`, `TRequest`\>) => `Promise`\<\`0x$\{string}\`\> | - |
| `signMessage` | (`args`: `SignMessageParameters`\<`undefined` \| `Account`\>) => `Promise`\<\`0x$\{string}\`\> | - |
| `signTransaction` | \<TChainOverride\>(`args`: `SignTransactionParameters`\<`undefined` \| `Chain`, `undefined` \| `Account`, `TChainOverride`\>) => `Promise`\<\`0x02$\{string}\` \| \`0x01$\{string}\` \| \`0x03$\{string}\` \| `TransactionSerializedLegacy`\> | - |
| `signTypedData` | \<TTypedData, TPrimaryType\>(`args`: `SignTypedDataParameters`\<`TTypedData`, `TPrimaryType`, `undefined` \| `Account`\>) => `Promise`\<\`0x$\{string}\`\> | - |
| `switchChain` | (`args`: `SwitchChainParameters`) => `Promise`\<`void`\> | - |
| `transport` | `TransportConfig`\<`string`, `EIP1193RequestFn`\> & `Record`\<`string`, `any`\> | The RPC transport |
| `type` | `string` | The type of client. |
| `uid` | `string` | A unique ID for the client. |
| `watchAsset` | (`args`: `WatchAssetParams`) => `Promise`\<`boolean`\> | - |
| `writeContract` | \<abi, functionName, args, TChainOverride\>(`args`: `WriteContractParameters`\<`abi`, `functionName`, `args`, `undefined` \| `Chain`, `undefined` \| `Account`, `TChainOverride`\>) => `Promise`\<\`0x$\{string}\`\> | - |

#### Implementation of

[SmartAccountSigner](../interfaces/SmartAccountSigner.md).[inner](../interfaces/SmartAccountSigner.md#inner)

#### Defined in

../../../node_modules/@alchemy/aa-core/dist/types/signer/wallet-client.d.ts:5

___

### signMessage

• `Readonly` **signMessage**: (`message`: `SignableMessage`) => `Promise`\<\`0x$\{string}\`\>

#### Type declaration

▸ (`message`): `Promise`\<\`0x$\{string}\`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `SignableMessage` |

##### Returns

`Promise`\<\`0x$\{string}\`\>

#### Implementation of

[SmartAccountSigner](../interfaces/SmartAccountSigner.md).[signMessage](../interfaces/SmartAccountSigner.md#signmessage)

#### Defined in

../../../node_modules/@alchemy/aa-core/dist/types/signer/wallet-client.d.ts:8

___

### signTypedData

• **signTypedData**: \<TTypedData, TPrimaryType\>(`typedData`: `TypedDataDefinition`\<`TTypedData`, `TPrimaryType`\>) => `Promise`\<\`0x$\{string}\`\>

#### Type declaration

▸ \<`TTypedData`, `TPrimaryType`\>(`typedData`): `Promise`\<\`0x$\{string}\`\>

##### Type parameters

| Name | Type |
| :------ | :------ |
| `TTypedData` | extends \{ `[x: string]`: readonly `TypedDataParameter`[]; `address?`: `undefined` ; `bool?`: `undefined` ; `bytes?`: `undefined` ; `bytes1?`: `undefined` ; `bytes10?`: `undefined` ; `bytes11?`: `undefined` ; `bytes12?`: `undefined` ; `bytes13?`: `undefined` ; `bytes14?`: `undefined` ; `bytes15?`: `undefined` ; `bytes16?`: `undefined` ; `bytes17?`: `undefined` ; `bytes18?`: `undefined` ; `bytes19?`: `undefined` ; `bytes2?`: `undefined` ; `bytes20?`: `undefined` ; `bytes21?`: `undefined` ; `bytes22?`: `undefined` ; `bytes23?`: `undefined` ; `bytes24?`: `undefined` ; `bytes25?`: `undefined` ; `bytes26?`: `undefined` ; `bytes27?`: `undefined` ; `bytes28?`: `undefined` ; `bytes29?`: `undefined` ; `bytes3?`: `undefined` ; `bytes30?`: `undefined` ; `bytes31?`: `undefined` ; `bytes32?`: `undefined` ; `bytes4?`: `undefined` ; `bytes5?`: `undefined` ; `bytes6?`: `undefined` ; `bytes7?`: `undefined` ; `bytes8?`: `undefined` ; `bytes9?`: `undefined` ; `int104?`: `undefined` ; `int112?`: `undefined` ; `int120?`: `undefined` ; `int128?`: `undefined` ; `int136?`: `undefined` ; `int144?`: `undefined` ; `int152?`: `undefined` ; `int16?`: `undefined` ; `int160?`: `undefined` ; `int168?`: `undefined` ; `int176?`: `undefined` ; `int184?`: `undefined` ; `int192?`: `undefined` ; `int200?`: `undefined` ; `int208?`: `undefined` ; `int216?`: `undefined` ; `int224?`: `undefined` ; `int232?`: `undefined` ; `int24?`: `undefined` ; `int240?`: `undefined` ; `int248?`: `undefined` ; `int256?`: `undefined` ; `int32?`: `undefined` ; `int40?`: `undefined` ; `int48?`: `undefined` ; `int56?`: `undefined` ; `int64?`: `undefined` ; `int72?`: `undefined` ; `int8?`: `undefined` ; `int80?`: `undefined` ; `int88?`: `undefined` ; `int96?`: `undefined` ; `string?`: `undefined` ; `uint104?`: `undefined` ; `uint112?`: `undefined` ; `uint120?`: `undefined` ; `uint128?`: `undefined` ; `uint136?`: `undefined` ; `uint144?`: `undefined` ; `uint152?`: `undefined` ; `uint16?`: `undefined` ; `uint160?`: `undefined` ; `uint168?`: `undefined` ; `uint176?`: `undefined` ; `uint184?`: `undefined` ; `uint192?`: `undefined` ; `uint200?`: `undefined` ; `uint208?`: `undefined` ; `uint216?`: `undefined` ; `uint224?`: `undefined` ; `uint232?`: `undefined` ; `uint24?`: `undefined` ; `uint240?`: `undefined` ; `uint248?`: `undefined` ; `uint256?`: `undefined` ; `uint32?`: `undefined` ; `uint40?`: `undefined` ; `uint48?`: `undefined` ; `uint56?`: `undefined` ; `uint64?`: `undefined` ; `uint72?`: `undefined` ; `uint8?`: `undefined` ; `uint80?`: `undefined` ; `uint88?`: `undefined` ; `uint96?`: `undefined`  } \| \{ `[key: string]`: `unknown`;  } |
| `TPrimaryType` | extends `string` = `string` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `typedData` | `TypedDataDefinition`\<`TTypedData`, `TPrimaryType`\> |

##### Returns

`Promise`\<\`0x$\{string}\`\>

#### Implementation of

[SmartAccountSigner](../interfaces/SmartAccountSigner.md).[signTypedData](../interfaces/SmartAccountSigner.md#signtypeddata)

#### Defined in

../../../node_modules/@alchemy/aa-core/dist/types/signer/wallet-client.d.ts:9

___

### signerType

• **signerType**: `string`

#### Implementation of

[SmartAccountSigner](../interfaces/SmartAccountSigner.md).[signerType](../interfaces/SmartAccountSigner.md#signertype)

#### Defined in

../../../node_modules/@alchemy/aa-core/dist/types/signer/wallet-client.d.ts:4
