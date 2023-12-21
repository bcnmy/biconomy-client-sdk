Example code snippet

```typescript
    import {BiconomySmartAccountV2} from "@biconomy/orange";
    import { ethers } from "ethers";

    async function main() {
        const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/polygon_mumbai");
        const signer = new ethers.Wallet("", provider);

        const bundlerUrl = "";
        const biconomyPaymasterApiKey = "";
        const chainId = 80001;

        // This smart account will run on Polygon Mumbai and is able to send user ops
        // I will use ECDSA ownership module by default
        // It has a paymaster setup
        // It has a bundler setup
        let smartAccount = await BiconomySmartAccountV2.create({
            signer,
            chainId,
            biconomyPaymasterApiKey,
            bundlerUrl
        })

        const transaction = {
            to: "0xd3C85Fdd3695Aee3f0A12B3376aCD8DC54020549",
            data: "0x",
            value: 0
        }
        
        let partialUserOp = await smartAccount.buildUserOp([transaction]);

        const userOpResponse = await smartAccount.sendUserOp(partialUserOp);
        const txDetails = await userOpResponse.wait();
        console.log(txDetails.receipt.transactionHash);
    }

    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
```