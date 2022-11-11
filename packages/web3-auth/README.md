# `web3-auth`

> A library to import the torus web3 social auth directly from biconomy-sdk.

## Usage

```ts
import SocialLogin from "@biconomy/web3-auth";
// init wallet
const socialLoginSDK = new SocialLogin();
await socialLoginSDK.init('0x5');
socialLoginSDK.showConnectModal();
// show connect modal
socialLoginSDK.showWallet();
```
