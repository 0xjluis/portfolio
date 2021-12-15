import * as express from "express";
import * as cors from "cors";
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
