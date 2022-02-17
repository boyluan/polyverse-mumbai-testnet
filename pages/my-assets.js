// Begin by importing the things we'll need

import { ethers } from "ethers";

// These are hooks
// useState: allows you to keep up with local states
// useEffect: is a hook that allows you to invoke a function when the component loads
import { useEffect, useState } from 'react';

// axios is a data-fetching library
import axios from 'axios'

// Web3Modal is a way for us to connect to someone's ethereum wallet
import Web3Modal from "web3modal";

// Next, we want to import the references to the nftaddress, and nftmarketaddress from our configuration
// Similar to (Line: 28) in our 'index.js' file
// And similar to (Line: 31) in our 'create-item.js' file
import {
    nftaddress, nftmarketaddress
} from '../config'

// We're importing a reference to our nft abi
// The directory route: ../artifacts/contracts/NFT.sol/{}NFT.json
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'

// And importing a reference to our market abi
// The directory route: ../artifacts/contracts/NFTMarket.sol/{}NFTMarket.json
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'


// We have our main component name called 'MyAssets'
// This is the component where we're calling the function where we're only returning the items that we have purchased ourselves
// So these are going to be the items that we've bought 
export default function MyAssets() {
    // We're going to have a couple pieces of local state
    // 1) One is going to be for the array of nft's
    const [nfts, setNfts] = useState([])
    // 2) The other is going to be showing the loading state of loaded or not loaded
    const [loadingState, setLoadingState] = useState('not-loaded')

    // We'll then have a function called loadNfts, that we can call in useEffect
    useEffect(() => {
        loadNfts()
    }, [])

    // And the 'loadNfts' function is going to basically be very similar to what we've done before
    // In this case, we're still using web3Modal
    // And instead of when we called to query the array in the index.js (contd. below)
    // Where we were just calling, using the json rpc provider
    // In this case, we do actually need to provide a signer
    // Because we need to know who the message.sender is
    // So we're kind of combining a little bit of functionality from a couple of other components that we've worked with
    async function loadNfts() {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        // So we're using the 'signer' (see Line: 58) to get a reference to the marketContract
        // Because we actually need to know the message.sender
        // Meaning that if we navigate to this page, and we haven't already authenticated with a wallet (contd. below)
        // We will automatically see that wallet modal pop up
        const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
        // We then fetch the market items, calling 'marketContract.fetchMyNFTs'
        const data = await marketContract.fetchMyNFTs()

        // We then map them over
        const items = await Promise.all(data.map(async i => {
            // We do some of that similar functionality where we get the token URI, token metadata
            const tokenUri = await tokenContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            // Following on from (Line: 71), we then update this data below:
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
            }
            return item
        }))
        // Then we set the nft's
        setNfts(items)
        // And we set the loadingState
        setLoadingState('loaded')
    }
    // Next, we check to see if the loading state is loaded in
    // And if there are no nft's, then we basically give the user some feedback (contd. below)
    // Saying: 'Hey, you haven't purchased anything. So there are no Nfts'
    if (loadingState === 'loaded' && !nfts.length) return (
        <h1 className="py-10 px-20 text-3xl">No assets owned</h1>
    )

    // And then finally, we'll go ahead and return our UI
    // Here, we're going to have a similar layout to that of our 'create-item.js' file
    // Where we have a couple of div's for the layout
    // So we're essentially mapping over the nft's that we've purchased
    // And we want to go ahead and return something (contd. below)
    // Which is just a view of the nft itself, with the image, and the price we paid
    // It's a fairly simple UI compared to that of our 'create-item.js' file, where we have a button for the user to purchase an Nft
    return (
        <div className="flex justify-center">
            <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {
                        nfts.map((nft, i) => (
                            <div key={i} className="border shadow rounded-xl overflow-hidden">
                                <img src={nft.image} className="rounded" />
                                <div className="p-4 bg-black">
                                    <p className="text-2xl font-bold text-white">Price - {nft.price} MATIC</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}