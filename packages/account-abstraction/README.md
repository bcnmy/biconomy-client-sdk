# SDK to create and send UserOperation 

This package provides 2 APIs for using UserOperations:

- Low-level "walletAPI"
- High-level Provider


## LowLevel API:

### BaseWalletAPI

An abstract base-class to create UserOperation for a contract wallet.

### SmartAccountAPI

An implementation of the BaseWalletAPi, for the Biconomy SmartAccount

```typescript
owner = provider.getSigner()
const smartWalletAPI = new SmartAccountAPI(
    provider,
    entryPoint, // instance of the entry point contract
    config, // instance of ClientConfig
    walletAddress, // counter factual wallet address (smartAccount.address)
    originalSigner, // owner
    fallbackHandlerAddress, 
    factoryAddress, // wallet factory address 
    0 // index
  )
const op = await smartWalletAPI.createSignedUserOp({
  target: recipient.address,
  data: recipient.interface.encodeFunctionData('something', ['hello'])
})
```

## High-Level Provider API

A simplified mode that doesn't require a different wallet extension. 
Instead, the current provider's account is used as wallet owner by calling its "Sign Message" operation.

This can only work for wallets that use an EIP-191 ("Ethereum Signed Message") signatures (like our sample SimpleWallet)
Also, the UX is not great (the user is asked to sign a hash, and even the wallet address is not mentioned, only the signer)