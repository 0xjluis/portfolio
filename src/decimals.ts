/* eslint-disable @typescript-eslint/no-explicit-any */

import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { makeToken } from "./help3";
import { Executor } from "./promises";

//eslint-disable-next-line @typescript-eslint/no-var-requires
const sqlite3 = require("sqlite3").verbose();

type Callback = (
    err: object | null,
    row: { value: number } | undefined
) => void;

async function database<T>(f: (db: any) => Promise<T>): Promise<T> {
    type MessageCallback = (err?: { message: string }) => void;
    const cb = (msg: string): MessageCallback => {
        return (err) => {
            if (err) {
                console.error(err);
                console.error(err.message);
            } else {
                console.log(msg);
            }
        };
    };

    const db = new sqlite3.Database(
        "decimals.db",
        cb("INF Connected to decimals.db.")
    );

    const create = `CREATE TABLE IF NOT EXISTS "decimals" (
        "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        "chain" varchar(64) NOT NULL,
        "token" varchar(42) NOT NULL,
        "value" smallint unsigned NOT NULL CHECK ("value" >= 0)
    );
    CREATE UNIQUE INDEX "decimals_chain_token_4c316d1d_uniq" ON "decimals" ("chain", "token");`;

    const executor: Executor<T, void> = (resolve, reject) => {
        db.serialize(function () {
            db.run(create);
            f(db)
                .then(resolve, reject)
                .then((_value) => {
                    db.close(cb("INF Closed decimals.db."));
                });
        });
    };

    return new Promise(executor);
}

export async function selectDecimals(
    chain: string,
    tokenAddress: string
): Promise<number> {
    const select = `SELECT "value" FROM "decimals" WHERE "chain" = $chain AND "token" = $token;`;
    return database((db: any): Promise<number> => {
        const executor: Executor<number, void> = (resolve, reject) => {
            const params = {
                $chain: chain,
                $token: tokenAddress,
            };
            const cb: Callback = (err, row) => {
                if (err == null && row != null) {
                    resolve(row.value);
                } else {
                    reject(err);
                }
            };
            db.get(select, params, cb);
        };
        return new Promise(executor);
    });
}

export async function insertDecimals(
    chain: string,
    tokenAddress: string,
    value: number
): Promise<void> {
    const insert = `INSERT INTO "decimals" VALUES (NULL, $chain, $token, $value);`;
    return database((db: any) => {
        const executor: Executor<void, void> = (resolve, reject) => {
            const cb: Callback = (err, _row) => {
                if (err == null) {
                    resolve();
                } else {
                    reject(err);
                }
            };
            db.run(
                insert,
                {
                    $chain: chain,
                    $token: tokenAddress,
                    $value: value,
                },
                cb
            );
        };
        return new Promise(executor);
    });
}

function callDecimals(
    web3: Web3,
    chain: string,
    tokenAddress: string
): Promise<number> {
    // TODO: Check cache.
    const contract: Contract = makeToken(web3, tokenAddress);
    return contract.methods
        .decimals()
        .call()
        .catch((reason?: any): number => {
            const provider: string | undefined =
                web3.currentProvider?.toString();
            console.error(
                `decimals failed: chain=${chain} provider=${provider} token=${tokenAddress} reason=${reason}`
            );
            return 0;
        });
}

export default async function getDecimals(
    web3: Web3,
    chain: string,
    tokenAddress: string
): Promise<number> {
    return selectDecimals(chain, tokenAddress).catch((_err): Promise<number> => {
        return callDecimals(web3, chain, tokenAddress).then((value): Promise<number> => {
            return insertDecimals(chain, tokenAddress, value).then(() => value);
        });
    })
}
