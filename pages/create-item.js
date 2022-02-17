// Begin by importing the things we'll need

// This is a hook
// useState: allows you to keep up with local states
import { useState } from "react";

import { Contract, ethers } from "ethers";

// The ipfsHttpClient is a way for us to interact with ipfs:
// For UPLOADING and DOWNLOADING files
import { create as ipfsHttpClient } from 'ipfs-http-client';

// The useRouter hook allows us to programmatically route to different routes, using the router
// It also allows you to read values off of the route URI
import { useRouter } from "next/router";

// Web3Modal is a way for us to connect to someone's ethereum wallet
import Web3Modal from "web3modal"

// The next thing you want to do is create a variable called 'client'
// We're setting it = to the ipfsHttpClient
// Passing in the the URL
// This is an Infura URL that you can use, that basically sets and pins items to ipfs
// There are all types of other nodes that you can work with
// You can use your own pinning service, if you'd like
// However for this project, this URL should work fine
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

// The next thing we want to do is import the references to the nftaddress, and nftmarketaddress from our configuration
// Similar to (Line: 28) in our index.js file
import {
    nftaddress, nftmarketaddress
} from '../config'

// We'll go ahead and import our NFT reference
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'

// As well as our NFTMarket reference for our abi's
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

// The next thing we'll do is define our default export - or our component
// And we want to create a couple of pieces of local state, using useState
export default function CreateItem () {
    // The first one we want to set is the fileUrl
    // This is going to be for the ipfs file that we're going to allow the user to upload
    const [fileUrl, setFileUrl] = useState(null)

    // And then we also want to create some local state for the form input
    // This component allows someone to create an NFT
    // So we're going to allow them to upload a file, set the price of the NFT
    // And set its name and description
    // So we do that by using useState -- but instead of passing in a boolean, string, or integer or some other value:
    // We're actually passing in an object
    // And this object is going to contain the NFT's price, the name, and description values
    const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })

    // The next thing we'll do is create a reference to the router, using the useRouter hook
    // And we'll be using that in just a moment
    const router = useRouter()

    // So we have our local state ready
    // And we have 3 functions that we'll be creating here

    // 1) The first function is for CREATING and UPDATING the file url
    // Because right now it's set to 'null' (see Line: 46)
    // And we're gonna have a form input
    // So we can have a function called 'onChange'
    // And then we'll attach this to the input for the user's file input
    async function onChange(e) {
        // onChange will be invoked with an event
        // And this will have an event.target.files array which will be containing one item
        // So we're just going to take the first item out of that array
        const file = e.target.files[0]

        // And then we can have a try-catch block that we can work with here
        // In the try-catch block, this is what we'll use to upload the file to ipfs
        try {
            const added = await client.add(
                file,
                // You can also do a progress callback
                // And then console.log the progress of the file upload
                {
                    progress: (prog) => console.log(`received: ${prog}`)
                }
            )
            // Once the upload is complete, we'll have a reference to that 'added' variable (in Line: 78)
            // Using that variable, we can now set the url of where that file is now located
            // Because we know it's going to be at 'ipfs.infura.io/ipfs'
            // And we can say the: /${added.path} is the path that's given to us after the upload
            const url = `https://ipfs.infura.io/ipfs/${added.path}`

            // And then we can call setFileUrl -- passing in that URL
            // And then now when we create our NFT, we know where that file lives
            setFileUrl(url)
        } catch (e) {
            // Here we'll log out the error if there's an error
            console.log(e)
        }
    }

    // 2) Next we want to create the functions that allows the user to LIST an item for sale
    // There's quite a bit going on, so we're going to break this up into 2 separate functions:

    // i) The first function will allow a user to CREATE an item, and save it to ipfs
    // Which is going to be the reference to the nft
    // Because not only to we have that url referenced locally (contd. below)
    // But we want to upload a json representation of the nft, including the name, description, and the image/video/etc
    
    // This function will create the item, and save it to ipfs
    async function createItem() {
        // We'll first need to get the values from the form input
        const { name, description, price } = formInput
        // And then for some really basic form validation (contd. below)
        // We can say: if there's no name, description, price, or fileUrl - we want to go ahead and return 
        // Because you don't want to let them list something, if it doesn't have those values available
        if (!name || !description || !price || !fileUrl) return

        // We then want to go ahead and stringify the name, the description of the image in a variable called 'data'
        // NB: the JSON.stringify() method converts a JavaScript object or value to a JSON string
        const data = JSON.stringify({
            name, description, image: fileUrl
        })

        // And then we can save this value to ipfs, using the same method we did above (see Line: 78)
        // Where we called 'client.add' in the 'added' variable
        try {
            const added = await client.add(data)
            // Then we set a value called 'url'
            // This is going to be the ipfs path that includes the name, description, and the image url to a separate ipfs location
            // So we have 2 things happening now with ipfs
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            
            // After file is uploaded to ipfs, pass the url to save it on Polygon
            createSale(url)
        }   catch (error) {
            console.log('Error uploading file: ', error)
        }
    }

    // ii) The second function will allow the user to LIST the item for sale
    // And then with that url (see Line: 131)
    // We can set this url as the tokenURL by calling the function below, called 'createSale'

    // Think of 'createSale' as listing an item for sale
    // But we're also creating the NFT in the same function -- so we essentially have 2 things going on
    async function createSale(url) {
        // It's very similar to how we worked with web3Modal previously (see index.js - Line: 209)
        const web3Modal = new Web3Modal()
        // We call a reference to 'web3Modal.connect'
        const connection = await web3Modal.connect()
        // We then get the 'provider'
        const provider = new ethers.providers.Web3Provider(connection)
        // And we also get the 'signer'
        const signer = provider.getSigner()

        // The thing we're going to do here, is interacting with 2 smart contracts (contd. below)
        // i) The first thing we want to do, is interact with the nft smart contract
        // So we create a reference to the contract, and pass in the 'nftaddress', the abi, and signer
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
        // What we want to do next is call 'createToken'
        // And this is going to go ahead and create that token
        let transaction = await contract.createToken(url)
        // Then we want to wait for that transaction to succeed
        let tx = await transaction.wait()

        // What we now need to do, is we want to get the tokenId returned from that transaction
        // And this is a little complex (contd. below):
        // Because you can't simply wait for that return value, and use it as is
        // You have to do some modifications based on the return values
        // So there's an events array that we get back (contd. below)
        // And we can say we want to go ahead and get a reference to that events array by calling transaction.events
        // And getting the zeroth item
        let event = tx.events[0]

        // And then within that array, there's another array called 'args'
        // And we want the third value out of those arguments (because it is a '0' index: 0,1,2.. etc)
        let value = event.args[2]

        // And then that value needs to be turned into a number
        // Because right now it's a big number, and we want to turn that into a number, so we can call it that number
        // So now we have a reference to the tokenId
        let tokenId = value.toNumber()

        // Next, we want to do is get a reference to the price that we want to sell this item for
        // And this is basically going to turn that one basic number with the large numbers
        const price = ethers.utils.parseUnits(formInput.price, 'ether')

        // \\
        
        // We now want to move the reference of the smart contract away from being the 'nft'
        // And we want to create a reference to the 'nftmarketaddress' in the nftmarket smart contract
        // So we can use that same reference to the signer
        // And we're now going to be changing the contract variable to now be referring to the nftmarket contract
        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        // We want to get the listingPrice
        let listingPrice = await contract.getListingPrice()
        // We turn that listingPrice into a string (contd. below):
        // Because we want to be able to send the value within this transaction to the contract
        // To make sure that we're paying for that listing fee
        listingPrice = listingPrice.toString()

        // We wait for the 'contract.createMarketItem' to succeed
        transaction = await contract.createMarketItem(
            // And here we're passing in all the values that we need
            // We're passing in the nft smart contract address, the tokenId, and the price
            // So here, we're essentially putting this item up for sale
            // We're then setting the tokenId and the price
            // And then the 'value' that's going to be deducted/extracted from our wallet is the 'listingPrice'
            nftaddress, tokenId, price, { value: listingPrice }
        )
        // Then we wait for this transaction to succeed
        await transaction.wait()

        // And then now we want to go ahead and re-route the user to another page
        // And we're going to send them back to the main page
        // Where we're going to then re-fetch these nfts, and we're going to render them
        router.push('/')
    }

    // Now we can go ahead and return our UI
    // Here,  we basically want to have a form for the user to be able to interact with the functions we've coded
    // So we're going to wrap our form in a couple of divs
    // The first <div> is going to be a flexbox container - justify center
    // The the second is going to basically set the width as one-half
    // It's pretty generic, and probably not perfect on a responsive site, but it's a good start
    // 1) Input #1 sets the name [Line: 238] 2) Input #2 sets the description [Line: 248] 3) And input #3 sets the price [Line: 256]
    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                {/* The next thing we're going to do, is have inputs for the asset/nft name
                // Here, we're calling the placeholder of asset name
                // And we're gonna call 'updateFormInput' (see Line: 241)
                // So whenever someone types into this ('onChange' - Line: 241), we'll be updating that local form input variable
                // 'updateFormInput' will basically return all of the existing form input
                // And it will only change the name i.e. 'Asset Name'
                // So we're setting the name, and setting the value to be 'event.target.value' (Line: 241)
                */}
                <input
                    placeholder="Asset Name"
                    className="mt-8 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
                />
                {/* For the description, we're not just using a basic input
                // We're going to use a 'text area' to give the user a little bit more room to type
                // But a very similar thing happening on the 'onChange' handler
                // Where, instead of setting the name like we did above (see Line: 241), we're setting the 'description'
                */}
                <textarea
                    placeholder="Asset Description"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
                />
                {/* So here, we're setting the 'Asset Price' in MATIC
                // And this updates the price
                */}
                <input
                    placeholder="Asset Price in $MATIC"
                    className="mt-2 border rounded p-4"
                    onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
                />
                {/* Then finally, we want to go ahead and show the fileInput
                // Rather than using input with an 'onChange' handler, like with the event being passed similar to (see Lines: 241, 251, & 259)
                // Instead, we're just going to call this 'onChange' handler that we defined above (see Line: 69)
                // And we set the 'type' of input to be 'file'
                */}
                <input
                    type="file"
                    name="Asset"
                    className="my-4"
                    onChange={onChange}
                />
                {/* Following on from (Lines: 280-284)
                // The last thing we might want to do is show a preview of the file
                // So to do that, I'll say:
                // If there is a fileUrl (meaning that they've uploaded a file)
                // We want to show an image, with the image source being the fileUrl
                */}
                {
                    fileUrl && (
                        <img className="rounded mt-4" width="350" src={fileUrl} />
                    )
                }
                {/* We want to have a button that allows the user to create this digital asset
                // We're adding a className to it, to give it a little bit of styling
                // So we have a button with bold font, a margin, and a background etc
                // And the inputs we're working with have their own className's as well (margin, border, padding etc) **
                // Be sure to reference the 'createItem' function (see: Line 110) above
                */}
                <button
                    onClick={createItem}
                    className="font-bold mt-4 bg-purple-500 text-white rounded p-4 shadow-lg">
                    Create Digital Asset
                </button>
            </div>
        </div>
    )
}