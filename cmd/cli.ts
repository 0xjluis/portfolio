import { config as dotenvConfig } from "dotenv";
import { readWallets } from "../src/entries";
import { makeWeb3 } from "../src/help3";
import { Balance, getBalances } from "../src/portfolio";


export async function main() {
    // Load .env.
    dotenvConfig();

    // Read configuration.
    const wallets = readWallets();

    // Fetch portfolio.
    const xs = await getBalances(wallets);

    // Prepare the portfolio to be pretty-printed and sum a few totals
    // in the same time.
    const round = (x: number, precision = 2): number => {
        const d = Math.pow(10, precision);
        return Math.round(x * d) / d;
    };

    const fmt = (x: number, precision = 2): string => {
        const sign = x < 0 ? "-" : "";
        const absr = round(Math.abs(x), precision);
        return `${sign}$${absr}`;
    };

    let totalInvested = 0.0;
    let totalValue = 0.0;
    let totalPNL = 0.0;

    interface PrettyRow {
        Symbol: string,
        Rewards: number,
        Quantity: number,
        Price: string,
        Cost: string,
        Value: string,
        PNL: string,
        ROI: string,
    }

    const pretty = (element: Balance): PrettyRow => {
        const pnl = round(element.notionalValue - element.cost, 1);
        const roi = round((100 * pnl) / element.cost, 1);

        totalValue += element.notionalValue;
        totalInvested += element.cost;
        totalPNL += pnl;

        return {
            Symbol: element.symbol,
            Rewards: round(element.rewardedBalance, element.precision),
            Quantity: round(element.currentBalance, element.precision),
            Price: fmt(element.currentPrice, 1),
            Cost: fmt(element.cost, 1),
            Value: fmt(element.notionalValue, 1),
            PNL: fmt(pnl, 1),
            ROI: `${roi}%`,
        };
    };
    console.table(xs.map(pretty));
    console.log(`Total: ${fmt(totalValue, 2)}`);
    console.log(`Invested: ${fmt(totalInvested, 2)}`);
    console.log(`PNL: ${fmt(totalPNL, 2)}`);
    console.log(`ROI: ${round((100 * totalPNL) / totalInvested, 2)}%`);

    process.exit();
}

main();