import * as https from "https";
import { IncomingMessage } from "http";
import { Executor } from "./promises";
import Ajv, { JSONSchemaType } from "ajv";

export type Chain =
    | "avalanche"
    | "binance-smart-chain"
    | "ethereum"
    | "polygon-pos";

type NativeToken = "avalanche-2" | "binancecoin" | "ethereum" | "matic-network";

type ChainMapping<T> = {
    [chain in Chain]: T;
};

const natives: ChainMapping<NativeToken> = {
    avalanche: "avalanche-2",
    ethereum: "ethereum",
    "binance-smart-chain": "binancecoin",
    "polygon-pos": "matic-network",
};

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
                    // if (e instanceof SyntaxError) {
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

type VsCurrency = "btc" | "eth" | "usd";

type SimplePricePayload = {
    [key in VsCurrency]: number;
};

type SimplePrice = {
    [token in NativeToken]: SimplePricePayload;
};

function isSimplePrice(x: unknown): x is SimplePrice {
    const payload: JSONSchemaType<SimplePricePayload> = {
        type: "object",
        required: [],
        oneOf: [
            {
                properties: {
                    usd: { type: "number" },
                },
                required: ["usd"],
            },
            {
                properties: {
                    btc: { type: "number" },
                },
                required: ["btc"],
            },
            {
                properties: {
                    eth: { type: "number" },
                },
                required: ["eth"],
            },
        ],
    };
    const schema: JSONSchemaType<SimplePrice> = {
        type: "object",
        required: [],
        oneOf: [
            {
                properties: {
                    "avalanche-2": payload,
                },
                required: ["avalanche-2"],
            },
            {
                properties: {
                    binancecoin: payload,
                },
                required: ["binancecoin"],
            },
            {
                properties: {
                    ethereum: payload,
                },
                required: ["ethereum"],
            },
            {
                properties: {
                    "matic-network": payload,
                },
                required: ["matic-network"],
            },
        ],
    };

    const ajv = new Ajv({
        strict: true,
        allErrors: true,
    });

    const guard = ajv.compile(schema);
    const check = guard(x);

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
        throw new Error(`bad response: ${resp}`);
    });
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
    chain: string,
    tokenAddress: string,
    currency = "usd"
): Promise<number> {
    chain = chain.toLowerCase();
    tokenAddress = tokenAddress.toLowerCase();

    const url = `https://api.coingecko.com/api/v3/simple/token_price/${chain}?contract_addresses=${tokenAddress}&vs_currencies=${currency}`;

    return (
        requestJSON(url)
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((value: any): number => {
                // TODO: USE THE DAMN AJV LIBRARY!
                if (
                    value &&
                    tokenAddress in value &&
                    currency in value[tokenAddress]
                ) {
                    return value[tokenAddress][currency];
                }
                const body = JSON.stringify(value);
                const message = `bad response: body=${body}`;
                throw new Error(message);
            })
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            .catch((reason: any): number => {
                console.error(
                    `ERR getPrice.request failed:`,
                    `url=${url}`,
                    `chain=${chain}`,
                    `token=${tokenAddress}`,
                    `currency=${currency}`,
                    `reason=${reason}`
                );
                return 0;
            })
    );
}

export default function getPrice(
    chain: string,
    tokenAddress: string,
    currency = "usd"
): Promise<number> {
    chain = chain.toLowerCase();
    tokenAddress = tokenAddress.toLowerCase();
    return getTokenPrice(chain, tokenAddress, currency);
}
