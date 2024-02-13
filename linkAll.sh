!/bin/sh
for dir in ./packages/*; do (cd "$dir" && yarn link); done
cd ./packages/account && yarn link '@biconomy-devx/bundler' '@biconomy-devx/modules' '@biconomy-devx/paymaster' '@biconomy-devx/common' 