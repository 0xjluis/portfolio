import * as fs from "fs";
import Web3 from "web3";
import { Contract } from "web3-eth-contract";

//eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3_ = require("web3");

/**
 * Return a configured Web3 instance.
 *
 * @param chain One of https://api.coingecko.com/api/v3/asset_platforms .
 * @returns
 */
 export function makeWeb3(chain: string): Web3 {
    const id = process.env.WEB3_INFURA_PROJECT_ID;
    if (!id) {
        throw new Error("empty WEB3_INFURA_PROJECT_ID");
    }
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