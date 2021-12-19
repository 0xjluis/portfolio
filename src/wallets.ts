import * as fs from "fs";
import Ajv, { JSONSchemaType } from "ajv";
import { Chain } from "./chain";

interface TokenValue {
    readonly tokenAddress: string;
    readonly symbol: string;
    readonly value: number;
}

export interface Transaction {
    readonly amountIn: number;
    readonly amountOut: TokenValue;
    readonly fee: number;
}

export type Transactions = Transaction[];

export interface Entry {
    readonly chain: Chain;
    readonly tokenAddress: string;
    readonly symbol: string;
    readonly transactions: Transactions;
    readonly stakedAddress?: string;
    readonly precision?: number;
}

export interface Wallets {
    [wallet: string]: readonly Entry[];
}

function isEntry(x: unknown): x is Entry {
    const tokenValueSchema: JSONSchemaType<TokenValue> = {
        type: "object",
        properties: {
            symbol: { type: "string" },
            tokenAddress: { type: "string" },
            value: { type: "number" },
        },
        required: ["symbol", "tokenAddress", "value"],
        additionalProperties: false,
    };
    const transactionSchema: JSONSchemaType<Transaction> = {
        type: "object",
        properties: {
            amountOut: tokenValueSchema,
            amountIn: { type: "number" },
            fee: { type: "number" },
        },
        required: ["amountOut", "amountIn", "fee"],
        additionalProperties: false,
    };
    const transactionsSchema: JSONSchemaType<Transactions> = {
        type: "array",
        items: transactionSchema,
    };
    const entrySchema: JSONSchemaType<Entry> = {
        type: "object",
        properties: {
            chain: { type: "string" },
            symbol: { type: "string" },
            tokenAddress: { type: "string" },
            transactions: transactionsSchema,
            stakedAddress: { type: "string", nullable: true },
            precision: { type: "number", nullable: true },
        },
        required: ["chain", "symbol", "tokenAddress", "transactions"],
    };

    const ajv = new Ajv({
        strict: true,
        allErrors: true,
    });

    const guard = ajv.compile(entrySchema);
    const check = guard(x);

    return check;
}

export function isWallets(x: Wallets): x is Wallets {
    for (const wallet in x) {
        if (Object.prototype.hasOwnProperty.call(x, wallet)) {
            const entries = x[wallet];
            for (let index = 0; index < entries.length; index++) {
                const element = entries[index];
                if (!isEntry(element)) {
                    return false;
                }
            }
        }
    }
    return true;
}

export function readWallets(path = "wallets.json"): Wallets {
    const content = fs.readFileSync(path, { encoding: "ascii" });
    const wallets = JSON.parse(content);
    if (!isWallets(wallets)) {
        throw new Error(`element is not an Entry: content`);
    }
    return wallets;
}
