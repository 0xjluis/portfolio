import * as express from "express";
import * as cors from "cors";
import { config as dotenvConfig } from "dotenv";
import { getBalances } from "./portfolio";
import { Wallets, isWallets } from "./wallets";

async function handle(
    req: express.Request,
    res: express.Response
): Promise<void> {
    const wallets: Wallets = req.body;
    if (!isWallets(wallets)) {
        res.send({error: "bad input"});
    } else {
        const balances = await getBalances(wallets);
        res.send(balances);
    }
    res.end();
}

function main() {
    // Load .env, if present.
    dotenvConfig();

    // Create application.
    const app: express.Express = express();

    app.use(cors()); // Allow CORS.
    app.use(express.json()); // Parse JSON bodies.

    // Attach handlers.
    app.get("/", handle);
    app.post("/", handle);

    // Start server.
    const port: number = parseInt(process.env.PORT || "3334", 10);
    app.listen(port);
}

main();
