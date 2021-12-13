// Exports a single class Decimals that handles calling and caching
// of IERC20.decimals().

import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { Database, RunResult, Statement } from "sqlite3";
import { makeToken } from "./help3";
import { Executor, Resolve, Reject } from "./promises";

// +------+
// | Web3 |
// +------+

function callDecimals(
    web3: Web3,
    chain: string,
    tokenAddress: string
): Promise<number> {
    // TODO: Check cache.
    const contract: Contract = makeToken(web3, tokenAddress);
    return (
        contract.methods
            .decimals()
            .call()
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            .catch((reason: any): number => {
                // In the case of an error, give a bit more information.
                console.error(
                    `IERC20.decimals failed: chain=${chain} token=${tokenAddress} reason=${reason}`
                );
                throw reason;
            })
    );
}

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

        // https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
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
export default class Decimals {
    private db!: Database;

    constructor() {
        this.db = new Database("decimals.db", this.messageCb(""));
    }

    close() {
        this.db.close(this.messageCb(""));
    }

    private messageCb(s: string): ErrorCallback {
        return (err) => {
            if (err) {
                console.error(err);
                console.error(typeof err);
                console.error(err.message);
            } else if (s) {
                console.log(s);
            }
        };
    }

    private create() {
        const create = `CREATE TABLE IF NOT EXISTS "decimals" (
            "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
            "chain" varchar(64) NOT NULL,
            "token" varchar(42) NOT NULL,
            "value" smallint unsigned NOT NULL CHECK ("value" >= 0)
        );`;
        const unique = `CREATE UNIQUE INDEX IF NOT EXISTS "decimals_chain_token_4c316d1d_uniq"
            ON "decimals" ("chain", "token");`;

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

    private async select(chain: string, token: string): Promise<number> {
        const select = `SELECT "value" FROM "decimals" WHERE "chain" = ? AND "token" = ?;`;
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executor: Executor<any, void> = (resolve, reject) => {
            this.db.serialize(() => {
                this.create();
                this.db.get(
                    select,
                    chain,
                    token,
                    promisedCallback(resolve, reject)
                );
            });
        };

        return new Promise(executor).then((row): number => {
            if ("value" in row && typeof row.value === "number") {
                return row.value;
            }
            return 18;
        });
    }

    private async insert(
        chain: string,
        token: string,
        value: number
    ): Promise<void> {
        const insert = `INSERT INTO "decimals" VALUES (NULL, ?, ?, ?);`;
        const executor: Executor<void, void> = (resolve, reject) => {
            this.db.serialize(() => {
                this.create();
                this.db.run(
                    insert,
                    chain,
                    token,
                    value,
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
            throw err;
        });
    }

    async get(web3: Web3, chain: string, token: string): Promise<number> {
        token = token.toLowerCase();
        try {
            return await this.select(chain, token);
        } catch (e) {
            if (e instanceof UndefinedRow) {
                // console.log(`DBG decimals not cached for chain=${chain} token=${token}, calling...`);

                // Undefined row means such an entry doesn't exist.
                // Call the decimals() method on the token contract
                // and store result in database.
                return callDecimals(web3, chain, token).then(async (value) => {
                    await this.insert(chain, token, value);
                    return value;
                });
            } else {
                throw e;
            }
        }
    }
}
