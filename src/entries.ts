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

export function readWallets(path = "wallets.json"): Wallets {
    const content = fs.readFileSync(path, { encoding: "ascii" });
    const walletEntries = JSON.parse(content);
    for (const wallet in walletEntries) {
        if (Object.prototype.hasOwnProperty.call(walletEntries, wallet)) {
            const entries = walletEntries[wallet];
            entries.forEach((element: unknown): void => {
                if (!isEntry(element)) {
                    const resp = JSON.stringify(element);
                    throw new Error(`element is not an Entry: ${resp}`);
                }
            });
        }
    }
    return walletEntries;
}
