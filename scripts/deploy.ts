import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256"
import { BigNumber } from "ethers";

import {
  FREE_MINT,
  WHITELISTED
} from "../constants";

async function main() {
  const whitelisted = WHITELISTED.map(x => keccak256(x));
  const free_mint = FREE_MINT.map(x => keccak256(x));
  
  // init merkle tree
  const whitelist_tree = new MerkleTree(whitelisted, keccak256, { sortPairs: true });
  const free_mint_tree = new MerkleTree(free_mint, keccak256, { sortPairs: true });
  // get roots
  const whitelist_root = whitelist_tree.getHexRoot();
  const free_mint_root = free_mint_tree.getHexRoot();
  
  // config
  const defaultTreasury: string = "0x17c4FA87b8899C7c43157Eb9E5207142cD3282FA";
  const defaultRoot: string = whitelist_root;
  const defaultFreeMintRoot: string = free_mint_root;
  const defaultBaseUri: string = "";

  const Initials = await ethers.getContractFactory("Initials");
  const initials = await Initials.deploy(defaultTreasury, defaultRoot, defaultFreeMintRoot, defaultBaseUri);

  await initials.deployed();
  console.log("Initals NFT Collection deployed to: ", initials.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
