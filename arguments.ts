import keccak256 from "keccak256";
import MerkleTree from "merkletreejs";
import { FREE_MINT, WHITELISTED } from "./constants";

const roots = () => {
    const whitelisted = WHITELISTED.map(x => keccak256(x));
    const free_mint = FREE_MINT.map(x => keccak256(x));
    
    // init merkle tree
    const whitelist_tree = new MerkleTree(whitelisted, keccak256, { sortPairs: true });
    const free_mint_tree = new MerkleTree(free_mint, keccak256, { sortPairs: true });
    // get roots
    const whitelist_root = whitelist_tree.getHexRoot();
    const free_mint_root = free_mint_tree.getHexRoot();
    
    return {
        defaultRoot: whitelist_root,
        defaultFreeMintRoot: free_mint_root
    }
}

const args: Array<any> = [
    "0x17c4FA87b8899C7c43157Eb9E5207142cD3282FA",   // defaultTreasury
    roots().defaultRoot,                            // defaultRoot
    roots().defaultFreeMintRoot,                    // defaultFreeMintRoot
    ""                                              // defaultBaseUri
];

export default args;

module.exports = args;