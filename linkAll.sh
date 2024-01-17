!/bin/sh
for dir in ./packages/*; do (cd "$dir" && yarn link); done
cd ./packages/account && yarn link '@biconomy/bundler' '@biconomy/modules' '@biconomy/paymaster'