import * as express from "express";
import { config as dotenvConfig } from "dotenv";
import { Config, getPortfolio, readConfig } from "./portfolio";

async function handle(
    req: express.Request,
    res: express.Response
): Promise<void> {
    const config: Config = req.body ? req.body : readConfig();
    const balances = await getPortfolio(config);
    res.send(balances);
    res.end();
}

function main() {
    // Load .env.
    dotenvConfig();

    // Create application.
    const app: express.Express = express();

    // Parse JSON bodies.
    app.use(express.json());

    // Attach handlers.
    app.get("/", handle);
    app.post("/", handle);

    // Start server.
    app.listen(3334);
}

main();
