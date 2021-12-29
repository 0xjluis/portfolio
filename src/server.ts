import * as express from "express";
import * as cors from "cors";
import { config as dotenvConfig } from "dotenv";
import { Balances, getBalances } from "./portfolio";
import { Wallets, isWallets } from "./wallets";

async function handle(
    req: express.Request,
    res: express.Response
): Promise<void> {
    const wallets: Wallets = req.body;
    if (!isWallets(wallets)) {
        res.send({ error: "bad input" });
        res.end();
    } else {
        getBalances(wallets)
            .then((balances: Balances) => res.send(balances))
            .catch(console.error)
            .finally(() => res.end());
    }
}

function main() {
    // Load .env, if present.
    dotenvConfig();

    // Create application.
    const app: express.Express = express();

    app.use(cors()); // Allow CORS.
    app.use(express.json()); // Parse JSON bodies.

    // Attach handlers.
    app.post("/", handle);

    // Start server.
    const port: number = parseInt(process.env.PORT || "3334", 10);
    app.listen(port);
}

main();
