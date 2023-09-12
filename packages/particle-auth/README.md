# `@biconomy/particle-auth`

> A library to import the particle-auth for web directly from [Biconomy SDK](https://github.com/bcnmy/biconomy-client-sdk)

## Usage

```ts
import { ParticleNetwork, WalletEntryPosition } from "@particle-network/auth";
import { ParticleProvider } from "@particle-network/provider";
import Web3 from "web3";

const particle = new ParticleNetwork({
  projectId: "xx",
  clientKey: "xx",
  appId: "xx",
  chainName: "Ethereum", //optional: current chain name, default Ethereum.
  chainId: 1, //optional: current chain id, default 1.
  wallet: {
    //optional: by default, the wallet entry is displayed in the bottom right corner of the webpage.
    displayWalletEntry: true, //show wallet entry when connect particle.
    defaultWalletEntryPosition: WalletEntryPosition.BR, //wallet entry position
    uiMode: "dark", //optional: light or dark, if not set, the default is the same as web auth.
    supportChains: [
      { id: 1, name: "Ethereum" },
      { id: 5, name: "Ethereum" },
    ], // optional: web wallet support chains.
    customStyle: {}, //optional: custom wallet style
  },
});

const particleProvider = new ParticleProvider(particle.auth);

//if you use web3.js
window.web3 = new Web3(particleProvider);
window.web3.currentProvider.isParticleNetwork; // => true

//if you use ethers.js
import { ethers } from "ethers";
const ethersProvider = new ethers.providers.Web3Provider(particleProvider, "any");
const ethersSigner = ethersProvider.getSigner();
```
