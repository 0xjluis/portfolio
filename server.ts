import * as express from "express";
import { config as dotenvConfig } from "dotenv";
import { Config, getPortfolio, readConfig } from "./portfolio";

function main() {
  // Load .env.
  dotenvConfig();

  // Create application.
  const app: express.Express = express();

  // Attach handlers.
  app.get(
    "/",
    async function (
      _req: express.Request,
      res: express.Response
    ): Promise<void> {
      const config: Config = readConfig();
      const balances = await getPortfolio(config);

      let totalInvested = 0.0;
      let totalValue = 0.0;
      let totalPNL = 0.0;

      balances.forEach((element) => {
        totalValue += element.notional;
        totalInvested += element.invested;
        totalPNL += element.notional - element.invested;
      });

      const body =
        `Total: ${totalValue}\n` +
        `Invested: ${totalInvested}\n` +
        `PNL: ${totalPNL}\n` +
        `ROI: ${(100 * totalPNL) / totalInvested}%\n` +
        "\n" +
        JSON.stringify(balances, null, "\t");

      res.set("Content-Type", "text/plain");
      res.send(body);
    }
  );

  // Start server.
  app.listen(3000);
}

main();
