### [Initialise a smartAccount](https://bcnmy.github.io/biconomy-client-sdk/functions/createSmartAccountClient.html)

| Key                                                                                                            | Description                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [signer](https://bcnmy.github.io/biconomy-client-sdk/packages/account/docs/interfaces/SmartAccountSigner.html) | This signer will be used for signing userOps for any transactions you build. Will accept ethers.JsonRpcSigner as well as a viemWallet |
| [paymasterUrl](https://dashboard.biconomy.io)                                                                  | You can pass in a paymasterUrl necessary for sponsoring transactions (retrieved from the biconomy dashboard)                          |
| [bundlerUrl](https://dashboard.biconomy.io)                                                                    | You can pass in a bundlerUrl (retrieved from the biconomy dashboard) for sending transactions                                         |

```typescript
import { createSmartAccountClient } from "@biconomy/account";
import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { mainnet as chain } from "viem/chains";

const account = privateKeyToAccount(generatePrivateKey());
const signer = createWalletClient({ account, chain, transport: http() });

const smartAccount = await createSmartAccountClient({ signer, bundlerUrl, paymasterUrl }); // Retrieve bundler and pymaster urls from dashboard
```
