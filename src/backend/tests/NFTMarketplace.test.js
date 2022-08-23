const {expect} = require('chai');
const { ethers } = require('hardhat');

//TO WEI AND FROM WEI FUNCTIONS
const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);



describe("NFTMarketplace",()=>{
let deployer,addr1,addr2,nft,marketplace;
let feePercent=1;
let URI = "SAMPLE URI";
beforeEach(async ()=>{

//CONTRACT FACTORIES
const NFT = await ethers.getContractFactory("NFT");
const Marketplace = await ethers.getContractFactory("Marketplace");

//GET SIGNERS
[deployer,addr1,addr2] = await ethers.getSigners();
//DEPLOY
nft = await NFT.deploy();
marketplace = await Marketplace.deploy(feePercent)
});
//CHECK THE SYMBOL AND NAME
describe("Deployment",()=>{
    it("Should track name and symbol",async()=>{
        expect(await nft.name()).to.equal("DApp NFT");
        expect(await nft.symbol()).to.equal("DAPP");
    })

    it("Should track feeAccount",async ()=>{
        expect(await marketplace.feePercent()).to.equal(feePercent);
        expect(await marketplace.feeAccount()).to.equal(deployer.address);
    })
})
//CHECK THE MINTING PROCESS
describe("Minting Nfts",()=>{
    it("Should track each minted NFT", async ()=>{
        await nft.connect(addr1).mint(URI);
        expect(await nft.tokenCount()).to.equal(1);
        expect(await nft.balanceOf(addr1.address)).to.equal(1);
        expect(await nft.tokenURI(1)).to.equal(URI);
    })
})

//MAKING MARKET PLACE ITEMS
describe("Making marketplace items", ()=>{
    beforeEach(async ()=>{
    //ADDR1 MINT AN NFT
    await nft.connect(addr1).mint(URI);
    //ADDR1 APPROVES MARKETPLACE TO SPEND NFT
    await nft.connect(addr1).setApprovalForAll(marketplace.address,true);
    });

    it("Should track newly created items,transfer NFT from seller to marketplace and emit offered event",async ()=>{
    //ADDR1 OFFERS THEIR NFT AT A PRICE OF 1 ETHER
    await expect(marketplace.connect(addr1).makeItem(nft.address,1,toWei(1)))
    .to.emit(marketplace,"Offered")
    .withArgs(
        1,
        nft.address,
        1,
        toWei(1),
        addr1.address
    )
    //CHECK IF THE NEW OWNER OF THE NFT WITH ID 1 IS THE MARKETPLACE
    expect(await nft.ownerOf(1)).to.equal(marketplace.address);
    //ITEM COUNT SHOULD NOW EQUAL 1
    expect(await marketplace.itemCount()).to.equal(1);
    //GET THE ITEM WITH ID 1
    const item = await marketplace.items(1);
    //CHECK IF ALL THE ITEMS ARE CORRECT
    expect(item.itemId).to.equal(1);
    expect(item.nft).to.equal(nft.address);
    expect(item.tokenId).to.equal(1);
    expect(item.price).to.equal(toWei(1));
    expect(item.sold).to.equal(false);

    })
    
    //CHECK IF IT REVERTS
    it("Should fail if price is less than 0",async ()=>{
        await expect(marketplace.connect(addr1).makeItem(nft.address,1,0))
        .to.be.revertedWith("Price must be greater that zero");
    })


})

describe("Purchasing marketplace items" , ()=>{
    let price = 2;
    let totalPriceInWei;
    beforeEach(async ()=>{
        //ADDRESS 1 MINTS AN NFT
        await nft.connect(addr1).mint(URI);
        //addr1 aproves marketplace to spend it
        await nft.connect(addr1).setApprovalForAll(marketplace.address,true);
        //addr1 makes their nft a marketplace item
        await marketplace.connect(addr1).makeItem(nft.address,1,toWei(price));
    })
    //CHECK IF THE ITEM UPDATES TO SOLD , IF THE SELLER WAS PAYED , THE NFT WAS TRANSFERED , AND IT ALL THE FEES WERE DONE
    it("Should update item as sold, pay seller, transfer NFT to buyer, charge fees and emit a Bought event",async ()=>{
    //CHECK THE BALANCES BEFORE
    const sellerInitialEthBal = await addr1.getBalance();
    const feeAccountInitialEthBal = await deployer.getBalance();
    //total price
    totalPriceInWei = await marketplace.getTotalPrice(1);
    //make the purchase and check the event
    await expect(marketplace.connect(addr2).purchaseItem(1,{value: totalPriceInWei}))
    .to.emit(marketplace,"Bought")
    .withArgs(
        1,
        nft.address,
        1,
        toWei(price),
        addr1.address,
        addr2.address
    );

    //CHECK THE BALANCES BEFORE
    const sellerFinalEthBal = await addr1.getBalance();
    const feeAccountFinalEthBal = await deployer.getBalance();
    //CHECK IF THE BALANCE OF THE SELLER HAS CHANGED
    expect(+fromWei(sellerFinalEthBal)).to.equal(+price+ +fromWei(sellerInitialEthBal));
    //CALCULATE FEE
    const fee = (feePercent/100) * price;
    //CHECKED IF THE BALANCE OF THE DEPLOYER AS CHANGES
    expect(+fromWei(feeAccountFinalEthBal)).to.equal(+fee+ +fromWei(feeAccountInitialEthBal));
    //CHECK IF THE BUYER IS THE NEW OWNER
    expect(await nft.ownerOf(1)).to.equal(addr2.address);
    //THE ITEM SHOULD BE MARKED AS SOLD
    expect((await marketplace.items(1)).sold).to.equal(true);
    })
    //CHECK THE REVERTS
    it("Should fail for invalid item ids,sold items and when not enought ether is paid", async ()=>{
    //ITEM 2 DOEST EXIST
    await expect(marketplace.connect(addr2).purchaseItem(2,{value: totalPriceInWei}))
    .to.be.revertedWith("Item doesnt exist");
    //ITEM 0 DOESNT EXIST ALSO
    await expect(marketplace.connect(addr2).purchaseItem(0,{value: totalPriceInWei}))
    .to.be.revertedWith("Item doesnt exist");
    //DOESNT HAVE ENOUGH ETHER
    await expect(marketplace.connect(addr2).purchaseItem(1,{value: toWei(price)}))
    .to.be.revertedWith("Not enough ether to cover item price and market fee");


    });

})






})