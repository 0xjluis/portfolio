"use strict";
// cd interface && solc --abi IERC20.sol -o .
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.getPortfolio = exports.readConfig = void 0;
var fs = require("fs");
var https = require("https");
var decimals_1 = require("./decimals");
var help3_1 = require("./help3");
// +------+
// | HTTP |
// +------+
function request(url) {
    var f = function (resolve, reject) {
        var callback = function (res) {
            res.on("data", resolve);
            res.on("error", reject);
        };
        var req = https.request(url, callback);
        req.on("error", reject);
        req.end();
    };
    return new Promise(f);
}
/**
 * getPrice returns a token's price in the given target
 * currency. Performs a single request to CoinGecko's API.
 *
 * @param chain Which chain this token lives on.  Passed directly to CoinGecko's API.
 * @param tokenAddress Address of the token contract.
 * @param currency Currency of the price returned.  Again, passed directly to CoinGecko.
 * @returns
 */
function getPrice(chain, tokenAddress, currency) {
    if (currency === void 0) { currency = "usd"; }
    return __awaiter(this, void 0, void 0, function () {
        var url;
        return __generator(this, function (_a) {
            chain = chain.toLowerCase();
            tokenAddress = tokenAddress.toLowerCase();
            url = "https://api.coingecko.com/api/v3/simple/token_price/".concat(chain, "?contract_addresses=").concat(tokenAddress, "&vs_currencies=").concat(currency);
            return [2 /*return*/, request(url)
                    .then(function (x) { return JSON.parse(x.toString()); })
                    .then(function (value) {
                    if (tokenAddress in value && currency in value[tokenAddress]) {
                        return value[tokenAddress][currency];
                    }
                    var body = JSON.stringify(value);
                    var message = "bad response: url=".concat(url, " body=").concat(body);
                    throw new Error(message);
                })];
        });
    });
}
// +------+
// | web3 |
// +------+
/**
 * getBalanceNorm returns the normalized (balance/10^decimals)
 * balance of an asset.
 *
 * @param web3
 * @param owner
 * @param tokenAddress
 * @returns
 */
function getBalanceNorm(web3, chain, owner, tokenAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var contract, balance, decimals, value, norm;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    contract = (0, help3_1.makeToken)(web3, tokenAddress);
                    return [4 /*yield*/, contract.methods
                            .balanceOf(owner)
                            .call()["catch"](function (error) {
                            var _a;
                            var provider = ((_a = web3.currentProvider) === null || _a === void 0 ? void 0 : _a.toString()) || "";
                            console.error("balanceOf failed: provider=".concat(provider, " owner=").concat(owner, " token=").concat(tokenAddress, " error=").concat(error));
                            return 0;
                        })];
                case 1:
                    balance = _a.sent();
                    decimals = new decimals_1["default"]();
                    return [4 /*yield*/, decimals.get(web3, chain, tokenAddress)];
                case 2:
                    value = _a.sent();
                    decimals.close(); // Not the smartest thing, but completely fine for now. :)
                    norm = balance / Math.pow(10, value);
                    return [2 /*return*/, norm];
            }
        });
    });
}
/**
 * getBalance returns the staked + unstaked (normalized) balance of an
 * asset.
 *
 * @param web3
 * @param chain
 * @param owner
 * @param token
 * @returns
 */
function getBalance(web3, chain, owner, token) {
    return __awaiter(this, void 0, void 0, function () {
        var balance, _a, price, notional;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getBalanceNorm(web3, chain, owner, token.address)];
                case 1:
                    balance = _b.sent();
                    if (!token.staked) return [3 /*break*/, 3];
                    _a = balance;
                    return [4 /*yield*/, getBalanceNorm(web3, chain, owner, token.staked)];
                case 2:
                    balance = _a + _b.sent();
                    _b.label = 3;
                case 3: return [4 /*yield*/, getPrice(chain, token.address)];
                case 4:
                    price = _b.sent();
                    notional = balance * price;
                    return [2 /*return*/, {
                            chain: chain,
                            symbol: token.symbol,
                            invested: token.invested,
                            initial: token.initial || balance,
                            balance: balance,
                            price: price,
                            notional: notional,
                            precision: token.precision || 2
                        }];
            }
        });
    });
}
// +--------+
// | Public |
// +--------+
function readConfig() {
    var buf = fs.readFileSync("config.json", { encoding: "ascii" });
    var obj = JSON.parse(buf.toString());
    return obj;
}
exports.readConfig = readConfig;
function getPortfolio(config) {
    return __awaiter(this, void 0, void 0, function () {
        var xs, _loop_1, chain;
        return __generator(this, function (_a) {
            xs = new Array();
            _loop_1 = function (chain) {
                if (Object.hasOwnProperty.call(config, chain)) {
                    var web3_1 = (0, help3_1.makeWeb3)(chain);
                    var walletConfig = config[chain];
                    var _loop_2 = function (wallet) {
                        if (Object.hasOwnProperty.call(walletConfig, wallet)) {
                            //
                            // For each token in this wallet, add a new promise to the `xs` array.
                            var tokenConfigs = walletConfig[wallet];
                            var f = function (token) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        return [2 /*return*/, getBalance(web3_1, chain, wallet, token)];
                                    });
                                });
                            };
                            var ys = tokenConfigs.map(f);
                            xs = xs.concat(ys);
                        }
                    };
                    //
                    // For each wallet.
                    for (var wallet in walletConfig) {
                        _loop_2(wallet);
                    }
                }
            };
            // For each chain.
            for (chain in config) {
                _loop_1(chain);
            }
            // Finally, convert `xs`, which is an array of promises, to a
            // promise of an array with all the values resolved.
            return [2 /*return*/, Promise.all(xs)];
        });
    });
}
exports.getPortfolio = getPortfolio;
