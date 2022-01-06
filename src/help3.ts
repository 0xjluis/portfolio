import * as fs from "fs";
import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { Chain } from "./chain";

//eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3_ = require("web3");

/**
 * Return a configured Web3 instance.
 *
 * @param chain One of https://api.coingecko.com/api/v3/asset_platforms .
 * @returns
 */
export function makeWeb3(chain: Chain): Web3 {
    const id = process.env.WEB3_INFURA_PROJECT_ID;
    if (!id) {
        throw new Error("empty WEB3_INFURA_PROJECT_ID");
    }

    let provider: string;
    switch (chain) {
        case "avalanche":
            provider = "https://api.avax.network/ext/bc/C/rpc";
            break;
        case "binance-smart-chain":
            provider = "https://bsc-dataseed.binance.org";
            break;
        case "ethereum":
            provider = `https://mainnet.infura.io/v3/${id}`;
            break;
        case "fantom":
            provider = "https://rpcapi.fantom.network";
            break;
        case "polygon-pos":
            provider = `https://polygon-mainnet.infura.io/v3/${id}`;
            break;
        default:
            throw new Error(`unrecognized chain: ${chain}`);
    }

    return new Web3_(provider);
}

export function makeContract(
    web3: Web3,
    path: fs.PathLike,
    address?: string
): Contract {
    const buf = fs.readFileSync(path, { encoding: "ascii" });
    const abi = JSON.parse(buf.toString());
    return new web3.eth.Contract(abi, address);
}

export function makeToken(web3: Web3, address?: string): Contract {
    // cd interfaces && solc --abi IERC20.sol -o .
    return makeContract(web3, "interfaces/IERC20.abi", address);
}

// +-------------+
// | ERC20 Token |
// +-------------+

export function callMethod(
    web3: Web3,
    tokenAddress: string,
    method: string
): Promise<string> {
    const contract: Contract = makeToken(web3, tokenAddress);
    const fn = contract.methods[method]();
    return (
        fn
            .call()
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            .catch((reason: any): void => {
                // In case of an error, print a bit more information.
                console.error(
                    `IERC20.${method} failed: token=${tokenAddress} reason=${reason}`
                );
                throw reason;
            })
    );
}

export function callDecimals(
    web3: Web3,
    tokenAddress: string
): Promise<number> {
    return callMethod(web3, tokenAddress, "decimals").then((s: string) =>
        parseInt(s, 10)
    );
}

export function callSymbol(web3: Web3, tokenAddress: string): Promise<string> {
    return callMethod(web3, tokenAddress, "symbol");
}

export async function getBalanceOHM(
    web3: Web3,
    owner: string
): Promise<number> {
    const gOHM = makeContract(
        web3,
        "interfaces/gOHM.abi",
        "0x0ab87046fBb341D058F17CBC4c1133F25a20a52f"
    );
    const f = (x: unknown) => parseInt(`${x}`, 10);

    const ratio9 = await gOHM.methods.balanceTo(1).call().then(f);
    const ratio = ratio9 / Math.pow(10, 9);

    const balance18 = await gOHM.methods.balanceOf(owner).call().then(f);
    const balance = balance18 / Math.pow(10, 18);

    const ohm = balance / ratio;
    return ohm;
}
