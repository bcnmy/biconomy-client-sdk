# `@biconomy/node-client`

# Biconomy SDK Node Client

Node Client is the api client package that communicate with [Biconomy SDK](https://github.com/bcnmy/biconomy-client-sdk) backend node to fetch needed smart contract wallet data i.e supported chains list, transaction history, balances e.t.c

## Installation

`yarn add @biconomy/node-client`

OR

`npm install @biconomy/node-client `

## Usage

```
// import package
import NodeClient from '@biconomy/node-client'

// initialisation

const nodeClient = new NodeClient({ txServiceUrl: 'https://sdk-backend.staging.biconomy.io/v1' })
```

# Fetch Supported Chains List

```
const supportedChainsList = await nodeClient.getAllSupportedChains()
console.log('supportedChainsList ', supportedChainsList)
```

# Fetch Transactions By Address

```
const chainId = 80001
const address = '0xabc......'
const trxHistory = await nodeClient.getTransactionByAddress(chainId, address)
console.log('trxHistory ', trxHistory)
```

# Get Transaction By Hash

```
const txHash = '0x........'
const trxDetail = await nodeClient.getTransactionByHash(txHash)
console.log('trxDetail ', trxDetail)
```

# Get Smart Contract Wallet Balances

```
import { BalancesDto } from '@biconomy/node-client'

import { ChainId } from '@biconomy/core-types'

const address = '0xabc......'

const balanceParams: BalancesDto =
      {
          // if no chainId is supplied, SDK will automatically pick active one that
         //  is being supplied for initialization

        chainId: ChainId.MAINNET, // chainId of your choice
        eoaAddress: address,
        // If empty string you receive balances of all tokens watched by Indexer
        // you can only whitelist token addresses that are listed in token respository
        // specified above ^
        tokenAddresses: [],
      };

const balFromSdk = await nodeClient.getAlltokenBalances(balanceParams);
console.info("balFromSdk ", balFromSdk);

const usdBalFromSdk = await nodeClient.getTotalBalanceInUsd(balanceParams);
console.info("usdBalFromSdk ", usdBalFromSdk)
```
