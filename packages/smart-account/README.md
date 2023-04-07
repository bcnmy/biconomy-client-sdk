# `@biconomy-devx/smart-account`

# Biconomy SDK Smart Account

Smart Account is the main package that Dev's can use to create smart contract wallet's that sits on top of their EOA. EOA is the controller for this smart contract wallet's and authorises transactions with signing. 

## Installation

```yarn add @biconomy-devx/smart-account```

OR

```npm install @biconomy-devx/smart-account ```

## Usage

```
// import package
import SmartAccount from "@biconomy-devx/smart-account"

// Get the EOA and provider from you choice of your wallet.
const { provider, address } = useWeb3AuthContext();
const walletProvider = new ethers.providers.Web3Provider(provider);

// Choose Blockchain networks, you wants to interact with
let options = {
 activeNetworkId: ChainId.GOERLI,
 supportedNetworksIds: [ ChainId.GOERLI, ChainId.POLYGON_MAINNET, ChainId.POLYGON_MUMBAI]
 }

// Intialise package with provider and Blockchain networks

let smartAccount = new SmartAccount(walletProvider, options)
smartAccount = await smartAccount.init()

```

Once you have intialize smart-account package. Now you can access all the available methods of this package

# Get Smart Contract Wallet Address

Smart Contract Wallet have counterfactual addresses. Whatever chain you choose to interact with your wallet address would be same accross all chains. You can see your wallet address even its not yet deployed on any chain

```
const address = smartAccount.address
console.log('address ', address)
```

You can also see the state of your address either its deployed or not

```
const isDeployed = smartAccount.isDeployed()
console.log('isDeployed ', isDeployed)
```

# Get Smart Contract Wallet Balances

```
import { BalancesDto } from '@biconomy-devx/node-client'

import { ChainId } from '@biconomy-devx/core-types'

const balanceParams: BalancesDto =
      {
          // if no chainId is supplied, SDK will automatically pick active one that
         //  is being supplied for initialization

        chainId: ChainId.MAINNET, // chainId of your choice
        eoaAddress: smartAccount.address,
        // If empty string you receive balances of all tokens watched by Indexer
        // you can only whitelist token addresses that are listed in token respository
        // specified above ^
        tokenAddresses: [], 
      };

const balFromSdk = await smartAccount.getAlltokenBalances(balanceParams);
console.info("balFromSdk ", balFromSdk);

const usdBalFromSdk = await smartAccount.getTotalBalanceInUsd(balanceParams);
console.info("usdBalFromSdk ", usdBalFromSdk)

```




