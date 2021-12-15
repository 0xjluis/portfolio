#!/bin/bash

DATA=$(cat config.json)

curl \
    --verbose \
    --header "Content-Type: application/json" \
    --request POST \
    --data "$DATA" \
    http://127.0.0.1:3334/