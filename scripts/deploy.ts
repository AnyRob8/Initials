import { ethers } from "hardhat";
import args from '../arguments';

async function main() {
  
  const Initials = await ethers.getContractFactory("Initials");
  const initials = await Initials.deploy(args[0], args[1], args[2], args[3]);

  await initials.deployed();
  console.log("Initals NFT Collection deployed to: ", initials.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
