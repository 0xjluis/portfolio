// cd interface && solc --abi IERC20.sol -o .

import * as fs from "fs";
import * as https from "https";
import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { IncomingMessage } from "http";

const Web3_ = require("web3");

// +------------+
// | Interfaces |
// +------------+

interface TokenConfig {
    readonly symbol: string;
    readonly address: string;
    readonly invested: number;
    readonly staked?: string;
    readonly initial?: number;
    readonly precision?: number;
}

interface WalletConfig {
    [wallet: string]: readonly TokenConfig[];
}

export interface Config {
    [chain: string]: WalletConfig;
}

export interface Balance {
    readonly chain: string;
    readonly symbol: string;
    readonly invested: number;
    readonly initial: number;
    readonly balance: number;
    readonly price: number;
    readonly notional: number;
    readonly precision: number;
}

// +--------------+
// | Constructors |
// +--------------+

export function readConfig(): Config {
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

function request(url: string): Promise<Buffer> {
    type Resolve = (value: Buffer) => void;
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    currency = "usd"
): Promise<number> {
    chain = chain.toLowerCase();
    tokenAddress = tokenAddress.toLowerCase();

    const url = `https://api.coingecko.com/api/v3/simple/token_price/${chain}?contract_addresses=${tokenAddress}&vs_currencies=${currency}`;

    // interface Result {
    //   [tokenAddress: string]: {usd: number};
    // }

    return request(url)
        .then((x: Buffer) => JSON.parse(x.toString()))
        .then((value): number => {
            if (
                Object.hasOwnProperty.call(value, tokenAddress) &&
                Object.hasOwnProperty.call(value[tokenAddress], currency)
            ) {
                return value[tokenAddress][currency];
            } else {
                const body = JSON.stringify(value);
                console.error(
                    `getPrice: bad response: url=${url} body=${body}`
                );
            }
            return 0;
        });
}

// +------+
// | web3 |
// +------+

/**
 * getBalanceNorm returns the normalized (balance/10^decimals)
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
    const contract: Contract = makeToken(web3, tokenAddress);
    const balance: number = await contract.methods
        .balanceOf(owner)
        .call()
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((error?: any) => {
            const provider = web3.currentProvider?.toString() || "";
            console.error(
                `balanceOf failed: provider=${provider} owner=${owner} token=${tokenAddress} error=${error}`
            );
            return 0;
        });

    const decimals: number = await contract.methods
        .decimals()
        .call()
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((reason?: any): number => {
            const provider: string | undefined =
                web3.currentProvider?.toString();
            console.error(
                `decimals failed: provider=${provider} owner=${owner} token=${tokenAddress} reason=${reason}`
            );
            return 0;
        });

    const norm: number = balance / Math.pow(10, decimals);
    return norm;
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
    // If a token has a staked version, we'd like to use also that one.
    let balance: number = await getBalanceNorm(web3, owner, token.address);
    if (token.staked) {
        balance += await getBalanceNorm(web3, owner, token.staked);
    }
    const price = await getPrice(chain, token.address);
    const notional = balance * price;

    return {
        chain: chain,
        symbol: token.symbol,
        invested: token.invested,
        initial: token.initial || balance,
        balance: balance,
        price: price,
        notional: notional,
        precision: token.precision || 2,
    };
}

// +------+
// | Main |
// +------+

export async function getPortfolio(config: Config): Promise<Balance[]> {
    // An array of promises, which we later convert to a promise of an
    // array.
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
                    const tokenConfigs: readonly TokenConfig[] =
                        walletConfig[wallet];
                    const f = async function (
                        token: TokenConfig
                    ): Promise<Balance> {
                        return getBalance(web3, chain, wallet, token);
                    };
                    const ys: Promise<Balance>[] = tokenConfigs.map(f);
                    xs = xs.concat(ys);
                }
            }
        }
    }

    // Finally, convert `xs`, which is an array of promises, to a
    // promise of an array with all the values resolved.
    return Promise.all(xs);
}
