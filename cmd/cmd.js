"use strict";
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
var dotenv_1 = require("dotenv");
var portfolio_1 = require("../src/portfolio");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var config, xs, round, fmt, totalInvested, totalValue, totalPNL, pretty;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Load .env.
                    (0, dotenv_1.config)();
                    config = (0, portfolio_1.readConfig)();
                    return [4 /*yield*/, (0, portfolio_1.getPortfolio)(config)];
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
