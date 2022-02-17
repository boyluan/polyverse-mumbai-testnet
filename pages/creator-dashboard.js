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
// Similar to (Line: 31) in our 'create-item.js' file
// And similar to (Line: 19) in our 'my-assets.js' file
import {
    nftaddress, nftmarketaddress
} from '../config'

// We're importing a reference to our nft abi
// The directory route: ../artifacts/contracts/NFT.sol/{}NFT.json
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'

// And importing a reference to our market abi
// The directory route: ../artifacts/contracts/NFTMarket.sol/{}NFTMarket.json
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'


// We want to have a component called 'CreatorDashboard'
// And instead of having a single array of Nfts, we're going to have 2
export default function CreatorDashboard() {
    // The first array is for nft's we've created
    const [nfts, setNfts] = useState([])
    // The second array is separate, and is for items that we've sold
    // So we're going to have 2 different views
    const [sold, setSold] = useState([])

    // Similar to (Line: 40) in our 'my-assets.js' file, we have our loading state
    // We have our setLoadingState
    const [loadingState, setLoadingState] = useState('not-loaded')
    useState(() => {
        loadNfts()
    }, [])

    // We have our loadNfts function
    // Very similar to our previous 'loadsNfts' function (see: Line 54) in our 'my-assets.js' file
    // The main difference is that right now, we have our items array that we've been working with (contd. below):
    // Where we map over the items
    // We also want to create a separate items array (Go to Line: 80)
    async function loadNfts() {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
        const data = await marketContract.fetchItemsCreated()

        const items = await Promise.all(data.map(async i => {
            const tokenUri = await tokenContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                sold: i.sold,
                image: meta.data.image,
            }
            return item
        }))

        // We also want to create a separate items array
        // Where we filter through the items array above (see Line: 64)
        // And we also attach a check to see if the item is sold
        // So we now have 2 arrays:
        // 1) the array with all of the items we've created 2) and one only for the sold items
        const soldItems = items.filter(i => i.sold)
        // And then this way, we can go ahead and set the sold items
        // As well as all of the items themselves
        setSold(soldItems)
        setNfts(items)
        setLoadingState('loaded')
    }

    // So now we can basically have 2 separate views
    // 1) We first want to show a list of all of the items we've created
    // 2) And then we also want to have a view of only the items that have sold

    // Step 1: is to map over all of the nft's (Line: 110)
    // And we're returning all of the items we've created, period.
    // Step 2: We also want to have a separate view (see Line: 125)
    // This will be slightly different, as we want to see IF there are any items in this array at all
    // And if there are, then we want to go ahead and map them over
    // Or, in reality it's just literally an array
    // But the main difference is that we can show and toggle a title if there are items that have been sold (contd. below)
    // By doing some logic like this (see Line: 127)
    // Where we say 'boolean(sold.length)':
    // Meaning if this is TRUE, then we can actually go ahead and return a <div> (see Line: 128)
    // This div will hold all of the UI we want to show in this case
    // And finally, we can go ahead and map over that array of items (see Line: 132)
    return (
        <div>
            <div className="p-4">
                <h2 className="text-2xl py-2">Items Created</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {
                        nfts.map((nft, i) => (
                            <div key={i} className="border shadow rounded-xl overflow-hidden">
                                <img src={nft.image} className="rounded" />
                                <div className="p-4 bg-black">
                                    <p className="text-2xl font-bold text-white">Price = {nft.price} MATIC</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
            <div className="px-4">
                {
                    Boolean(sold.length) && (
                        <div>
                            <h2 className="text-2xl py-2">Items sold</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4"></div>
                            {
                                sold.map((nft, i) => (
                                    <div key={i} className="border shadow rounded-xl overflow-hidden">
                                        <img src={nft.image} className="rounded" />
                                        <div className="p-4 bg-black">
                                            <p className="text-2xl font-bold text-white">Price - {nft.price} MATIC</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    )
                }
            </div>
        </div>
    )
}