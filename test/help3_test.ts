// eslint-disable-next-line @typescript-eslint/no-var-requires
// const assert = require("assert");
import { Done } from "mocha";
import { expect } from "chai";
import { callDecimals, callMethod, callSymbol, makeWeb3 } from "../src/help3";

const web3 = makeWeb3("ethereum");
const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";

describe("callMethod", function () {
    // Uses done() just for my own reference in the fucking future
    // when I forgot everything related to this damn language and
    // its devil libraries.
    it("should fucking work", (done: Done) => {
        callMethod(web3, UNI, "totalSupply").then((supply) => {
            expect(supply).to.be.equal("1000000000000000000000000000");
            done();
        });
    });

    it("should throw an exception when calling on a nonexistent token", function () {
        const fn = () => callMethod(web3, "nonexistentAddress", "totalSupply");
        expect(fn).to.throw(
            "Provided address nonexistentAddress is invalid, the capitalization checksum test failed, or it's an indirect IBAN address which can't be converted."
        );
    });

    it("should throw an exception when calling a nonexistent method", function () {
        const fn = () => callMethod(web3, UNI, "nonexistent");
        expect(fn).to.throw("not a function");
    });
});

describe("callDecimals", function () {
    it("should callIERC20.decimals()", async function () {
        const decimals = await callDecimals(web3, UNI);
        expect(decimals).to.be.equal(18);
    });
});

describe("callSymbol", function () {
    it("should callIERC20.symbol()", async function () {
        const symbol = await callSymbol(web3, UNI);
        expect(symbol).to.equal("UNI");
    });
});
