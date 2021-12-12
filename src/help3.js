"use strict";
exports.__esModule = true;
exports.makeToken = exports.makeContract = exports.makeWeb3 = void 0;
var fs = require("fs");
//eslint-disable-next-line @typescript-eslint/no-var-requires
var Web3_ = require("web3");
/**
 * Return a configured Web3 instance.
 *
 * @param chain One of https://api.coingecko.com/api/v3/asset_platforms .
 * @returns
 */
function makeWeb3(chain) {
    var id = process.env.WEB3_INFURA_PROJECT_ID;
    var provider = "https://mainnet.infura.io/v3/".concat(id);
    if (chain === "avalanche") {
        provider = "https://api.avax.network/ext/bc/C/rpc";
    }
    else if (chain === "binance-smart-chain") {
        provider = "https://bsc-dataseed.binance.org";
    }
    else if (chain === "polygon-pos") {
        provider = "https://polygon-mainnet.infura.io/v3/".concat(id);
    }
    return new Web3_(provider);
}
exports.makeWeb3 = makeWeb3;
function makeContract(web3, path, address) {
    var buf = fs.readFileSync(path, { encoding: "ascii" });
    var abi = JSON.parse(buf.toString());
    return new web3.eth.Contract(abi, address);
}
exports.makeContract = makeContract;
function makeToken(web3, address) {
    return makeContract(web3, "interfaces/IERC20.abi", address);
}
exports.makeToken = makeToken;
