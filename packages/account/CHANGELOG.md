# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 2.2.4 (2023-12-28)

### Features

* Make entryPointAddress optional in config([cf35c4a](https://github.com/bcnmy/biconomy-client-sdk/pull/336/commits/cf35c4a8266d27648035d8c9d63f1b9157553128))

### Bug Fixes

* use undefined in place of ! + check on limits returned by paymaster and throw ([0376901](https://github.com/bcnmy/biconomy-client-sdk/commit/0376901b7aec8c268a6a3c654d147335974d78f3))
* change receipt status type from boolean to string to be compatible with bundler response. ([317f986](https://github.com/bcnmy/biconomy-client-sdk/pull/342/commits/317f986b7e8f08d3ccf1e68f12a0696f1116de6b))

## 3.1.1 (2023-11-09)


### Bug Fixes

* optimistic implementation for getNonce() and cache for isAccountDeployed ([5b1d4bf](https://github.com/bcnmy/biconomy-client-sdk/commit/5b1d4bfd7b5062d05bbb97286b833d879cd972b0))


### Reverts

* update paymaster check in estimateUserOpGas ([2eb0237](https://github.com/bcnmy/biconomy-client-sdk/commit/2eb0237b37425da3558801bbe9d0ce5d6fd696c9))





## 3.1.0 (2023-09-20)
Modular Account Abstraction is here. Contains BiconomySmartAccountV2 - an API for modular smart account.

### Bug Fixes

* add 10sec timeout limit for a test ([5d12fe7](https://github.com/bcnmy/biconomy-client-sdk/commit/5d12fe7d4b32e5c4628b971d22f6fc9cfcc6b414))
* avoid sending populated values of gas prices when estimating from bundler ([c58c9fc](https://github.com/bcnmy/biconomy-client-sdk/commit/c58c9fc29ee83978e1a90305e839002431db2b7b))
* BiconomySmartAccountV2 API Specs ([69a580e](https://github.com/bcnmy/biconomy-client-sdk/commit/69a580ea9e309141b500274aa95e20e24365b522))
* build errors ([9fb0475](https://github.com/bcnmy/biconomy-client-sdk/commit/9fb047534935b0600bd08a4de7e68fd91a8a089a))
* comments [#296](https://github.com/bcnmy/biconomy-client-sdk/issues/296) ([55b7376](https://github.com/bcnmy/biconomy-client-sdk/commit/55b7376336886226967b5bec5f11ba3ab750c5b6))
* estimation without bundler ([5e49473](https://github.com/bcnmy/biconomy-client-sdk/commit/5e49473e7745c2e87e241731ef8ca1f65ee90388))
* gitInitCode cache issue ([4df3502](https://github.com/bcnmy/biconomy-client-sdk/commit/4df3502204e3c6c0c6faa90ba2c8aa0d6e826e48))
* lint warning and errors ([2135498](https://github.com/bcnmy/biconomy-client-sdk/commit/2135498896beb54d25add820c1521ffa22d5db7c))
* unshift error for batch ([4d090e8](https://github.com/bcnmy/biconomy-client-sdk/commit/4d090e8fbc7e7bcc03805d8dd28c738d5c95dae7))


### Features

* get fee quote or data method in biconomy paymaster ([47748a6](https://github.com/bcnmy/biconomy-client-sdk/commit/47748a6384c2b74e1d9be4d570554098e1ac02e7))
* update responses to support calculateGasLimits flag + update interfaces ([55bbd38](https://github.com/bcnmy/biconomy-client-sdk/commit/55bbd38b4ef8acaf8da1d52e36846557b134aba4))
* using hybrid paymaster interface ([5fc56a7](https://github.com/bcnmy/biconomy-client-sdk/commit/5fc56a7db2de4a3f4bb87cd4d75584e79010b206))





## 3.0.0 (2023-08-28)

VERSION Bump Only.

Modular SDK - consists stable version of below updates done in Alphas.



## 3.1.1-alpha.0 (2023-08-02)


### Bug Fixes

VERSION Bump Only.





# 3.1.0-alpha.0 (2023-07-24)


### Bug Fixes

* avoid sending populated values of gas prices when estimating from bundler ([c58c9fc](https://github.com/bcnmy/biconomy-client-sdk/commit/c58c9fc29ee83978e1a90305e839002431db2b7b))




## 3.0.0-alpha.0 (2023-07-12)


### Bug Fixes

* estimation without bundler ([5e49473](https://github.com/bcnmy/biconomy-client-sdk/commit/5e49473e7745c2e87e241731ef8ca1f65ee90388))
* unshift error for batch ([4d090e8](https://github.com/bcnmy/biconomy-client-sdk/commit/4d090e8fbc7e7bcc03805d8dd28c738d5c95dae7))


### Features

* get fee quote or data method in biconomy paymaster ([47748a6](https://github.com/bcnmy/biconomy-client-sdk/commit/47748a6384c2b74e1d9be4d570554098e1ac02e7))
* update responses to support calculateGasLimits flag + update interfaces ([55bbd38](https://github.com/bcnmy/biconomy-client-sdk/commit/55bbd38b4ef8acaf8da1d52e36846557b134aba4))
* using hybrid paymaster interface ([5fc56a7](https://github.com/bcnmy/biconomy-client-sdk/commit/5fc56a7db2de4a3f4bb87cd4d75584e79010b206))
