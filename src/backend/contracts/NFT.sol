//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//IMPORT THE ERC721 URI STORAGE
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

//CREATE THE CONTRACT WHICH WILL INHERIT THE ERC721URISTORAGE 
contract NFT is ERC721URIStorage{
 //VARS
 uint public tokenCount;
 //THE CONSTRUCTOR
 constructor()ERC721("DApp NFT","DAPP"){}
 
 //FUNCTION TO CREATE NEW NFTS
 function mint(string memory _tokenURI) external returns(uint) {
 //COUTING ANOTHER TOKEN
 tokenCount ++;
//MAKE AN MINT TO THE MSG.SENDER ADDRESS
 _safeMint(msg.sender, tokenCount);
//SETTING THE TOKEN URL
 _setTokenURI(tokenCount, _tokenURI);
//RETURN THE TOKEN ID
 return tokenCount;
 }
}