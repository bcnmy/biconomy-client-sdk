#!/bin/sh
rm -rf package-lock.json
rm -rf yarn.lock
rm -rf node_modules

rm -rf packages/account-abstraction/node_modules
rm -rf packages/account-abstraction/package-lock.json
rm -rf packages/account-abstraction/dist

rm -rf packages/common/node_modules
rm -rf packages/common/package-lock.json
rm -rf packages/common/dist

rm -rf packages/core-types/node_modules
rm -rf packages/core-types/package-lock.json
rm -rf packages/core-types/dist

rm -rf packages/ethers-lib/node_modules
rm -rf packages/ethers-lib/artifacts
rm -rf packages/ethers-lib/typechain
rm -rf packages/ethers-lib/cache
rm -rf packages/ethers-lib/package-lock.json
rm -rf packages/ethers-lib/dist

rm -rf packages/node-client/node_modules
rm -rf packages/node-client/package-lock.json
rm -rf packages/node-client/dist

rm -rf packages/relayer/node_modules
rm -rf packages/relayer/package-lock.json
rm -rf packages/relayer/dist

rm -rf packages/smart-account/node_modules
rm -rf packages/smart-account/package-lock.json
rm -rf packages/smart-account/dist

rm -rf packages/transactions/node_modules
rm -rf packages/transactions/yarn.lock
rm -rf packages/transactions/package-lock.json
rm -rf packages/transactions/dist

rm -rf packages/web3-auth/node_modules
rm -rf packages/web3-auth/yarn.lock
rm -rf packages/web3-auth/package-lock.json
rm -rf packages/web3-auth/dist

rm -rf packages/web3-auth-native/node_modules
rm -rf packages/web3-auth-native/yarn.lock
rm -rf packages/web3-auth-native/package-lock.json
rm -rf packages/web3-auth-native/dist

rm -rf packages/transak/node_modules
rm -rf packages/transak/yarn.lock
rm -rf packages/transak/package-lock.json
rm -rf packages/transak/dist

#npx lerna bootstrap --force-local
#npm run build
#npm link