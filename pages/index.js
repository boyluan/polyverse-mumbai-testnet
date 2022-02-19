// Section 2 ^^ \\

import { ethers, utils } from 'ethers'

// These are hooks
// useState: allows you to keep up with local states
// useEffect: is a hook that allows you to invoke a function when the component loads
import { useEffect, useState } from 'react'

// axios is a data-fetching library
import axios from 'axios'

// Web3Modal is a way for us to connect to someone's ethereum wallet
import Web3Modal from "web3modal"

// Next.js built-in image component -- <img/> element
// import Image from 'next/image' {{DEFUNCT}}

// Section 3 ^^ \\

// Now when we deploy our project, we're going to need to have a reference to our:
// 1) marketplace address, as well as our 2) nft address
// To do this, we create a file at the root of our project called 'config.js'

// Once we've deployed, we'll have those values filled in (the addresses)
// We can go ahead and import these
// So now we have a reference to our addresses, and we can proceed to the next steps
import {
  nftaddress, nftmarketaddress,
} from '../config'

// Section 4 ^^ \\

// So next we need our abi's
// Our abi's are essentially a json representation of our smart contract
// And it allows us to interact with it from a client-side application
// Now when we ran 'npx hardhat test' earlier (contd. below):
// hardhat automatically looked in our 'contracts' and compiled them
// And put them in a folder called 'artifacts'

// Now if we deleted that 'artifacts' folder and we wanted to compile it again
// We can either run another test: 'npx hardhat test'
// Or we can run 'npx hardhat compile' - and this would go ahead and compile those smart contracts again

// And whenever we compile those smart contracts (contd. below):
// We're creating some 'artifacts' that we will be able to reference within our client application
// And we see that we have an 'artifacts' directory in the left panel in VS Code

// So what we now want to do, is go ahead and import those artifacts
// And reference them in the index.js file that we're working in

// So the first thing we'll import is the nft abi
// This is the localized directory route: ../artifacts/contracts/NFT.sol/{}NFT.json (see create-item.js Lines: 41-47)
// import NFT from '../artifacts/contracts/NFT.sol/NFT.json' {{ DEFUNCT }}
import NFT from '../utils/NFT.json'

// The second thing we'll import is the nft Market abi
// The directory route: ../artifacts/contracts/NFTMarket.sol/{}NFTMarket.json (see create-item.js Lines: 41-47)
// import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json' {{ DEFUNCT }}
import Market from '../utils/NFTMarket.json'

// Now don't really worry about what's going on in those json files
// As this is just how just how the ethers client is going to know how to interact with the smart contracts - using the above abi's
// So we don't really need to do anything, other than reference those later on in our project


let rpcEndpoint = null

if (process.env.NEXT_PUBLIC_WORKSPACE_URL) {
  rpcEndpoint = process.env.NEXT_PUBLIC_WORKSPACE_URL
}



// Section 1 ^^ \\

// For the UI: the main files that we will be working with, are in the 'Pages' directory

// After configuring the basic styling/layout in _app.js (contd. below):
// The next thing we want to do is in our home page
// We want to update this to go ahead and fetch the assets from the marketplace, and show them
// Now we haven't created anything yet, so it'll be an empty array - but let's write the code to make all this work

// 1) First thing is to update the imports

