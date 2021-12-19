#!/bin/bash

URL="http://127.0.0.1:3334/"
# URL="http://evening-inlet-31733.herokuapp.com/"
DATA=$(cat wallets.json)

curl \
    --verbose \
    --header "Content-Type: application/json" \
    --request POST \
    --data "$DATA" \
    "$URL"
