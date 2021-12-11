// cd interface && solc --abi IERC20.sol -o .

import * as fs from "fs";
import * as https from "https";
import { config as dotenvConfig } from "dotenv";
import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { IncomingMessage } from "http";

const Web3_ = require("web3");

// +------------+
// | Interfaces |
// +------------+

interface TokenConfig {
  readonly symbol: string;
  readonly invested: number;
  readonly address: string;
  readonly staked?: string;
}

interface WalletConfig {
  [wallet: string]: TokenConfig[];
}

interface Config {
  [chain: string]: WalletConfig;
}

interface Balance {
  chain: string;
  symbol: string;
  invested: number;
  balance: number;
  price: number;
  notional: number;
}

// +--------------+
// | Constructors |
// +--------------+

function readConfig(): Config {
  const buf = fs.readFileSync("config.json", { encoding: "ascii" });
  const obj = JSON.parse(buf.toString());
  return obj;
}

/**
 * Return a configured Web3 instance.
 *
 * @param chain One of https://api.coingecko.com/api/v3/asset_platforms .
 * @returns
 */
function makeWeb3(chain: string): Web3 {
  const id = process.env.WEB3_INFURA_PROJECT_ID;
  let provider = `https://mainnet.infura.io/v3/${id}`;
  if (chain === "avalanche") {
    provider = "https://api.avax.network/ext/bc/C/rpc";
  } else if (chain === "binance-smart-chain") {
    provider = "https://bsc-dataseed.binance.org";
  } else if (chain === "polygon-pos") {
    provider = `https://polygon-mainnet.infura.io/v3/${id}`;
  }
  return new Web3_(provider);
}

function makeContract(
  web3: Web3,
  path: fs.PathLike,
  address?: string
): Contract {
  const buf = fs.readFileSync(path, { encoding: "ascii" });
  const abi = JSON.parse(buf.toString());
  return new web3.eth.Contract(abi, address);
}

function makeToken(web3: Web3, address?: string): Contract {
  return makeContract(web3, "interfaces/IERC20.abi", address);
}

// +------+
// | HTTP |
// +------+

function request(url: string): Promise<any> {
  type Resolve = (value: unknown) => void;
  type Reject = (reason?: any) => void;
  return new Promise(function (resolve: Resolve, reject: Reject): void {
    function callback(res: IncomingMessage): void {
      res.on("data", resolve);
      res.on("error", reject);
    }
    const req = https.request(url, callback);
    req.on("error", reject);
    req.end();
  });
}

/**
 * getPrice returns a token's price in the given target
 * currency. Performs a single request to CoinGecko's API.
 *
 * @param chain Which chain this token lives on.  Passed directly to CoinGecko's API.
 * @param tokenAddress Address of the token contract.
 * @param currency Currency of the price returned.  Again, passed directly to CoinGecko.
 * @returns
 */
async function getPrice(
  chain: string,
  tokenAddress: string,
  currency: string = "usd"
): Promise<number> {
  chain = chain.toLowerCase();
  tokenAddress = tokenAddress.toLowerCase();

  const url = `https://api.coingecko.com/api/v3/simple/token_price/${chain}?contract_addresses=${tokenAddress}&vs_currencies=${currency}`;

  // interface Result {
  //   [tokenAddress: string]: {usd: number};
  // }

  return request(url)
    .then(JSON.parse)
    .then((value: any): number => {
      if (
        Object.hasOwnProperty.call(value, tokenAddress) &&
        Object.hasOwnProperty.call(value[tokenAddress], currency)
      ) {
        return value[tokenAddress][currency];
      } else {
        const body = JSON.stringify(value);
        console.error(`bad response: url=${url} body=${body}`);
      }
    });
}

// +------+
// | web3 |
// +------+

/**
 * getBalanceNorm returns normalized (balance/10^decimals)
 * balance of an asset.
 *
 * @param web3
 * @param owner
 * @param tokenAddress
 * @returns
 */
async function getBalanceNorm(
  web3: Web3,
  owner: string,
  tokenAddress: string
): Promise<number> {
  if (tokenAddress) {
    const contract: Contract = makeToken(web3, tokenAddress);
    const balance: number = await contract.methods.balanceOf(owner).call();
    const decimals: number = await contract.methods.decimals().call();
    const norm: number = balance / Math.pow(10, decimals);
    return norm;
  }
  return 0;
}

/**
 * getBalance returns the staked + unstaked (normalized) balance of an
 * asset.
 *
 * @param web3
 * @param chain
 * @param owner
 * @param token
 * @returns
 */
async function getBalance(
  web3: Web3,
  chain: string,
  owner: string,
  token: TokenConfig
): Promise<Balance> {
  // If a token has a staked version, we'd like to use that one.
  const balance: number =
    (await getBalanceNorm(web3, owner, token.address)) +
    (await getBalanceNorm(web3, owner, token.staked));
  const price = await getPrice(chain, token.address);
  const notional = balance * price;
  return {
    chain: chain,
    symbol: token.symbol,
    invested: token.invested,
    balance: balance,
    price: price,
    notional: notional,
  };
}

// +------+
// | Main |
// +------+

async function getPortfolio(config: Config): Promise<Balance[]> {
  // xs is an array of promises, which we then convert to a promise of an array.
  let xs: Promise<Balance>[] = new Array<Promise<Balance>>();

  // For each chain.
  for (const chain in config) {
    if (Object.hasOwnProperty.call(config, chain)) {
      const web3: Web3 = makeWeb3(chain);
      const walletConfig: WalletConfig = config[chain];
      //
      // For each wallet.
      for (const wallet in walletConfig) {
        if (Object.hasOwnProperty.call(walletConfig, wallet)) {
          //
          // For each token in this wallet, add a new promise to the `xs` array.
          const tokenConfigs: TokenConfig[] = walletConfig[wallet];
          const f = async function (token: TokenConfig): Promise<Balance> {
            return getBalance(web3, chain, wallet, token);
          };
          const ys: Promise<Balance>[] = tokenConfigs.map(f);
          xs = xs.concat(ys);
        }
      }
    }
  }

  // Finally, convert `xs`, which is an array of promises,
  // to a promise of an array with all the values evaluated.
  return Promise.all(xs);
}

async function main() {
  // Load .env.
  dotenvConfig();

  // Read configuration.
  const config = readConfig();

  // Fetch portfolio.
  const xs = await getPortfolio(config);

  // Pretty-print the portfolio and sum its total value in the same time.
  const round2 = (x: number): number => {
    return Math.round(x * 100) / 100;
  };

  const fmt = (x: number): string => {
    const sign = x < 0 ? "-" : "";
    const absr = round2(Math.abs(x));
    return `${sign}$${absr}`;
  };

  let totalInvested = 0.0;
  let totalValue = 0.0;
  let totalPNL = 0.0;

  const pretty = (element: Balance): any => {
    const pnl = round2(element.notional - element.invested);
    const roi = round2(100 * pnl / element.invested);

    totalValue += element.notional;
    totalInvested += element.invested;
    totalPNL += pnl;

    return {
      Symbol: element.symbol,
      Quantity: round2(element.balance),
      Price: fmt(element.price),
      Value: fmt(element.notional),
      Invested: fmt(element.invested),
      PNL: fmt(pnl),
      ROI: `${roi}%`,
    };
  };
  console.table(xs.map(pretty));
  console.log(`Total: ${fmt(totalValue)}`);
  console.log(`Invested: ${fmt(totalInvested)}`);
  console.log(`PNL: ${fmt(totalPNL)}`);

  process.exit();
}

main();
