// eslint-disable-next-line @typescript-eslint/no-var-requires
// const assert = require("assert");
import { describe } from "mocha";
import { expect } from "chai";
import Cache from "../src/cache";
import { makeWeb3 } from "../src/help3";

const web3 = makeWeb3("ethereum");
const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";

describe("Cache", function () {
    describe(".constructor", function () {
        it("should create a file and a database, if not existing already", function () {
            new Cache(":memory:");
            // TODO: SELECT "name" FROM "sqlite_master" WHERE "type"="table" AND name="cache";
        });
    });

    describe(".get", function () {
        it("should either return cached value or fetch, cache and then return", async function () {
            const cache = new Cache(":memory:");

            // I'm actually not proving that values get cached and
            // retrieved from cache, but that's good enough for now.
            const symbol = await cache.getString(
                web3,
                "ethereum",
                UNI,
                "symbol"
            );
            expect(symbol).to.be.equal("UNI");

            const decimals = await cache.getNumber(
                web3,
                "ethereum",
                UNI,
                "decimals"
            );
            expect(decimals).to.be.equal(18);
        });
    });
});
