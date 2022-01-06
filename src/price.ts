import * as https from "https";
import { IncomingMessage } from "http";
import Ajv, { JSONSchemaType } from "ajv";
import { Executor } from "./promises";
import { Chain } from "./chain";

// +------+
// | HTTP |
// +------+

function requestJSON(url: string): Promise<unknown> {
    const f: Executor<unknown, void> = (resolve, reject) => {
        const callback = (res: IncomingMessage): void => {
            res.on("error", reject);
            res.on("data", (buffer: Buffer): void => {
                const content = buffer.toString();
                let parsed: unknown;
                try {
                    parsed = JSON.parse(content);
                } catch (e) {
                    // if (e instanceof SyntaxError) {}
                    reject(e);
                }
                resolve(parsed);
            });
        };
        const req = https.request(url, callback);
        req.on("error", reject);
        req.end();
    };
    return new Promise(f);
}

// +-----------+
// | Constants |
// +-----------+

type NativeToken = "avalanche-2" | "binancecoin" | "ethereum" | "matic-network" | "fantom";

type ChainMapping<T> = {
    [chain in Chain]: T;
};

const natives: ChainMapping<NativeToken> = {
    avalanche: "avalanche-2",
    ethereum: "ethereum",
    "binance-smart-chain": "binancecoin",
    "polygon-pos": "matic-network",
    fantom: "fantom",
};

export type VsCurrency = "btc" | "eth" | "usd";

// +--------------+
// | Simple price |
// +--------------+

// type SimplePricePayload = {
//     [key in VsCurrency]: number;
// };

type SimplePrice = {
    [token in NativeToken]: {
        [key in VsCurrency]: number;
    };
};

function isSimplePrice(x: unknown): x is SimplePrice {
    const prop = (key: string): object => {
        return {
            properties: {
                [key]: { type: "number" },
            },
            required: [key],
            additionalProperties: false,
        };
    };

    const payload = (key: string): object => {
        return {
            properties: {
                [key]: {
                    type: "object",
                    required: [],
                    oneOf: [prop("usd"), prop("btc"), prop("eth")],
                },
            },
            required: [key],
            additionalProperties: false,
        };
    };

    const schema: JSONSchemaType<SimplePrice> = {
        type: "object",
        required: [],
        oneOf: [
            payload("avalanche-2"),
            payload("binancecoin"),
            payload("ethereum"),
            payload("matic-network"),
            payload("fantom"),
        ],
    };

    const ajv = new Ajv({
        strictRequired: true,
    });
    const validate = ajv.compile(schema);
    const check = validate(x);

    return check;
}

export function getSimplePrice(
    chain: Chain,
    currency: VsCurrency = "usd"
): Promise<number> {
    const id: string = natives[chain];
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=${currency}`;

    return requestJSON(url).then((parsed: unknown): number => {
        if (isSimplePrice(parsed)) {
            const token = natives[chain];
            return parsed[token][currency];
        }
        const resp = JSON.stringify(parsed);
        throw new Error(
            `response does not conform to expected simple price scheme: ${resp}`
        );
    });
}

// +-------------+
// | Token price |
// +-------------+

type TokenPrice = {
    [token: string]: {
        [key in VsCurrency]: number;
    };
};

function isTokenPrice(x: unknown, tokenAddress: string): x is TokenPrice {
    const prop = (key: string): object => {
        return {
            properties: {
                [key]: { type: "number" },
            },
            required: [key],
            additionalProperties: false,
        };
    };

    const schema: JSONSchemaType<TokenPrice> = {
        type: "object",
        properties: {
            [tokenAddress]: {
                type: "object",
                required: [],
                oneOf: [prop("usd"), prop("btc"), prop("eth")],
            },
        },
        required: [],
        additionalProperties: false,
    };

    const ajv = new Ajv({
        strictRequired: true,
    });
    const validate = ajv.compile(schema);
    const check = validate(x);

    return check;
}

/**
 * getPrice returns a token's price in the given target
 * currency. Performs a single request to CoinGecko's API.
 *
 * @param chain Which chain this token lives on.  Passed directly to CoinGecko's API.
 * @param tokenAddress Address of the token contract.
 * @param currency Currency of the price returned.  Again, passed directly to CoinGecko.
 * @returns
 */
export function getTokenPrice(
    chain: Chain,
    tokenAddress: string,
    currency: VsCurrency = "usd"
): Promise<number> {
    tokenAddress = tokenAddress.toLowerCase();
    const url = `https://api.coingecko.com/api/v3/simple/token_price/${chain}?contract_addresses=${tokenAddress}&vs_currencies=${currency}`;
    return requestJSON(url).then((parsed: unknown): number => {
        if (isTokenPrice(parsed, tokenAddress) && tokenAddress in parsed) {
            return parsed[tokenAddress][currency];
        }
        const resp = JSON.stringify(parsed);
        throw new Error(
            `response does not conform to expected token price scheme: ${resp}`
        );
    });
}

export default function getPrice(
    chain: Chain,
    tokenAddress = "native",
    currency: VsCurrency = "usd"
): Promise<number> {
    if (!tokenAddress || tokenAddress === "native") {
        return getSimplePrice(chain, currency);
    }
    return getTokenPrice(chain, tokenAddress, currency);
}
