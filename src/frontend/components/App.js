
import logo from './logo.png';
import './App.css';
import {ethers} from "ethers";
import { useState } from 'react';
import{
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';
//IMPORT CONTRACTS METADATA
import MarketplaceAbi from '../contractsData/Marketplace.json';
import MarketplaceAddress from '../contractsData/Marketplace-address.json';
import NFTAddress from '../contractsData/NFT-address.json';
import NFTABI from '../contractsData/NFT.json';
import Navigation from './Navbar';
import Home from './Home.js'
import Create from './Create.js'
import MyListedItems from './MyListedItems.js'
import MyPurchases from './MyPurchases.js'
import { Spinner } from 'react-bootstrap'
function App() {
  //USE STATE HOOK TO STORE ACCOUNTS
  const[account,setAccount] = useState(null);
  const[marketplace,setMarketplace] = useState({});
  const[nft,setNFT] = useState({});
  const[loading,setLoading] = useState(true);

  //METAMASK LOGIN/CONNECT
  const web3Handler = async () => {
  //GET THE ACCOUNTS
  const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
  //SET IN THE USESTATE
  setAccount(accounts[0]);
  //GET THE PROVIDER
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  //SET THE SIGNER
  const signer = provider.getSigner();
 //LOAD CONTRACTS
  loadContracts(signer);
  }

  const loadContracts = async (signer) =>{
    // GET THE CONTRACT MARKETPLACE
    const marketplace = new ethers.Contract(MarketplaceAddress.address,MarketplaceAbi.abi,signer);
    //SET IT
    setMarketplace(marketplace);
    //GET THE CONTRACT NFT
    const nft = new ethers.Contract(NFTAddress.address,NFTABI.abi,signer);
    //SET IT
    setNFT(nft);
    //SET THE LOADING
    setLoading(false);
  }


  return (
    <BrowserRouter>
      <div className="App">
        <>
          <Navigation web3Handler={web3Handler} account={account} />
        </>
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <Spinner animation="border" style={{ display: 'flex' }} />
              <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={
                <Home marketplace={marketplace} nft={nft} />
              } />
              <Route path="/create" element={
                <Create marketplace={marketplace} nft={nft} />
              } />
              <Route path="/my-listed-items" element={
                <MyListedItems marketplace={marketplace} nft={nft} account={account} />
              } />
              <Route path="/my-purchases" element={
                <MyPurchases marketplace={marketplace} nft={nft} account={account} />
              } />
            </Routes>
          )}
        </div>
      </div>
    </BrowserRouter>
);}

export default App;
