# Portfolio

Track your portfolio.

### Usage

1. Adapt `config.json` to your portfolio.  Valid chain keys are listed [here](https://api.coingecko.com/api/v3/asset_platforms).

```JSON
{
    "ethereum": {
        "0xWALLET_ONE": [
            {
                "symbol": "COMP",
                "invested": 10000,
                "address": "0xc00e94Cb662C3520282E6f5717214004A7f26888"
            }
        ],

        "0xWALLET_TWO": [
            {
                "symbol": "OHM",
                "invested": 20000,
                "address": "0x383518188c0c6d7730d91b2c03a03c837814a899",
                "staked": "0x04f2694c8fcee23e8fd0dfea1d4f5bb8c352111f"
            }
        ]
    },

    "avalanche": {
        "0xWALLET_THREE": [
            {
                "symbol": "WAVAX",
                "invested": 30000,
                "address": "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"
            }
        ]
    },

    "binance-smart-chain": {
        "0xWALLET_FOUR": []
    },

    "polygon-pos": {
        "0xWALLET_FIVE": []
    }
}
```

2. Set environment variables or use .env
```bash
WEB3_INFURA_PROJECT_ID=...
```

3. Start
```bash
$ npm run start
```
