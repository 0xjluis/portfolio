# Portfolio

Track your Ethereum/web3 portfolio.

### Usage

1. Add `wallets.json` to your root directory.  Valid chain keys are listed [here](https://api.coingecko.com/api/v3/asset_platforms).

```JSON
{
    "WALLET_ONE_E_G_0x220866b1a2219f40e72f5c628b65d54268ca3a9d": [
        {
            "chain": "ethereum",
            "symbol": "XDEFI",
            "tokenAddress": "0x72b886d09c117654ab7da13a14d603001de0b777",
            "transactions": [
                {
                    "amountOut": {
                        "symbol": "WETH",
                        "tokenAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                        "value": 1.5
                    },
                    "amountIn": 5000,
                    "fee": 0.005
                }
            ],
            "precision": 0
        },
        {
            "chain": "ethereum",
            "symbol": "SQUID",
            "tokenAddress": "0x21ad647b8f4fe333212e735bfc1f36b4941e6ad2",
            "transactions": [
                {
                    "amountOut": {
                        "symbol": "WETH",
                        "tokenAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                        "value": 100
                    },
                    "amountIn": 1
                    "fee": 0.005
                },
                {
                    "amountOut": {
                        "symbol": "WETH",
                        "tokenAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                        "value": 200
                    },
                    "amountIn": 2,
                    "fee": 0.005
                }
            ],
            "stakedAddress": "0x9d49bfc921f36448234b0efa67b5f91b3c691515",
            "precision": 6
        },
        {
            "chain": "polygon-pos",
            "symbol": "KLIMA",
            "tokenAddress": "0x4e78011ce80ee02d2c3e649fb657e45898257815",
            "transactions": [
                {
                    "amountOut": {
                        "symbol": "WETH",
                        "tokenAddress": "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                        "value": 10
                    },
                    "amountIn": 70,
                    "fee": 0.005
                }
            ],
            "stakedAddress": "0xb0C22d8D350C67420f06F48936654f567C73E8C8"
        }
    ],
    "WALLET_TWO": [
        {
            ...
        }
    ]
}
```

2. Set needed environment variables or use the .env file.
```bash
WEB3_INFURA_PROJECT_ID=...
```

3. Start.
```bash
$ yarn install
$ yarn run cli
```