export default function Home() {
  // Section 5 ^^ \\

  // const NFT = NFT.abi
  // const Market = NFTMarket.abi

  // So we've imported our references to our 'NFT' and our 'Market' abi's
  // Let's go ahead and create our initial state, that we're going to be working with in this component
  // We're going to have 2 pieces of State (contd.below):
  // 1) We're going to have an empty array of NFTs
  // 2) And then we're going to have a function to reset that array of NFTs
  // So when the app loads, we're going to have no NFTs
  // We're going to then call the smart contract, we're going to fetch that array, and then we're going to update the local state
  const [nfts, setNfts] = useState([])

  // We're also going to have a 'loadingState' and a 'setLoadingState' functionality
  // We're having the 'loadingState' as the variable
  // and the 'setLoadingState' is going to allow us to update the loadingState
  // And by default when the app loads, we're going to say the loadingState is set to 'not-loaded'
  // And then later on, whe we want to set the loadingState (contd. below)
  // At any time we can call: setLoadingState('loaded') - and we can set it to loaded, or whatever we would like
  // Using this loadingState, we can basically show or hide our UI:
  // And that's a good way for us to keep up with where the application currently is, in the lifecycle
  const [loadingState, setLoadingState] = useState('not-loaded')

  // So one of the functions we're going to need to create is called 'loadNFTs' (Line: 124)
  // And this is going to be where we call our smart contract and fetch our NFTs
  // And typically you'll want this function to be called when the app loads, or when the component loads
  // So the way we can invoke this function when the app loads, is by using the useEffect hook (in Line: 8)
  // So let's go ahead and call 'useEffect'
  useEffect(() => {
    // And here we're going to invoke the 'loadNFTs' function
    loadNFTs()
  }, [])

  // So the component loads
  // loadsNFTs gets invoked (contd. below)

  async function loadNFTs() {
    // And here we want to actually go ahead and talk to the smart contract
    // And load our NFTs
    // So the way we're going to do that is by working with one of the ethers providers
    // Now in a 'read' operation, we don't really need to know anything about the user
    // So we can use a generic provider called the 'JsonRpcProvider'
    const provider = new ethers.providers.JsonRpcProvider("https://rpc-mumbai.matic.today")

    // And now we can go ahead and configure the contract
    // By saying ethers.Contract - passing in the NFT smart contract address, the abi, as well as the provider
    // So here we're taking a reference to the actual NFT contract
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)

    // But we also want to go ahead and get a reference to the market contract
    // Because what we're basically going to do, is we're going to fetch the market items
    // And then we need to map over the market items
    // And we want to get the tokenURI by interacting with the token contract
    // So we basically need both of those (both Line: 135 & Line: 142)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)

    // The next thing we want to do is to actually go ahead and get the data
    // And this correlates directly to the 'fetchMarketItems' function (in Line: 268) of our 'NFTMarket.sol' smart contract
    // That is the function that we are calling
    // So we're returning all of the unsold market items
    // And this is going to be returning that array
    const data = await marketContract.fetchMarketItems()

    // And like we did before, we want to go ahead and map over all of those items
    // So we're going to say: create an item array called 'items'
    // This is going to be asynchronous because we have a couple asynchronous operations
    const items = await Promise.all(data.map(async i => {
      // So the first thing we want to do is call the tokenContract
      // And we want to get the tokenURI
      const tokenUri = await tokenContract.tokenURI(i.tokenId)

      // But one additional call we want to make is that with that tokenURI, we want to get the metadata from the token
      // So when you're working with ipfs:
      // We're going to be uploading a json representation of this NFT
      // Which is going to hold that information
      // So you're going to have the name of the token, the description..
      // And then the image - which is like a reference to the actual image or video etc
      // So to get that we're going to call axios.get - passing in the URI
      // So the URI might be something like 'https://ipfs...' - like some ipfs endpoint
      // Example Id: https://ipfs.org/nft/api/v1/example
      // So by calling that, we're going to be able to get the value that is returned from that
      const meta = await axios.get(tokenUri)

      // The next thing we're going to do is create a value called 'price'
      // And this is going to be something we set in the item property
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      // So we're going to have an item OBJECT
      // But we want to format the price
      // Because when it comes back, it will be in a format we can't really use
      // So to format, we call ethers.utils.formatUnits (in Line: 173) - passing in the price > toString, and saying 'ether'
      // And this way we can show a main value of 5, 10, 20, 100 etc $MATIC, for example - as opposed to 18 zeros appended to that
      // In addition to the price, we want to return a couple of other values
      // We want to set the tokenId, seller, owner, image (which is coming off that metadata), the name, and description
      // So this way we can kind of represent the NFT in a very visual manner
      let item = {
        price,
        itemId: i.itemId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      // And then here, we're just going to return the item
      return item

      // So we're mapping over the items array
      // And we're forming it into a very nice piece of data
      // We're kind of mutating the data and resetting it
    }))
    // And then we call 'setNfts'
    // This is gonna go ahead and set that new, updated items array
    setNfts(items)
    // And then we can call setLoadingState to be loaded
    setLoadingState('loaded')
  }

  // So above, we've created a function for loading the NFTs
  // But in this view, the user is also going to have the option to purchase an NFT
  // So we're rendering that array of NFTs
  // But we also want to give the user the ability to buy an NFT
  // So we're going to create a function called buyNft
  // And this will allow the user to connect to their wallet
  async function buyNft(nft) {
    // To connect to the wallet, we say (see Line: 211)
    // And this is going to go ahead and look for the instance of the ethereum being injected into the web browser
    const web3Modal = new Web3Modal()
    // If the user is connected, then we will have a connection that we can work with
    const connection = await web3Modal.connect()
    // We can now create a provider using that user's connection
    // Instead of using the .JsonRpcProvider - we're going to use the 'Web3Provider'
    // And we're passing in the connection
    const provider = new ethers.providers.Web3Provider(connection)

    // And since we're going to be writing an actual transaction (contd. below)
    // Not only do we need that user's address, but we need them to sign and execute an actual transaction
    // So to do that, we want to create a signer
    // We do that by saying provider.getSigner
    const signer = provider.getSigner()
    // And now when we get a reference to the contract:
    // We can say ethers.Contract
    // And instead of passing in the contract, the abi, and the basic provider
    // We're now passing in the 'signer' as the 3rd argument
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    // The next thing we'll do is we want to get a reference to the price
    // The price is coming is as an argument off of the NFT
    // So we're going to be mapping over the NFT
    // In the loadNfts function (in Line: 124), we have a reference to the price
    // And that price is going to be available to us as {{ nft.price }}
    // So we'll say nft.price.toString - and we're gonna be parsing that
    // And we'll basically be transforming that back from that basic string, and into a number that we can use here
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')

    // The next thing we want to do is create the market sale
    // In our NFTMarket.sol smart contract, we have a function called createMarketSale (Line: 203)
    // So here we're going to call contract.createMarketSale
    // We're passing in the 'nftaddress' as the 1st argument - coming from the import above (at Line: 28)
    // We also pass in the nft.tokenId
    // And then the value that's being sent is going to be the PRICE
    // So the price: is the money that's going to be transacted out of that user's wallet, into the other user's wallet
    const transaction = await contract.createMarketSale(nftaddress, nft.itemId, {
      value: price
    })
    // Then we're gonna call transaction.wait
    // And this is just a way to wait until this transaction is actually executed (contd. below)
    // Because maybe we want to wait for this transaction to complete, before we do something else
    await transaction.wait()

    // And in our case, the thing we want to do is reload the screen
    // Because we want to go ahead and remove that NFT by reloading
    // And calling loadNFTS in our case, again
    // So after the transaction has occurred, loadNFTS should now have 1 less NFT
    // Because buyNfts (at Line: 211) only shows the NFTS that are not yet sold
    // And since we just sold that NFT, it should not show up anymore
    loadNFTs()

    // We now have our functionality completed, in terms of the actual code
    // So now we can proceed to updating our main UI (see Line: 286)

    // We only had 2 main functions:
    // 1) One for loading the unsold NFTs
    // 2) One for buying the NFTs
  }

  // And what we can now do with that loadingState (contd. below):
  // If loadingState is = to 'loaded', and the nfts.length is empty
  // We can basically tell the user "hey! there are no items in the marketplace"
  // So this is essentially what we're going to be seeing when we first run the app
  // Because when the app loads, there aren't going to be any items

  // So this is a pretty basic way to show the user, after the app has loaded:
  // If there are no items, then someone needs to go ahead and create one
  // This will be more of a thing the user sees the first time the app loads, and no-one has created anything
  if (loadingState === 'loaded' && !nfts.length) return (
    <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
  )

  return (
    // First, create a <div> with some styling that we're going to be working with
    // This is our MAIN container -- Level 1 div
    <div className="flex justify-center">
      {/* Next, we're going to create another div
      // Here we're setting the className as padding x of 4
      // And we're setting a maxWidth of 1,600 pixels manually -- not even using tailwind.css (contd. below):
      // You can also go into your tailwind configuration and set this up yourself, but it's a little bit extra work
      // But for this project: if the user has a widescreen, we want to stop it at 1,600 pixels - and this is a simple way to do that
      // This is our CHILD container -- Level 2 div
      */}
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        {/* The next thing we'll do, is we'll have one more <div> inside the initial <div> (at Line: 289)
        // So we're kind of going nested now, to where we have 3 levels of div's
        // This is our GRID container -- Level 3 div
        // And this is a cool way to kind of have a responsive design
        // So when there's a very wide screen: we're gonna show 4 columns (grid-cols-4)
        // When the screen gets smaller: we're gonna display 2 columns (grid-cols-2)
        // And then when it gets really small: we'll display only 1 column (grid-cols-1)
        // So this is a way to do responsive design
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {/* Next we're going to go ahead and start mapping over the NFTs
          // For each NFT we're going to return something
          // Not only are we going to get the NFT in the argument:
          // We're also going to get the index
          // And the index is just going to allow us to set the key
          */}

          {/* We want to display: the nft image, name, description, and price
          // We also want to create a way for the user to purchase the NFT (see Line: 332)
          // The button allows the user to say 'buyNft' -- passing in the NFT
          // And then this invokes the buyNft function (from Line: 211)
          */}
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} />
                <div>
                  <p style={{ height: '64px' }} className="text-2xl font-semibold p-4">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400 p-4">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} MATIC</p>
                  <button className="w-full bg-purple-500 text-white font-bold py2 px12 rounded" onClick={() => buyNft(nft)}>Buy</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
