import { expect } from "chai";
import { getSimplePrice, getTokenPrice } from "../src/price";

describe("getSimplePrice", function () {
    it("should fucking work", async function () {
        const one = await getSimplePrice("ethereum", "eth");
        expect(one).to.be.approximately(1, 1e-6);

        const bnbeth = await getSimplePrice("binance-smart-chain", "eth");
        const bnbusd = await getSimplePrice("binance-smart-chain");
        const ethusd = await getSimplePrice("ethereum");
        expect(bnbeth * ethusd).to.be.approximately(bnbusd, 5);
    }).timeout(5000);
});

describe("getTokenPrice", function () {
    it("should fucking work", async function () {
        const weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
        const wetheth = await getTokenPrice("ethereum", weth, "eth");
        expect(wetheth).to.be.approximately(1, 1e-2);

        const wethusd = await getTokenPrice("ethereum", weth);
        const ethusd = await getSimplePrice("ethereum");
        expect(wethusd).to.be.approximately(ethusd, 20);
    }).timeout(5000);
});