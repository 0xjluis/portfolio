import Web3 from "web3";
import { Contract } from "web3-eth-contract";

import Cache from "./cache";
import { Entries, Entry } from "./entries";
import { makeWeb3, makeToken } from "./help3";
import getPrice from "./price";

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
    chain: string,
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

    const cache = new Cache();
    const decimals = await cache.getNumber(
        web3,
        chain,
        tokenAddress,
        "decimals"
    );
    cache.close(); // Not the smartest thing, but completely fine for now. :)

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
    token: Entry
): Promise<Balance> {
    // If a token has a staked version, we'd like to use also that one.
    let balance: number = await getBalanceNorm(
        web3,
        chain,
        owner,
        token.tokenAddress
    );
    if (token.stakedAddress) {
        balance += await getBalanceNorm(
            web3,
            chain,
            owner,
            token.stakedAddress
        );
    }
    const price = await getPrice(chain, token.tokenAddress);
    const notional = balance * price;

    return {
        chain: chain,
        symbol: token.symbol,
        invested: 0, // token.invested,
        initial: token.initial || balance,
        balance: balance,
        price: price,
        notional: notional,
        precision: token.precision || 2,
    };
}

// +--------+
// | Public |
// +--------+

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

export type Balances = Balance[];

export async function getPortfolio(
    walletToEntries: Entries
): Promise<Balances> {
    // An array of promises, which we later convert to a promise of an
    // array of all respective values evaluated.
    let xs: Promise<Balance>[] = new Array<Promise<Balance>>();

    // For each wallet.
    for (const wallet in walletToEntries) {
        if (Object.hasOwnProperty.call(walletToEntries, wallet)) {
            const entries = walletToEntries[wallet];

            const f = async function (entry: Entry): Promise<Balance> {
                const web3 = makeWeb3(entry.chain);
                return getBalance(web3, entry.chain, wallet, entry);
            };
            const ys: Promise<Balance>[] = entries.map(f);
            xs = xs.concat(ys);
        }
    }

    // Finally, convert `xs`, which is an array of promises, to a
    // promise of an array with all the values resolved.
    return Promise.all(xs);
}
