import { JSONSchemaType } from "ajv";
import * as fs from "fs";

interface Token {
    readonly chain: string;
    readonly tokenAddress?: string;
}

interface TokenValue extends Token {
    readonly value: number;
}

interface Transaction {
    readonly payed: TokenValue;
    readonly fee?: TokenValue;
}

export interface Entry extends Token {
    readonly symbol?: string;
    readonly invested?: number | Transaction[];

    readonly stakedAddress?: string;
    readonly initial?: number;
    readonly precision?: number;
}

export interface Entries {
    [wallet: string]: readonly Entry[];
}

function checkEntry(x: unknown): x is Entry {
    const tokenValueSchema: JSONSchemaType<{
        chain?: string;
        tokenAddress?: string;
        value: number;
    }> = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://example.com/product.schema.json",
        type: "object",
        properties: {
            chain: { type: "string" },
            tokenAddress: { type: "string" },
            value: { type: "number" },
        },
        required: ["value"],
    };
    const transactionSchema: JSONSchemaType<Transaction> = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://example.com/product.schema.json",
        type: "object",
        properties: {
            payed: tokenValueSchema,
            fee: tokenValueSchema,
        },
        required: ["payed"],
    };
    const schema: JSONSchemaType<Entry> = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://example.com/product.schema.json",
        type: "object",
        properties: {
            chain: { type: "string" },
            tokenAddress: { type: "string" },
            symbol: { type: "string" },
            invested: {
                oneOf: [
                    {
                        type: "number",
                    },
                    {
                        type: "array",
                        items: transactionSchema,
                    },
                ],
            },
        },
    };

    const ajv = new Ajv({
        strict: true,
        allErrors: true,
    });

    const guard = ajv.compile(schema);
    const check = guard(x);

    return check;
}

export function readEntries(path = "entries.json"): Entries {
    const content = fs.readFileSync(path, { encoding: "ascii" });
    const walletEntries = JSON.parse(content);
    console.log(walletEntries);
    for (const wallet in walletEntries) {
        if (Object.prototype.hasOwnProperty.call(walletEntries, wallet)) {
            const entries = walletEntries[wallet];
            entries.map(checkEntry);
            // entries.forEach((entry: Entry) => {
            //     checkEntry(entry);
            //     if (!isEntry(entry)) {
            //         const repr = JSON.stringify(entry);
            //         throw new Error(`not a valid entry: ${repr}`);
            //     }
            // });
        }
    }
    throw new Error("TODO");
}
