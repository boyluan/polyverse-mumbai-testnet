const { expect } = require("chai");
const { ethers } = require("hardhat"); //

describe("NFTMarket", function () {
  // The idea/premise here, is to simulate deploying both of those contracts (contd. below)
  // Creating a new NFT
  // Putting that NFT for sale on the market
  // And then purchasing it from someone else
  it("Should create and execute market sales", async function () {
    // So to do this, we want to get a reference to that market contract
    const Market = await ethers.getContractFactory("NFTMarket")
    // So we deploy the market
    const market = await Market.deploy()
    // Wait for it to be deployed
    await market.deployed()
    // And then we get a reference to the address from which it was deployed
    // Because in the constructor of the NFT market (contd. below):
    // We have to pass in the value of that market address for our NFT constructor
    const marketAddress = market.address

    // Now we'll deploy the NFT contract, and get a reference to that
    const NFT = await ethers.getContractFactory("NFT")
    // We'll pass in the marketAddress to the constructor of the NFT
    const nft = await NFT.deploy(marketAddress)
    // We'll wait for that to finish deploying
    await nft.deployed()
    // And then we can get a reference to the nftContractAddress, as well
    const nftContractAddress = nft.address

    // So we have both a reference to the:
    // 1) marketAddress, as well as the 2) NFT contract itself

    // Now we're going to need a way to know how much the listingPrice is
    // We've already deployed our contract, so we can start interacting with it
    // So here we're going to get a reference to the value of the listingPrice
    let listingPrice = await market.getListingPrice()
    // And then we'll need to turn that into a string (contd. below):
    // Because we're gonna need to have that as a string, in order to be interacting with it
    listingPrice = listingPrice.toString()

    // Next we'll create a value for the auctionPrice
    // So this is going to be how much we'll be selling our items for
    // We can price it higher than 1 ether, since we're using $MATIC
    // We use this utility called 'ethers.utils.parseUnits':
    // And this allows us to work with these whole units, as opposed to wei (which is 18 decimals)
    const auctionPrice = ethers.utils.parseUnits('100', 'ether')

    // So what we're going to go ahead and do, is create a couple of different tokens
    // And put them up for sale
    // But first we have to actually create them
    // And to do this, we can interact with the nft contract
    // So we'll say nft.createToken
    // And pass in the URI of our token
    await nft.createToken("https://www.mytokenlocation")
    await nft.createToken("https://www.mytokenlocation2.com")

    // And then we can go ahead and list these 2 tokens on the actual market, now that they're created
    // We do this by calling 'createMarketItem' 
    // We then pass in the contract address of the nft deployment
    // We'll pass in the tokenId - which remember, we're starting with 1 and incrementing up
    // We're passing in the auctionPrice of 100 ether ($MATIC in our case)
    // And then we pass in the VALUE that'll be passed in for this transaction being paid to the contract owner (the listingPrice)
    // So we need to make sure that that value is there, as well
    await market.createMarketItem(nftContractAddress, 1, auctionPrice, { value: listingPrice })
    await market.createMarketItem(nftContractAddress, 2, auctionPrice, { value: listingPrice })

    // So now we've created all of these different transactions
    // Let's think about how we can get different addresses from different users, theoretically
    // In a real application, the users will be using MetaMask or some other wallet (contd. below)
    // And will interact with it from some wallet address
    // But in a testing environment, you can get a reference to a bunch of test accounts
    // For instance, when we run our hardhat node - we'll be given 20 accounts to work with
    // And you can also do this using the ethers library. You can get some test accounts

    // So in this case, you can call ethers.getSigners
    // This returns an array
    // And you can have as many items as you want, structured out of this array as you like
    // E.g. const [_, buyerAddress, thirdAddress, fourthAddress] etc

    // Now by default, if we're deploying (contd. below)
    // We're going to be working with the very first item in that array
    // So by default, we're not specifying an address - just deploying stuff
    // And that's going to be using the first address
    // But we want to specify a different address
    // So we ignore that first address by using an underscore - and now we're going to get a reference to the buyerAddress
    const [_, buyerAddress] = await ethers.getSigners()

    // And the reason we wanna do that, is because we don't want the buyer to be the same person as the seller
    // The seller is like the underscore (const [_, ...])
    // And then the buyer is this new buyerAddress (const [_, buyerAddress])
    // So now we can go ahead and say (contd. below):
    // We want to use this new buyerAddress to connect to the market -> market.connect(buyerAddress)
    // And then we want to create a MarketSale {{ createMarketSale }}, passing in:
    // 1) the smart contract address 2) the ID of the token 3) and the value of the auction price (100 $MATIC in our case)
    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, {value: auctionPrice})


    // So what we've done here is (contd. below):
    // 1) We've created 2 NFTs
    // 2) We've placed 2 NFTs on the marker for sale
    // 3) And then we've sold an NFT to someone else

    // So the last thing we might want to test, is querying for these MarketItems
    // We can go ahead and say we want a variable called 'items'
    // We want to go ahead and set that to market.fetchMarketItems
    // This is a function
    // Original code: const items = await market.fetchMarketItems()

    // (Contd. from Line: 130) \\

    // So what we basically want to do is (contd. below):
    // Let's say we want to map over all these items
    // And we want to update the value of them
    let items = await market.fetchMarketItems()

    // So what we might want to do is: repurpose the value of these items
    // So we say - we want to set these items to be the result of the map below:
    // Map: await Promise.all(items.map(async i => {})) \\
    // Where we're going to map over all of them
    // And we want to do this asynchronously - so we're going to say Promise.all:
    // And this allows you to do an asynchronous mapping
    items = await Promise.all(items.map(async i => {
      // The first thing we want to do is get the tokenURI
      // And we can do this by calling nft.tokenURI, and passing in the tokenId
      // And this gives us the actual URI of that value
      const tokenUri = await nft.tokenURI(i.tokenId)

      // And then we can now go ahead and create a new reference to the item
      // Where we can say we want to only return certain values
      let item = {
        // We're turning this big integer/number into a string (for the 'price' and 'tokenId')
        // Price will be displayed as an 18-number value, since we're using wei
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        // We're defining the seller and owner just by the address
        seller: i.seller,
        owner: i.owner,
        // We have the tokenUri that we've gotten by calling the nft smart contract
        tokenUri
      }
      // We're defining this new item value and then we're returning it
      return item

      // Notes (Repeated from above) \\
      // So we have the tokenUri that we've gotten by calling the nft smart contract
      // We're also turning this big integer/number into a string (for the 'price' and 'tokenId')
      // We're defining the seller and owner just by the address
      // We're defining this new item value and then we're returning it

      // So now when we visualize this by running ('npx hardhat test') in our node
      // It should make a lot more sense when we actually see it
    }))

    // And then we want to console that log
    console.log('items: ', items)

    // It's a pretty interesting test
    // It essentially tests out the main functionality  we want to work with

    //

    // Now what we'll see come back on the test we run in terminal, is a lot of weird values (contd. below):
    // We see BigNumber, for instance - and values we're not used to working with
    // So there are utilities that we can work with - or even functions on some of the values, that we can work with
    // For example: we can turn BigNumber into a string that is human readable
    // Anf we need to do that on the client-side, to visualize a lot of this information

    // But we can also update our test to do this, as well (Start after Line: 95)
    // Just to get an idea around some of the things we'll be doing on the client-side
  });
});
