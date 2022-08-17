#!/bin/sh
# npm run unbuild
# npm run build
# npm link
rm -rf node_modules
rm -rf packages/core-types/node_modules
rm -rf packages/core-types/package-lock.json
rm -rf packages/ethers-lib/node_modules
rm -rf packages/ethers-lib/package-lock.json
rm -rf packages/node_client/node_modules
rm -rf packages/node_client/package-lock.json
rm -rf packages/relayer/node_modules
rm -rf packages/relayer/package-lock.json
rm -rf packages/smart-account/node_modules
rm -rf packages/smart-account/package-lock.json
rm -rf packages/transactions/node_modules
rm -rf packages/transactions/package-lock.json
