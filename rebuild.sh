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

rm -rf packages/common/node_modules
rm -rf packages/common/package-lock.json
rm -rf packages/common/dist

rm -rf packages/paymaster/node_modules
rm -rf packages/paymaster/package-lock.json
rm -rf packages/paymaster/dist

rm -rf packages/modules/node_modules
rm -rf packages/modules/package-lock.json
rm -rf packages/modules/dist

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