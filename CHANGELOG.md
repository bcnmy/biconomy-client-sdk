# @biconomy/account

## 4.4.6

### Patch Changes

- Move SessionStorageClient to its own package (https://www.npmjs.com/package/@biconomy/session-file-storage)

## 4.4.5

### Patch Changes

- modifications for token payment + session support

  - Added "toSupportedSigner" helper for privateKey -> supportedSigner translation
  - Added "toSessionParams" helper for privateKey -> session params translation
  - Tweaked getBatchSessionTxParams to return last n leaves by default, so users do not always have to find the correct session leaf
  - Tweaked getSingleSessionTxParams to return last n leaves by default, so users do not always have to find the correct session leaf
  - Tweaked createABISessionDatum to allow devs to manually input the functionSelector
  - Exported BICONOMY_TOKEN_PAYMASTER, useful for manually building approvals

## 4.4.4

### Patch Changes

- Add Support for Custom Chains

## 4.4.3

### Patch Changes

- Abstract away SessionStorageClient and SessionIDInfo

## 4.4.2

### Patch Changes

- fix referenceValue padding

## 4.4.1

### Patch Changes

- fix process.env bug

## 4.4.0

### Minor Changes

- b9b2077: Sessions DevEx

  - Improved DevEx related to the creating and using of sessions [chore: sessions dx](https://github.com/bcnmy/biconomy-client-sdk/pull/486)

## 4.3.0

### Minor Changes

- Added transferOwnership and gasOffsets

  - added transferOwnerhsip() method on the Smart Account
  - added gasOffsets parameter to increase gas values

## 4.2.0

### Minor Changes

- Features:

  - Improved getBalances utility helper ([da340f](https://github.com/bcnmy/biconomy-client-sdk/pull/479/commits/da340fbcc20778c9810dd8980061a6bb7b4cf097))
  - Added 1271 Signature support ([fd832fe](https://github.com/bcnmy/biconomy-client-sdk/pull/479/commits/fd832fe2e286a5d3e57d3292cfa395e388b07b96))
  - Added withdrawal utility helper ([7a93d87](https://github.com/bcnmy/biconomy-client-sdk/pull/479/commits/7a93d871ecefbce8ed5ef63349c055072877189e))
  - Reduce bundle size ([7c594fa](https://github.com/bcnmy/biconomy-client-sdk/pull/479/commits/7c594fa74e81650b4cb5043afb4cd1153e638a19))
  - Integrate [AAErrors](https://github.com/bcnmy/aa-errors) ([7c594fa](https://github.com/bcnmy/biconomy-client-sdk/pull/479/commits/7c594fa74e81650b4cb5043afb4cd1153e638a19))
  - Added 6492 Signature support ([fd832fe](https://github.com/bcnmy/biconomy-client-sdk/pull/479/commits/fd832fe2e286a5d3e57d3292cfa395e388b07b96))
  - Added Token Balances to getSupportedTokens payload ([869436](https://github.com/bcnmy/biconomy-client-sdk/pull/479/commits/8694366165208cac6bbf7e560fe2abefce0eaa3a))
  - Added gas estimates utility helper ([950a521](https://github.com/bcnmy/biconomy-client-sdk/pull/479/commits/950a521af63d7a719edcbae4df57259d3fe110e7))
  - Added dummy pnd override ([8d34d14](https://github.com/bcnmy/biconomy-client-sdk/pull/479/commits/8d34d148862510fdb76c58852c55a48bc7c20b4c))

  Chores:

  - Modernise tooling ([7c594fa](https://github.com/bcnmy/biconomy-client-sdk/pull/479/commits/7c594fa74e81650b4cb5043afb4cd1153e638a19))
    - Add changesets
    - Migrate tests to Amoy
    - Add pr lint
    - Add size report
    - Add tree shaking
    - Add code of conduct
    - Update README (table of contents)
    - Add SECURITY.md
    - Replace prettier with biome
    - Replace yarn with bun
    - Remove deprecated Base class
    - Added "NEXT_PUBLIC_BICONOMY_SDK_DEBUG" to support NextJS debugging information
    - Replace jest with vitest
    - Added size threshold checks to PRs
    - Added test coverage checks to PRs
    - Added tsdoc auto-deploy

  Fixes:

  - Fix wrong falsy check for user op nonce ([f2567](https://github.com/bcnmy/biconomy-client-sdk/pull/479/commits/f256712bbf7dc0de40b82c70ad183c59bf5f39f9))

## 4.1.1 (2023-07-03)

- Added missing extensions ([fdbec6](https://github.com/bcnmy/biconomy-client-sdk/pull/451/commits/fdbec68625f4d7f436dc39d4c1779cdbb7c53e6d))
- Fixed issue reporting format ([815e9440](https://github.com/bcnmy/biconomy-client-sdk/pull/450/commits/815e9440db03ebae98bb24edfcb3bbcabf9b2a61))

## 4.1.0 (2023-04-03)

Features:

- Added Speed optimisation, removing redundant gasEstimate call to bundler ([2371b2](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/2371b230cd5806ec4c7c95ba604d6f924b4be768))
- Added smartAccount.getBalances() method ([4b8bae](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/4b8bae412577b846e700b168976cefa6b0803ff6))
- Added smartAccount.getSupportedTokens() method ([6d2fb27](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/6d2fb27d6f9b424e440e45990ea06820a9d16d4b))
- Added smartAccount.deploy() method ([be9dc4](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/be9dc4d74a3e5a22e69416983436997cf2ea417c))
- Increased checking of the chainId from the bundler, paymaster and the provider ([5d2f3](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/5d2f34d8f0fb4f9ff7c7ddc00336471e57efdcfd))
- Added entity name to Logger calls ([9278ec](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/9278ecc21e060ef75ab29a0d054d95d69cd4ae27))
- Export a 'getChain' by id helper, which returns a viem chain ([ab2ba](https://github.com/bcnmy/biconomy-client-sdk/pull/449/commits/ab2ba2c518ce867c52bf90b9018dfc1b4ec3b4d4))
- Add "stateOverride" optional param ([20fd54](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/20fd54c817d2dcbc6b7d9a247d890d91b19a9c2f))

Fixes:

- Fix for encodeAbiParameters inside batched session module ([b27061](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/b27061e2eec7bafb0620e88e6d94e56e9a13cb76))
- added flag to skip calldata approval patch ([75698](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/75698c827015533e32acb1f535bdf6b738876217))
- Fixed the particle auth build

Chores:

- Added tests for ecdsa module ([1a8f29](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/1a8f296c26c9fedd57023f8f6423d7662a3adfee))
- Increased test coverage ([329003](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/329003cebb6b4034496e41651985804cdec0d311))
- Improved issue reporting guidelines ([8b9fb5d](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/8b9fb5de9556870611307c12e57df333619d9252))
- Added e2e tests for optimism, ran from GH actions ([5051ba](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/5051ba5ff14220ad616f1ec3bc93a3f42d6f8887))
- Added ABI SVM test ([49c96](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/49c968220e2db0aeee5cc6419f45df2b98f9792c))
- Added tests for batched session router testing ([2eb9765](https://github.com/bcnmy/biconomy-client-sdk/pull/447/commits/2eb9765d066fcb7b35d08223257aeb9b38c7a78b))

## 4.0.3 (2023-28-02)

VERSION Bump Only.

## 4.0.2 (2023-26-02)

### Bug Fixes

Particle Auth Fix

## 4.0.1 (2023-02-22)

### Bug Fixes

- Fix for RPC endpoints (Quiknode, Blast Sepolia etc) failing to respond because of custom headers being set

## 4.0.0 (2023-02-06)

### Features

- Export bundler / paymaster instances + helpers from master package ([1d1f9d](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/1d1f9dafddf11bde0e1a75383bc935b22448bedd))
- Export modules aliases from master package ([d6205c](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/d6205c4d76ab846ecdc10843c65e0277f3ceab00))
- Added sendTransaction abstraction for buildUserOp + sendUserOp ([335c6e](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/335c6e7bfc5ca1ad240e7cbfd678d905c7f16812))
- Reduced bundle size ([765a3e3](https://github.com/bcnmy/biconomy-client-sdk/commit/765a3e337fb9ad8f1f8dc92b5edcb1ed0940f94d))
- Added bundler abstraction during SmartAccount init ([591bbb4](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/591bbb4e37774b16cbe801d583d31b3a14608bc1))
- Added e2e tests that speak with prod bundler / paymasters ([4b4a53a](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/4b4a53aabdf9e22485599872332b3d63e8ddd87a))
- Added support for simultaneous ethers + viem signers ([8e4b2c8](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/8e4b2c86b871130befbf3b733cf503d24f7226a5))
- E2E tests for multichain modules ([ecc86e2](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/ecc86e2c7146046a981c3b6fd4bb29e4828b278b))
- E2E tests for session validation modules ([4ad7ea7](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/4ad7ea7f8eb6a28854dcce83834b2b7ff9ad3287))
- Added [TSDoc](https://bcnmy.github.io/biconomy-client-sdk) ([638dae](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/638daee0ed6924f67c5151a2d0e5a02d32e4bf23))
- Make txs more typesafe and default with valueOrData ([b1e5b5e](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/b1e5b5e02ab3a7fb99faa1d45b55e3cbe8d6bc93))
- Added toNexusClient alias ([232472](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/232472c788bed0619cf6295ade076b6ec3a9e0f8))
- Improve dx of using paymster to build userOps ([bb54888](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/bb548884e76a94a20329e49b18994503de9e3888))
- Add ethers v6 signer support ([9727fd](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/9727fd51e47d62904399d17d48f5c9d6b9e591e5))
- Improved dx of using gas payments with erc20 ([741806](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/741806da68457eba262e1a49be77fcc24360ba36))

### Chores

- Removed SmartAccount Base class in favour of Alchemy's ([be82732](https://github.com/bcnmy/biconomy-client-sdk/commit/be827327fafa858b1551ade0c8389293034cacbb))
- Migrate to viem v2 ([8ce04a](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/8ce04a56f6dcdfd1f44d9534f43e3c6eb8b3885d))
- Remove common + core-types dependencies ([673514](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/6735141fbd21a855aadf69011bc06c69e20f811b))
- Reincluded simulation flags ([25d2be](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/25d2bee339afd9d8c143fe6dad1898e28034be17))

### Bug Fixes

- Make silently failing paymaster calls throw an error instead ([693bf0](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/693bf08591427c03e317d64d0491e23b1c96ea30))
- Added string as a supported Transaction value type ([b905dc](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/b905dcf3f7849396573fc8b51f808cc68061ee11))
- Removed skipBundlerGasEstimation option ([b905dc](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/b905dcf3f7849396573fc8b51f808cc68061ee11))
- Ingest rpcUrl from SupportedSigners (ethers + viem) ([f56b4d](https://github.com/bcnmy/biconomy-client-sdk/pull/401/commits/f56b4da08f47af577c01a641b81a3ef9e354cf97))

## 3.1.3 (2023-12-28)

VERSION Bump Only.

## 3.1.2 (2023-12-28)

### Features

- Make entryPointAddress optional in config([cf35c4a](https://github.com/bcnmy/biconomy-client-sdk/pull/336/commits/cf35c4a8266d27648035d8c9d63f1b9157553128))

### Bug Fixes

- use undefined in place of ! + check on limits returned by paymaster and throw ([0376901](https://github.com/bcnmy/biconomy-client-sdk/commit/0376901b7aec8c268a6a3c654d147335974d78f3))
- change receipt status type from boolean to string to be compatible with bundler response. ([317f986](https://github.com/bcnmy/biconomy-client-sdk/pull/342/commits/317f986b7e8f08d3ccf1e68f12a0696f1116de6b))

## 3.1.1 (2023-11-09)

### Bug Fixes

- optimistic implementation for getNonce() and cache for isAccountDeployed ([5b1d4bf](https://github.com/bcnmy/biconomy-client-sdk/commit/5b1d4bfd7b5062d05bbb97286b833d879cd972b0))

### Reverts

- update paymaster check in estimateUserOpGas ([2eb0237](https://github.com/bcnmy/biconomy-client-sdk/commit/2eb0237b37425da3558801bbe9d0ce5d6fd696c9))

## 3.1.0 (2023-09-20)

Modular Account Abstraction is here. Contains NexusSmartAccount - an API for modular smart account.

### Bug Fixes

- add 10sec timeout limit for a test ([5d12fe7](https://github.com/bcnmy/biconomy-client-sdk/commit/5d12fe7d4b32e5c4628b971d22f6fc9cfcc6b414))
- avoid sending populated values of gas prices when estimating from bundler ([c58c9fc](https://github.com/bcnmy/biconomy-client-sdk/commit/c58c9fc29ee83978e1a90305e839002431db2b7b))
- NexusSmartAccount API Specs ([69a580e](https://github.com/bcnmy/biconomy-client-sdk/commit/69a580ea9e309141b500274aa95e20e24365b522))
- build errors ([9fb0475](https://github.com/bcnmy/biconomy-client-sdk/commit/9fb047534935b0600bd08a4de7e68fd91a8a089a))
- comments [#296](https://github.com/bcnmy/biconomy-client-sdk/issues/296) ([55b7376](https://github.com/bcnmy/biconomy-client-sdk/commit/55b7376336886226967b5bec5f11ba3ab750c5b6))
- estimation without bundler ([5e49473](https://github.com/bcnmy/biconomy-client-sdk/commit/5e49473e7745c2e87e241731ef8ca1f65ee90388))
- gitInitCode cache issue ([4df3502](https://github.com/bcnmy/biconomy-client-sdk/commit/4df3502204e3c6c0c6faa90ba2c8aa0d6e826e48))
- lint warning and errors ([2135498](https://github.com/bcnmy/biconomy-client-sdk/commit/2135498896beb54d25add820c1521ffa22d5db7c))
- unshift error for batch ([4d090e8](https://github.com/bcnmy/biconomy-client-sdk/commit/4d090e8fbc7e7bcc03805d8dd28c738d5c95dae7))

### Features

- get fee quote or data method in biconomy paymaster ([47748a6](https://github.com/bcnmy/biconomy-client-sdk/commit/47748a6384c2b74e1d9be4d570554098e1ac02e7))
- update responses to support calculateGasLimits flag + update interfaces ([55bbd38](https://github.com/bcnmy/biconomy-client-sdk/commit/55bbd38b4ef8acaf8da1d52e36846557b134aba4))
- using hybrid paymaster interface ([5fc56a7](https://github.com/bcnmy/biconomy-client-sdk/commit/5fc56a7db2de4a3f4bb87cd4d75584e79010b206))

## 3.0.0 (2023-08-28)

VERSION Bump Only.

Modular SDK - consists stable version of below updates done in Alphas.

## 3.1.1-alpha.0 (2023-08-02)

### Bug Fixes

VERSION Bump Only.

# 3.1.0-alpha.0 (2023-07-24)

### Bug Fixes

- avoid sending populated values of gas prices when estimating from bundler ([c58c9fc](https://github.com/bcnmy/biconomy-client-sdk/commit/c58c9fc29ee83978e1a90305e839002431db2b7b))

## 3.0.0-alpha.0 (2023-07-12)

### Bug Fixes

- estimation without bundler ([5e49473](https://github.com/bcnmy/biconomy-client-sdk/commit/5e49473e7745c2e87e241731ef8ca1f65ee90388))
- unshift error for batch ([4d090e8](https://github.com/bcnmy/biconomy-client-sdk/commit/4d090e8fbc7e7bcc03805d8dd28c738d5c95dae7))

### Features

- get fee quote or data method in biconomy paymaster ([47748a6](https://github.com/bcnmy/biconomy-client-sdk/commit/47748a6384c2b74e1d9be4d570554098e1ac02e7))
- update responses to support calculateGasLimits flag + update interfaces ([55bbd38](https://github.com/bcnmy/biconomy-client-sdk/commit/55bbd38b4ef8acaf8da1d52e36846557b134aba4))
- using hybrid paymaster interface ([5fc56a7](https://github.com/bcnmy/biconomy-client-sdk/commit/5fc56a7db2de4a3f4bb87cd4d75584e79010b206))
