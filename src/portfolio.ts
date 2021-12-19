import Web3 from "web3";
import { Contract } from "web3-eth-contract";

import Cache from "./cache";
import { Chain } from "./chain";
import { Wallets, Entry, Transaction, Transactions } from "./wallets";
import { makeWeb3, makeToken, getBalanceOHM } from "./help3";
import getPrice, { VsCurrency } from "./price";

// +---------+
// | Balance |
// +---------+

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
    chain: Chain,
    owner: string,
    tokenAddress: string,
): Promise<number> {
    // OHM on Ethereum is a special fucking case.
    if (tokenAddress === "0x383518188c0c6d7730d91b2c03a03c837814a899") {
        return getBalanceOHM(web3, owner);
    }

    const contract: Contract = makeToken(web3, tokenAddress);
    const balance: number = await contract.methods
        .balanceOf(owner)
        .call()
        .catch((error?: unknown) => {
            const provider = web3.currentProvider?.toString() || "";
            console.error(
                `balanceOf failed: provider=${provider} owner=${owner} token=${tokenAddress} error=${error}`
            );
            return 0;
        });

    const cache = new Cache();
    const decimals = await cache.getNumber(
        web3,
        chain,
        tokenAddress,
        "decimals"
    );
    cache.close(); // Not the smartest thing to do, but completely fine for now. :)

    const norm = balance / Math.pow(10, decimals);
    return norm;
}

async function getCost(
    web3: Web3,
    chain: Chain,
    txs: Transactions,
    currency: VsCurrency = "usd",
): Promise<number> {
    const native = await getPrice(chain, "native", currency);

    let cost = 0;
    for (let index = 0; index < txs.length; index++) {
        const tx = txs[index];
        const price = await getPrice(chain, tx.amountOut.tokenAddress, currency);
        cost += tx.amountOut.value * price;
        cost += tx.fee * native;
    }

    return cost;
}

export interface Balance {
    readonly chain: Chain;
    readonly tokenAddress: string;
    readonly symbol: string;
    readonly cost: number;
    readonly initialBalance: number;
    readonly currentBalance: number;
    readonly rewardedBalance: number;
    readonly currentPrice: number;
    readonly notionalValue: number;
    readonly precision: number;
}

export type Balances = Balance[];

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
export async function getBalance(
    web3: Web3,
    chain: Chain,
    owner: string,
    entry: Entry,
    currency: VsCurrency = "usd",
): Promise<Balance> {
    //const cache = new Cache();
    const cost = await getCost(web3, chain, entry.transactions, currency);

    let initialBalance = 0;
    entry.transactions.forEach((tx: Transaction) => {
        initialBalance += tx.amountIn;
    });

    // If a token has a staked version, we'd like to use also that one.
    let currentBalance: number = await getBalanceNorm(
        web3,
        chain,
        owner,
        entry.tokenAddress
    );
    if (entry.stakedAddress) {
        currentBalance += await getBalanceNorm(
            web3,
            chain,
            owner,
            entry.stakedAddress
        );
    }
    const currentPrice = await getPrice(chain, entry.tokenAddress);
    const notionalValue = currentBalance * currentPrice;

    return {
        chain: chain,
        tokenAddress: entry.tokenAddress,
        symbol: entry.symbol,
        cost: cost,
        initialBalance: initialBalance,
        currentBalance: currentBalance,
        rewardedBalance: (currentBalance - initialBalance),
        currentPrice: currentPrice,
        notionalValue: notionalValue,
        precision: entry.precision || 2,
    }
}

export async function getBalances(wallets: Wallets): Promise<Balances> {
    let xs: Promise<Balance>[] = new Array<Promise<Balance>>();

    for (const wallet in wallets) {
        if (Object.hasOwnProperty.call(wallets, wallet)) {
            const f = async function (entry: Entry): Promise<Balance> {
                const web3 = makeWeb3(entry.chain);
                return getBalance(web3, entry.chain, wallet, entry);
            };
            const entries = wallets[wallet];
            const ys: Promise<Balance>[] = entries.map(f);
            xs = xs.concat(ys);
        }
    }

    return Promise.all(xs);
}
