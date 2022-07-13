import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256"
import { BigNumber } from "ethers";

describe("Initials", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deployInitials() {
    // Contracts are deployed using the first signer/account by default
    const [owner, account_one, account_two, account_three, account_four] = await ethers.getSigners();
    
    // Delcare merkletree
    const WHITELISTED = [owner, account_one].map(x => keccak256(x.address));
    const FREE_MINT = [account_two, account_three].map(x => keccak256(x.address));
    // init merkle tree
    const whitelist_tree = new MerkleTree(WHITELISTED, keccak256, { sortPairs: true });
    const free_mint_tree = new MerkleTree(FREE_MINT, keccak256, { sortPairs: true });
    // get roots
    const whitelist_root = whitelist_tree.getHexRoot();
    const free_mint_root = free_mint_tree.getHexRoot();
    
    // config
    const defaultTreasury: string = owner.address;
    const defaultRoot: string = whitelist_root;
    const defaultFreeMintRoot: string = free_mint_root;
    const defaultBaseUri: string = "";
    
    // deploy
    const Initials = await ethers.getContractFactory("Initials");
    const initials = await Initials.deploy(
      defaultTreasury,
      defaultRoot, 
      defaultFreeMintRoot,
      defaultBaseUri
    );
    
    return { 
      initials, 
      owner, 
      account_one, 
      account_two, 
      account_three,
      account_four,
      defaultFreeMintRoot, 
      defaultBaseUri, 
      defaultRoot, 
      defaultTreasury,
      whitelist_tree,
      free_mint_tree
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { initials, owner } = await loadFixture(deployInitials);

      expect(await initials.owner()).to.equal(owner.address);
    });

    it("Should set the right baseUri", async function () {
      const { initials, defaultBaseUri } = await loadFixture(deployInitials);

      expect(await initials.baseURI()).to.equal(defaultBaseUri);
    });
  });

  describe("Mint", function () {
    describe("Validations", function () {
      it("Should mint whitelist token 1", async function () {
        const { initials, whitelist_tree, owner } = await loadFixture(deployInitials);
        
        const leaf = "0x" + keccak256(owner.address).toString('hex');
        const proof = whitelist_tree.getHexProof(leaf);
        
        await initials.mint(1, proof, { value: BigNumber.from(25).mul(BigNumber.from(10).pow(18)).div(100)});

        expect(await initials.ownerOf(1)).to.equal(owner.address);
      });

      it("Should mint 3 whitelist randomly", async function () {
        const { initials, whitelist_tree, owner } = await loadFixture(deployInitials);
        
        const leaf = "0x" + keccak256(owner.address).toString('hex');
        const proof = whitelist_tree.getHexProof(leaf);
        
        await initials.randomMint(3, proof, { value: BigNumber.from(15).mul(BigNumber.from(10).pow(18)).div(100) });

        expect(await initials.balanceOf(owner.address)).to.equal(3);
      });

      it("Should fail mint 33 whitelist randomly", async function () {
        const { initials, whitelist_tree, owner } = await loadFixture(deployInitials);
        
        const leaf = "0x" + keccak256(owner.address).toString('hex');
        const proof = whitelist_tree.getHexProof(leaf);
        
        await expect(initials.randomMint(33, proof, { value: BigNumber.from(1500).mul(BigNumber.from(10).pow(18)).div(100) }))
          .to.rejectedWith(Error, "VM Exception while processing transaction: reverted with custom error 'MaxMinted()'");
      });

      it("Should mint freemint token 1 during PRIVATE SALE", async function () {
        const { initials, free_mint_tree, account_three } = await loadFixture(deployInitials);
        
        const leaf = "0x" + keccak256(account_three.address).toString('hex');
        const proof = free_mint_tree.getHexProof(leaf);
        
        await initials.connect(account_three).mint(1, proof);

        expect(await initials.ownerOf(1)).to.equal(account_three.address);
      });

      it("Should mint freemint one token and fail second freemint during PRIVATE SALE", async function () {
        const { initials, free_mint_tree, account_three } = await loadFixture(deployInitials);
        
        const leaf = "0x" + keccak256(account_three.address).toString('hex');
        const proof = free_mint_tree.getHexProof(leaf);
        
        await initials.connect(account_three).mint(1, proof);

        expect(await initials.balanceOf(account_three.address)).to.equal(1);
        await expect(initials.connect(account_three).mint(2, proof))
          .to.rejectedWith(Error, "VM Exception while processing transaction: reverted with custom error 'AlreadyFreeMinted()'");
      });

      it("Should mint PUBLIC SALE", async function () {
        const { initials, account_four, owner } = await loadFixture(deployInitials);
        
        await initials.connect(owner).setSale(true);
        await initials.connect(account_four).mint(1, [], { value: BigNumber.from(25).mul(BigNumber.from(10).pow(18)).div(100) });

        expect(await initials.ownerOf(1)).to.equal(account_four.address);
      });

      it("Should fail mint during PRIVATE SALE", async function () {
        const { initials, account_four, owner } = await loadFixture(deployInitials);
        
        await expect(initials.connect(account_four).mint(1, [], { value: BigNumber.from(25).mul(BigNumber.from(10).pow(18)).div(100) }))
          .to.rejectedWith(Error, "VM Exception while processing transaction: reverted with custom error 'MissingProof()" );
      });
      
      it("Should mint freemint token 1 during PUBLIC SALE", async function () {
        const { initials, free_mint_tree, owner, account_three } = await loadFixture(deployInitials);
        
        await initials.connect(owner).setSale(true);

        const leaf = "0x" + keccak256(account_three.address).toString('hex');
        const proof = free_mint_tree.getHexProof(leaf);
        
        await initials.connect(account_three).mint(1, proof);

        expect(await initials.ownerOf(1)).to.equal(account_three.address);
      });
    });
  });
});
