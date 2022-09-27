#!/bin/sh

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
rm -rf packages/ethers-lib/package-lock.json
rm -rf packages/ethers-lib/dist

rm -rf packages/gas-estimator/node_modules
rm -rf packages/gas-estimator/package-lock.json
rm -rf packages/gas-estimator/dist

rm -rf packages/node_client/node_modules
rm -rf packages/node_client/package-lock.json
rm -rf packages/node_client/dist

rm -rf packages/relayer/node_modules
rm -rf packages/relayer/package-lock.json
rm -rf packages/relayer/dist

rm -rf packages/smart-account/node_modules
rm -rf packages/smart-account/package-lock.json
rm -rf packages/smart-account/dist

rm -rf packages/transactions/node_modules
rm -rf packages/transactions/package-lock.json
rm -rf packages/transactions/dist

npx lerna bootstrap --force-local
npm run build
npm link