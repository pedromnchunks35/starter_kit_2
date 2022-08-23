//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//IMPORT THE INTERFACE
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
//IMPORT THE SAFE GUARD
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard{
    //VARS (IMMUTABLE BECAUSE ONLY CAN BE CHANGED ONCE)
    address payable public immutable feeAccount;
    uint public immutable feePercent;
    uint public itemCount;
    //STRUCTURE FOR THE ITEM
    struct Item{
    uint itemId;
    IERC721 nft;
    uint tokenId;
    uint price;
    address payable seller;
    bool sold;    
    }
    //EVENT OFFERING
    event Offered(
    uint itemId,
    address indexed nft,
    uint tokenId,
    uint price,
    address indexed seller
    );

    //EVENT BOUGHT
    event Bought(
    uint itemId,
    address indexed nft,
    uint tokenId,
    uint price,
    address indexed seller,
    address indexed buyer
    );

    //AN MAPP OF ITEMS
    mapping(uint => Item) public items;
    //THE CONSTRUCTOR
    constructor(uint _feePercent){
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }
    //FUNCTION TO MAKE AN ITEM WHICH "NONREENTRANT" STANDS FOR A SECURITY MEASURE OF THE OPEN ZEPPLIN FOR DONT REPEAT MULTIPLE TIMES THE FUNCTION
    function makeItem(IERC721 _nft,uint _tokenId,uint _price) external nonReentrant {
    //REQUIREMENTS
    require(_price > 0 ,"Price must be greater that zero");
    //INCREMENT ITEMCOUNT
    itemCount++;
    //TRANSFER THE NFT TO THE CONTRACT
    _nft.transferFrom(msg.sender,address(this),_tokenId);
    //ADD AN ITEM
    items[itemCount] = Item(
    itemCount,
    _nft,
    _tokenId,
    _price,
    payable(msg.sender),
    false
    );
    //EMIT THE EVENT
    emit Offered(itemCount, address(_nft), _tokenId, _price, msg.sender);
    }

    //FUNCTION TO BUY THE NFT
    function purchaseItem(uint _itemId) external payable nonReentrant{

    uint _totalPrice = getTotalPrice(_itemId);
    //IT WILL GO DIRECTLY TO THE STORAGE CHECK THE ITEM OVER CREATING AN COPY
    Item storage item = items[_itemId];
    //REQUIRE THAT THE ITEM EXISTS
    require(_itemId > 0 && _itemId <= itemCount , "Item doesnt exist");
    //REQUIRE THAT THE VALUE SENDED IS ENOUGH
    require(msg.value >= _totalPrice,"Not enough ether to cover item price and market fee");
    //CHECK IF THE ITEM ISNT ALREADY SOLD
    require(!item.sold,"Item already sold");
    //PAY SELLER AND FEEACCOUNT
    item.seller.transfer(item.price);
    feeAccount.transfer(_totalPrice - item.price);
    //UPDATE ITEM TO SOLD   
    item.sold = true;
    //TRANSFER NFT TO BUYER
    item.nft.transferFrom(address(this),msg.sender,item.tokenId);
    //EMIT BOUGHT EVENT
    emit Bought(_itemId, address(item.nft), item.tokenId, item.price, item.seller, msg.sender);

    }
    
    //THE TOTAL PRICE OF THE NFT WITH THE MARKET FEES
    function getTotalPrice(uint _itemId) view public returns(uint){
      return (items[_itemId].price*(100 + feePercent) / 100);
    }



}