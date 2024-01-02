!/bin/sh
for dir in ./packages/*; do (cd "$dir" && yarn link); done