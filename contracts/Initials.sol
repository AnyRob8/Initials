// SPDX-License-Identifier: MIT
// Creator: IL

pragma solidity 0.8.15;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

error SoldOut();
error MaxMinted();
error CannotSetZeroAddress();
error CollectionTooSmall();
error TokenOutOfBound();
error NotWhitelisted();
error MissingProof();
error PriceNotMet();
error AlreadyFreeMinted();

contract Initials is ERC721Enumerable, ERC2981, Ownable {
  using Address for address;
  using Strings for uint256;

  uint constant RANDOM_PRICE = 5 ether / 100; // 0.05 ETH
  uint constant CHOOSE_PRICE = 25 ether / 100; // 0.25 ETH
  uint256 public MAX_SUPPLY = 676;
  uint constant MAX_MINT_PER_ADDRESS = 5;
  string public baseURI;
  bool public PUBLIC_SALE;

  // Sets Treasury Address for withdraw() and ERC2981 royaltyInfo
  address public treasuryAddress;

  bytes32 private _root;
  bytes32 private _freeMintRoot;
  mapping(address => uint8) public _freemint;
  
  uint256 private _numAvailableTokens;
  mapping(uint256 => uint256) private _availableTokens;

  constructor(
      address defaultTreasury,
      bytes32 defaultRoot,
      bytes32 defaultFreeMintRoot,
      string memory defaultUri
  ) ERC721 ("Initials", "AZ") {
      setTreasuryAddress(payable(defaultTreasury));
      setRoyaltyInfo(750);
      setRoot(defaultRoot);
      setFreeMintRoot(defaultFreeMintRoot);
      setBaseURIs(defaultUri);
      _numAvailableTokens = MAX_SUPPLY;
      PUBLIC_SALE = false;
  }
  
  function randomMint(uint256 quantity, bytes32[] calldata proof) external payable {
      if(!PUBLIC_SALE) {
        if(proof.length == 0) revert MissingProof();
        if(!MerkleProof.verify(proof, _root, keccak256(abi.encodePacked(msg.sender)))) revert NotWhitelisted();
      }
      if(totalSupply() + quantity > MAX_SUPPLY) revert SoldOut();
      if(balanceOf(msg.sender) + quantity > MAX_MINT_PER_ADDRESS) revert MaxMinted();
      if(msg.value < RANDOM_PRICE * quantity) revert PriceNotMet();

      for (uint256 i = 0; i < quantity; ++i) { 
          uint256 tokenId = _getRandomAvailableTokenId();
          _numAvailableTokens -= 1;
          _mint(msg.sender, tokenId);
      }
  }

  function mint(uint256 tokenId, bytes32[] calldata proof) external payable {
      if(!MerkleProof.verify(proof, _freeMintRoot, keccak256(abi.encodePacked(msg.sender)))) {
        if(!PUBLIC_SALE) {
          if(proof.length == 0) revert MissingProof();
          if(!MerkleProof.verify(proof, _root, keccak256(abi.encodePacked(msg.sender)))) revert NotWhitelisted();
        }
        if(msg.value < CHOOSE_PRICE) revert PriceNotMet();
      } else {
        if(_freemint[msg.sender] > 0) revert AlreadyFreeMinted();
        _freemint[msg.sender] += 1;
      }
      if(totalSupply() + 1 > MAX_SUPPLY) revert SoldOut();
      if(tokenId > MAX_SUPPLY) revert TokenOutOfBound();

      _numAvailableTokens -= 1;
      _mint(msg.sender, tokenId);
  }


  // OWNER FUNCTIONS ---------
  /**
    * @dev Update whitelist root
    */
  function setSale(bool sale) public onlyOwner {
      PUBLIC_SALE = sale;
  }

  /**
    * @dev Update whitelist root
    */
  function setRoot(bytes32 root) public onlyOwner {
      _root = root;
  }

  /**
    * @dev Update freemint root
    */
  function setFreeMintRoot(bytes32 root) public onlyOwner {
      _freeMintRoot = root;
  }

  /**
    * @dev Update base URI
    */
  function setBaseURIs(string memory uri) public onlyOwner {
      baseURI = uri;
  }
  
  /**
    * @dev Update the royalty percentage (750 = 7.5%)
    */
  function setRoyaltyInfo(uint96 newRoyaltyPercentage) public onlyOwner {
      _setDefaultRoyalty(treasuryAddress, newRoyaltyPercentage);
  }

  /**
    * @dev Update the royalty wallet address
    */
  function setTreasuryAddress(address payable newAddress) public onlyOwner {
      if (newAddress == address(0)) revert CannotSetZeroAddress();
      treasuryAddress = newAddress;
  }

  /**
    * @dev Withdraw funds to treasuryAddress
    */    
    function withdraw() external onlyOwner {
      Address.sendValue(payable(treasuryAddress), address(this).balance);
  }

  // OVERRIDES

  /**
    * @dev Variation of {ERC721Metadata-tokenURI}.
    */
  function tokenURI(uint256 tokenID) public view override returns (string memory) {
      require(_exists(tokenID), "ERC721Metadata: URI query for nonexistent token");
      return string(abi.encodePacked(baseURI, tokenID.toString()));
  }


  /**
    * @dev {ERC165-supportsInterface} Adding IERC2981 
    */
  function supportsInterface(bytes4 interfaceId)
      public
      view
      override(ERC721Enumerable, ERC2981)
      returns (bool)
  {
      return
          ERC2981.supportsInterface(interfaceId) ||
          super.supportsInterface(interfaceId);
  }

  /**
   * @dev Get randomly an available token
   */
  function _getRandomAvailableTokenId() private returns (uint256) {
      uint256 randomNum = uint256(keccak256(abi.encode(
      tx.origin, tx.gasprice, block.number, block.timestamp,
      block.difficulty, block.coinbase, blockhash(block.number - 1),
      address(this), _numAvailableTokens)));

      uint256 randomIndex = randomNum % _numAvailableTokens;
      return _getAvailableTokenAtIndex(randomIndex);
  }


  function _getAvailableTokenAtIndex(uint256 indexToUse) private returns (uint256) {
    uint256 valAtIndex = _availableTokens[indexToUse];
    uint256 result;
    if (valAtIndex == 0) {
      // This means the index itself is still an available token.
      result = indexToUse;
    } else {
      // This means the index itself is not an available token, but the val at
      // that index is.
      result = valAtIndex;
    }

    uint256 lastIndex = _numAvailableTokens - 1;
    if (indexToUse != lastIndex) {
      // Replace the value at indexToUse, now that it's been used. Replace it
      // with the data from the last index in the array, since we are going to
      // decrease the array size afterwards.
      uint256 lastValInArray = _availableTokens[lastIndex];
      if (lastValInArray == 0) {
        // This means the index itself is still an available token.
        _availableTokens[indexToUse] = lastIndex;
      } else {
        // This means the index itself is not an available token, but the val
        // at that index is.
        _availableTokens[indexToUse] = lastValInArray;
        // Gas refund courtsey of @dievardump.
        delete _availableTokens[lastIndex];
      }
    }

    return result;
  }
}