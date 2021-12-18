import * as fs from "fs";
import { Path } from "typescript";

interface Token {
    readonly chain: string;
    readonly tokenAddress: string;
}

interface TokenValue extends Token {
    readonly value: number;
}

interface Transaction {
    readonly payed: TokenValue;
    readonly fee?: TokenValue;
}

export interface Entry extends Token {
    readonly symbol: string;
    readonly invested: number | Transaction[];

    readonly stakedAddress?: string;
    readonly initial?: number;
    readonly precision?: number;
}

export interface Entries {
    [wallet: string]: readonly Entry[];
}



function assert(x: unknown, prop: string, want: string, required = true) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getProperty(o: any, propertyName: string): unknown {
        return o[propertyName]; // o[propertyName] is of type T[K]
    }

    if (typeof x !== "object") {
        throw new Error(`x is not an object, x=${x}`);
    }

    if (x == null) {
        throw new Error("x is null");
    }

    const has = Object.hasOwnProperty.call(x, prop);
    if (required && !has) {
        const repr = JSON.stringify(x);
        throw new Error(`required property ${prop} is missing, x=${repr}`);
    }

    if (has) {
        const value = getProperty(x, prop);
        if (value == null) {
            const repr = JSON.stringify(x);
            throw new Error(`property ${prop} is null, x=${repr}`);
        }

        const have = typeof value;
        if (have !== want) {
            const repr = JSON.stringify(x);
            const message = `type assertion of property ${prop} failed: have=${have} want=${want} in object ${repr}`;
            throw new Error(message);
        }
    }
}

function checkEntry(x: unknown): x is Entry {
    // Required fields
    assert(x, "chain", "string");
    assert(x, "tokenAddress", "string");
    assert(x, "symbol", "string");
    if (typeof x.invested !== "number" && !Array.isArray(x.invested)) {
        console.error(
            "Entry.invested should be either number or Transaction[]"
        );
    }
    // Optional fields
    assert(x, "stakedAddress", "string", false);
    assert(x, "initial", "number", false);
    assert(x, "precision", "number", false);
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
