"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
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
exports.insertDecimals = exports.selectDecimals = void 0;
var help3_1 = require("./help3");
//eslint-disable-next-line @typescript-eslint/no-var-requires
var sqlite3 = require("sqlite3").verbose();
function database(f) {
    return __awaiter(this, void 0, void 0, function () {
        var cb, db, create, executor;
        return __generator(this, function (_a) {
            cb = function (msg) {
                return function (err) {
                    if (err) {
                        console.error(err);
                        console.error(err.message);
                    }
                    else {
                        console.log(msg);
                    }
                };
            };
            db = new sqlite3.Database("decimals.db", cb("INF Connected to decimals.db."));
            create = "CREATE TABLE IF NOT EXISTS \"decimals\" (\n        \"id\" integer NOT NULL PRIMARY KEY AUTOINCREMENT,\n        \"chain\" varchar(64) NOT NULL,\n        \"token\" varchar(42) NOT NULL,\n        \"value\" smallint unsigned NOT NULL CHECK (\"value\" >= 0)\n    );\n    CREATE UNIQUE INDEX \"decimals_chain_token_4c316d1d_uniq\" ON \"decimals\" (\"chain\", \"token\");";
            executor = function (resolve, reject) {
                db.serialize(function () {
                    db.run(create);
                    f(db)
                        .then(resolve, reject)
                        .then(function (_value) {
                        db.close(cb("INF Closed decimals.db."));
                    });
                });
            };
            return [2 /*return*/, new Promise(executor)];
        });
    });
}
function selectDecimals(chain, tokenAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var select;
        return __generator(this, function (_a) {
            select = "SELECT \"value\" FROM \"decimals\" WHERE \"chain\" = $chain AND \"token\" = $token;";
            return [2 /*return*/, database(function (db) {
                    var executor = function (resolve, reject) {
                        var params = {
                            $chain: chain,
                            $token: tokenAddress
                        };
                        var cb = function (err, row) {
                            if (err == null && row != null) {
                                resolve(row.value);
                            }
                            else {
                                reject(err);
                            }
                        };
                        db.get(select, params, cb);
                    };
                    return new Promise(executor);
                })];
        });
    });
}
exports.selectDecimals = selectDecimals;
function insertDecimals(chain, tokenAddress, value) {
    return __awaiter(this, void 0, void 0, function () {
        var insert;
        return __generator(this, function (_a) {
            insert = "INSERT INTO \"decimals\" VALUES (NULL, $chain, $token, $value);";
            return [2 /*return*/, database(function (db) {
                    var executor = function (resolve, reject) {
                        var cb = function (err, _row) {
                            if (err == null) {
                                resolve();
                            }
                            else {
                                reject(err);
                            }
                        };
                        db.run(insert, {
                            $chain: chain,
                            $token: tokenAddress,
                            $value: value
                        }, cb);
                    };
                    return new Promise(executor);
                })];
        });
    });
}
exports.insertDecimals = insertDecimals;
function callDecimals(web3, chain, tokenAddress) {
    // TODO: Check cache.
    var contract = (0, help3_1.makeToken)(web3, tokenAddress);
    return contract.methods
        .decimals()
        .call()["catch"](function (reason) {
        var _a;
        var provider = (_a = web3.currentProvider) === null || _a === void 0 ? void 0 : _a.toString();
        console.error("decimals failed: chain=".concat(chain, " provider=").concat(provider, " token=").concat(tokenAddress, " reason=").concat(reason));
        return 0;
    });
}
function getDecimals(web3, chain, tokenAddress) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, selectDecimals(chain, tokenAddress)["catch"](function (_err) {
                    return callDecimals(web3, chain, tokenAddress).then(function (value) {
                        return insertDecimals(chain, tokenAddress, value).then(function () { return value; });
                    });
                })];
        });
    });
}
exports["default"] = getDecimals;
