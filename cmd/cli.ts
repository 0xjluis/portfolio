import { config as dotenvConfig } from "dotenv";
import { readEntries } from "../src/entries";
import { Balance, getPortfolio } from "../src/portfolio";


export async function main() {
    // Load .env.
    dotenvConfig();

    // Read configuration.
    const config = readEntries();

    // Fetch portfolio.
    const xs = await getPortfolio(config);

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
        Quantity: number,
        Rewards: number,
        Price: string,
        Value: string,
        Invested: string,
        PNL: string,
        ROI: string,
    }

    const pretty = (element: Balance): PrettyRow => {
        const pnl = round(element.notional - element.invested, 1);
        const roi = round((100 * pnl) / element.invested, 1);

        totalValue += element.notional;
        totalInvested += element.invested;
        totalPNL += pnl;

        return {
            Symbol: element.symbol,
            Quantity: round(element.balance, element.precision),
            Rewards: round(
                element.balance - element.initial,
                element.precision
            ),
            Price: fmt(element.price, 1),
            Value: fmt(element.notional, 1),
            Invested: fmt(element.invested, 1),
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