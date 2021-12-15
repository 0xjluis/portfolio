"use strict";
// Exports a single class Decimals that handles calling and caching
// of IERC20.decimals().
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var sqlite3_1 = require("sqlite3");
var help3_1 = require("./help3");
// +------+
// | Web3 |
// +------+
function callDecimals(web3, chain, tokenAddress) {
    // TODO: Check cache.
    var contract = (0, help3_1.makeToken)(web3, tokenAddress);
    return (contract.methods
        .decimals()
        .call()["catch"](function (reason) {
        // In the case of an error, give a bit more information.
        console.error("IERC20.decimals failed: chain=".concat(chain, " token=").concat(tokenAddress, " reason=").concat(reason));
        throw reason;
    }));
}
// Specific error type for the case of no row returned.
var UndefinedRow = /** @class */ (function (_super) {
    __extends(UndefinedRow, _super);
    function UndefinedRow(message) {
        var _this = _super.call(this, message) || this;
        // https://bit.ly/3dSw9WQ
        Object.setPrototypeOf(_this, UndefinedRow.prototype);
        return _this;
    }
    return UndefinedRow;
}(Error));
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
resolve, reject) {
    return function (err, row) {
        if (err != null) {
            console.error("ERR err=".concat(err));
            console.error("ERR name=".concat(err.name));
            console.error("ERR message=".concat(err.message));
            reject(err);
        }
        else if (row != null) {
            resolve(row);
        }
        else {
            reject(new UndefinedRow());
        }
    };
}
/**
 * Database is created on construction, close() should be called
 * explicitly.
 */
var Decimals = /** @class */ (function () {
    function Decimals() {
        this.db = new sqlite3_1.Database("decimals.db", this.messageCb(""));
    }
    Decimals.prototype.close = function () {
        this.db.close(this.messageCb(""));
    };
    Decimals.prototype.messageCb = function (s) {
        return function (err) {
            if (err) {
                console.error(err);
                console.error(typeof err);
                console.error(err.message);
            }
            else if (s) {
                console.log(s);
            }
        };
    };
    Decimals.prototype.create = function () {
        var _this = this;
        var create = "CREATE TABLE IF NOT EXISTS \"decimals\" (\n            \"id\" integer NOT NULL PRIMARY KEY AUTOINCREMENT,\n            \"chain\" varchar(64) NOT NULL,\n            \"token\" varchar(42) NOT NULL,\n            \"value\" smallint unsigned NOT NULL CHECK (\"value\" >= 0)\n        );";
        var unique = "CREATE UNIQUE INDEX IF NOT EXISTS \"decimals_chain_token_4c316d1d_uniq\"\n            ON \"decimals\" (\"chain\", \"token\");";
        this.db.serialize(function () {
            var cb = function cb(err) {
                if (err != null) {
                    console.error("create: run failed: lastID=".concat(this.lastID), "changes=".concat(this.changes), "err.name=".concat(err.name), "err.message=".concat(err.message), "err.stack=".concat(err.stack));
                }
            };
            _this.db.run(create, cb);
            _this.db.run(unique, cb);
        });
    };
    Decimals.prototype.select = function (chain, token) {
        return __awaiter(this, void 0, void 0, function () {
            var select, executor;
            var _this = this;
            return __generator(this, function (_a) {
                select = "SELECT \"value\" FROM \"decimals\" WHERE \"chain\" = ? AND \"token\" = ?;";
                executor = function (resolve, reject) {
                    _this.db.serialize(function () {
                        _this.create();
                        _this.db.get(select, chain, token, promisedCallback(resolve, reject));
                    });
                };
                return [2 /*return*/, new Promise(executor).then(function (row) {
                        if ("value" in row && typeof row.value === "number") {
                            return row.value;
                        }
                        return 18;
                    })];
            });
        });
    };
    Decimals.prototype.insert = function (chain, token, value) {
        return __awaiter(this, void 0, void 0, function () {
            var insert, executor;
            var _this = this;
            return __generator(this, function (_a) {
                insert = "INSERT INTO \"decimals\" VALUES (NULL, ?, ?, ?);";
                executor = function (resolve, reject) {
                    _this.db.serialize(function () {
                        _this.create();
                        _this.db.run(insert, chain, token, value, promisedCallback(function (x) {
                            console.log("RESULT", x, typeof x);
                            resolve();
                        }, reject));
                    });
                };
                return [2 /*return*/, new Promise(executor)["catch"](function (err) {
                        if (err instanceof UndefinedRow) {
                            // Expected.
                            return;
                        }
                        throw err;
                    })];
            });
        });
    };
    Decimals.prototype.get = function (web3, chain, token) {
        return __awaiter(this, void 0, void 0, function () {
            var e_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = token.toLowerCase();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.select(chain, token)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        e_1 = _a.sent();
                        if (e_1 instanceof UndefinedRow) {
                            // console.log(`DBG decimals not cached for chain=${chain} token=${token}, calling...`);
                            // Undefined row means such an entry doesn't exist.
                            // Call the decimals() method on the token contract
                            // and store result in database.
                            return [2 /*return*/, callDecimals(web3, chain, token).then(function (value) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.insert(chain, token, value)];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/, value];
                                        }
                                    });
                                }); })];
                        }
                        else {
                            throw e_1;
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return Decimals;
}());
exports["default"] = Decimals;
