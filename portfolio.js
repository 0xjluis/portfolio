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
var fs = require("fs");
var https = require("https");
var dotenv_1 = require("dotenv");
var Web3_ = require("web3");
// +--------------+
// | Constructors |
// +--------------+
function readConfig() {
    var buf = fs.readFileSync("config.json", { encoding: "ascii" });
    var obj = JSON.parse(buf.toString());
    return obj;
}
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
function makeContract(web3, path, address) {
    var buf = fs.readFileSync(path, { encoding: "ascii" });
    var abi = JSON.parse(buf.toString());
    return new web3.eth.Contract(abi, address);
}
function makeToken(web3, address) {
    return makeContract(web3, "interfaces/IERC20.abi", address);
}
// +------+
// | HTTP |
// +------+
function request(url) {
    return new Promise(function (resolve, reject) {
        function callback(res) {
            res.on("data", function (b) { return resolve(b.toString()); });
            res.on("error", reject);
        }
        var req = https.request(url, callback);
        req.on("error", reject);
        req.end();
    });
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
            // interface Result {
            //   [tokenAddress: string]: {usd: number};
            // }
            return [2 /*return*/, request(url)
                    .then(JSON.parse)
                    .then(function (value) {
                    if (Object.hasOwnProperty.call(value, tokenAddress) &&
                        Object.hasOwnProperty.call(value[tokenAddress], currency)) {
                        return value[tokenAddress][currency];
                    }
                    else {
                        var body = JSON.stringify(value);
                        console.error("getPrice: bad response: url=".concat(url, " body=").concat(body));
                    }
                    return 0;
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
function getBalanceNorm(web3, owner, tokenAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var contract, balance, decimals, norm;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!tokenAddress) return [3 /*break*/, 3];
                    contract = makeToken(web3, tokenAddress);
                    return [4 /*yield*/, contract.methods.balanceOf(owner).call()];
                case 1:
                    balance = _a.sent();
                    return [4 /*yield*/, contract.methods.decimals().call()];
                case 2:
                    decimals = _a.sent();
                    norm = balance / Math.pow(10, decimals);
                    return [2 /*return*/, norm];
                case 3: return [2 /*return*/, 0];
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
                case 0: return [4 /*yield*/, getBalanceNorm(web3, owner, token.address)];
                case 1:
                    balance = _b.sent();
                    if (!token.staked) return [3 /*break*/, 3];
                    _a = balance;
                    return [4 /*yield*/, getBalanceNorm(web3, owner, token.staked)];
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
// +------+
// | Main |
// +------+
function getPortfolio(config) {
    return __awaiter(this, void 0, void 0, function () {
        var xs, _loop_1, chain;
        return __generator(this, function (_a) {
            xs = new Array();
            _loop_1 = function (chain) {
                if (Object.hasOwnProperty.call(config, chain)) {
                    var web3_1 = makeWeb3(chain);
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
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var config, xs, round, fmt, totalInvested, totalValue, totalPNL, pretty;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Load .env.
                    (0, dotenv_1.config)();
                    config = readConfig();
                    return [4 /*yield*/, getPortfolio(config)];
                case 1:
                    xs = _a.sent();
                    round = function (x, precision) {
                        if (precision === void 0) { precision = 2; }
                        var d = Math.pow(10, precision);
                        return Math.round(x * d) / d;
                    };
                    fmt = function (x, precision) {
                        if (precision === void 0) { precision = 2; }
                        var sign = x < 0 ? "-" : "";
                        var absr = round(Math.abs(x), precision);
                        return "".concat(sign, "$").concat(absr);
                    };
                    totalInvested = 0.0;
                    totalValue = 0.0;
                    totalPNL = 0.0;
                    pretty = function (element) {
                        var pnl = round(element.notional - element.invested, 1);
                        var roi = round((100 * pnl) / element.invested, 1);
                        totalValue += element.notional;
                        totalInvested += element.invested;
                        totalPNL += pnl;
                        return {
                            Symbol: element.symbol,
                            Quantity: round(element.balance, element.precision),
                            Rewards: round(element.balance - element.initial, element.precision),
                            Price: fmt(element.price, 1),
                            Value: fmt(element.notional, 1),
                            Invested: fmt(element.invested, 1),
                            PNL: fmt(pnl, 1),
                            ROI: "".concat(roi, "%")
                        };
                    };
                    console.table(xs.map(pretty));
                    console.log("Total: ".concat(fmt(totalValue, 2)));
                    console.log("Invested: ".concat(fmt(totalInvested, 2)));
                    console.log("PNL: ".concat(fmt(totalPNL, 2)));
                    console.log("ROI: ".concat(round((100 * totalPNL) / totalInvested, 2), "%"));
                    process.exit();
                    return [2 /*return*/];
            }
        });
    });
}
main();
