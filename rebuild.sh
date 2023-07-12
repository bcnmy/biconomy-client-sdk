#!/bin/sh
rm -rf package-lock.json
rm -rf yarn.lock
rm -rf node_modules

rm -rf packages/account/node_modules
rm -rf packages/account/package-lock.json
rm -rf packages/account/dist

rm -rf packages/bundler/node_modules
rm -rf packages/bundler/package-lock.json
rm -rf packages/bundler/dist

rm -rf packages/paymaster/node_modules
rm -rf packages/paymaster/package-lock.json
rm -rf packages/paymaster/dist


rm -rf packages/common/node_modules
rm -rf packages/common/package-lock.json
rm -rf packages/common/dist

rm -rf packages/core-types/node_modules
rm -rf packages/core-types/package-lock.json
rm -rf packages/core-types/dist

rm -rf packages/node-client/node_modules
rm -rf packages/node-client/package-lock.json
rm -rf packages/node-client/dist


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

rm -rf packages/particle-auth/node_modules
rm -rf packages/particle-auth/yarn.lock
rm -rf packages/particle-auth/package-lock.json
rm -rf packages/particle-auth/dist

#npx lerna bootstrap --force-local
#npm run build
#npm link