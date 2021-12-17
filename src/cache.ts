// Exports a single class Decimals that handles calling and caching
// of IERC20.decimals().

import Web3 from "web3";
import { Database, RunResult, Statement } from "sqlite3";
import { callDecimals, callSymbol } from "./help3";
import { Executor, Resolve, Reject } from "./promises";

// +--------+
// | SQLite |
// +--------+

// SQLite helper types

type ErrorCallback = (err: Error | null) => void;

type RunResultCallback = (this: RunResult, err: Error | null) => void;

//eslint-disable-next-line @typescript-eslint/no-explicit-any
type StatementCallback = (this: Statement, err: Error | null, row: any) => void;

// Specific error type for the case of no row returned.
class UndefinedRow extends Error {
    constructor(message?: string) {
        super(message);

        // https://bit.ly/3dSw9WQ
        Object.setPrototypeOf(this, UndefinedRow.prototype);
    }
}

/**
 * promisedCallback returns a convenient callback that can be used
 * with `Database.run` and that invokes `resolve` or `reject` on
 * respective conditions.
 *
 * @param resolve
 * @param reject
 * @returns
 */
function promisedCallback(
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: Resolve<any, void>,
    reject: Reject<void>
): StatementCallback {
    return function (this, err, row) {
        if (err != null) {
            console.error(`ERR err=${err}`);
            console.error(`ERR name=${err.name}`);
            console.error(`ERR message=${err.message}`);
            reject(err);
        } else if (row != null) {
            resolve(row);
        } else {
            reject(new UndefinedRow());
        }
    };
}

/**
 * Database is created on construction, close() should be called
 * explicitly.
 */
export default class Cache {
    private db!: Database;

    constructor(file = "cache.db") {
        this.db = new Database(file, this.messageCb(""));
        this.create();
    }

    close() {
        this.db.close(this.messageCb(""));
    }

    private messageCb(s: string): ErrorCallback {
        return (err) => {
            if (err) {
                console.error(`ERR ${err.message}`);
            } else if (s) {
                console.log(s);
            }
        };
    }

    private create() {
        const create = `CREATE TABLE IF NOT EXISTS "cache" (
            "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
            "chain" varchar(64) NOT NULL,
            "token" varchar(42) NOT NULL,
            "decimals" smallint unsigned NOT NULL CHECK ("decimals" >= 0),
            "symbol" varchar(32) NOT NULL
        );`;
        const unique = `CREATE UNIQUE INDEX IF NOT EXISTS "cache_chain_token_4c316d1d_uniq"
            ON "cache" ("chain", "token");`;

        this.db.serialize(() => {
            const cb: RunResultCallback = function cb(this, err) {
                if (err != null) {
                    console.error(
                        `create: run failed: lastID=${this.lastID}`,
                        `changes=${this.changes}`,
                        `err.name=${err.name}`,
                        `err.message=${err.message}`,
                        `err.stack=${err.stack}`
                    );
                }
            };
            this.db.run(create, cb);
            this.db.run(unique, cb);
        });
    }

    private async select<T>(
        chain: string,
        token: string,
        key: string
    ): Promise<T> {
        const select = `SELECT "${key}" FROM "cache" WHERE "chain" = ? AND "token" = ?;`;
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executor: Executor<any, void> = (resolve, reject) => {
            this.db.serialize(() => {
                this.db.get(
                    select,
                    chain,
                    token,
                    promisedCallback(resolve, reject)
                );
            });
        };
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Promise(executor).then((row: any): T => {
            if (key in row) {
                return row[key];
            }
            throw new UndefinedRow("TODO?");
        });
    }

    private async insert(
        chain: string,
        token: string,
        values: { decimals: number; symbol: string }
    ): Promise<void> {
        const insert = `INSERT INTO "cache" VALUES (NULL, ?, ?, ?, ?);`;
        const executor: Executor<void, void> = (resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(
                    insert,
                    chain,
                    token,
                    values.decimals,
                    values.symbol,
                    promisedCallback((x) => {
                        console.log("RESULT", x, typeof x);
                        resolve();
                    }, reject)
                );
            });
        };
        return new Promise(executor).catch((err) => {
            if (err instanceof UndefinedRow) {
                // Expected.
                return;
            }
            console.error("ERR", typeof err, err);
            throw new Error("illegal state");
        });
    }

    private async get(
        web3: Web3,
        chain: string,
        token: string,
        key: string
    ): Promise<unknown> {
        token = token.toLowerCase();

        try {
            return await this.select(chain, token, key);
        } catch (e) {
            if (!(e instanceof UndefinedRow)) {
                // Unrecognized error type.
                throw e;
            }

            // Undefined row means such an entry doesn't exist. Call
            // decimals() and symbol() methods on the token contract
            // and store result in database.
            const decimals = await callDecimals(web3, token);
            const symbol = await callSymbol(web3, token);
            await this.insert(chain, token, { decimals, symbol });

            // Try again.  If it fails, it fails.
            return await this.select(chain, token, key);
        }
    }

    async getString(
        web3: Web3,
        chain: string,
        token: string,
        key: string
    ): Promise<string> {
        return this.get(web3, chain, token, key).then((x) => {
            return `${x}`;
        });
    }

    async getNumber(
        web3: Web3,
        chain: string,
        token: string,
        key: string
    ): Promise<number> {
        return this.getString(web3, chain, token, key).then((s) =>
            parseInt(s, 10)
        );
    }

    _getDatabase(): Database {
        return this.db;
    }
}
