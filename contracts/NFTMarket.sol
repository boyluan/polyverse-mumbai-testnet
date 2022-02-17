// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// We're going to have 1 new import from openzeppelin called 'ReentrancyGuard'
// This is a security mechanism that is going to give us a utility called non-reentrant
// And it's going to allow us to protect certain transactions that are actually talking to a separate contract
// This is done to prevent someone hitting this with multiple requests/transactions - and doing shady things
// This is a security control that prevents re-entry attacks
// So we can use this non-reentracnt helper whenever we want to implement that functionality
// And we'll be doing this on any function that talks to a different contract
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    // The reason we need to keep up with the number of items sold, is because when you're working with arrays in solidity, you cannot have dynamic length arrays
    // So you need to know the length of the arrays
    // We'll be working with a few arrays (contd. below):
    // 1) No. of items I've bought myself 2) No. of items I've created myself 3) No. of items that are currently not sold
    // We're going to need those numbers because we're going to be returning those values
    // And in order to do that: we can either map over the arrays and check for each individual value, and determing it on the fly
    // Or in this case, we're going to keepn up with the number of items sold
    // Doing this will give us a few different values (contd. below):
    // 1) The total number of items i.e. ItemIds value 2) No. of items sold 3) Calculate the number of items that have not been sold
    // So when we want to create a view on our NFT marketplace items (contd. below):
    // We can say we know 100 items have been created; 30 have been sold; and so we can return an array of 70 items that have not yet been sold
    // And so when we create that array, we know the length of that array
    Counters.Counter private _itemsSold;

    // Create a variable for the owner of the contract
    // Set it as a value called 'owner'
    // The reason we want to set this, is becasue we want to be able to determine who is owner of the contract because they'll be making a commission on every item that is sold
    // This is unique to our smart contract, however. This is not the only way of going about this
    // You can calculate and program all types of different ways for different parties to get paid
    // But an interesting way of going about this, is to charge a listing fee
    // And then anyone that decides to list an item, has to pay that listing fee
    // And then the owner of the smart contract makes a commission on everyone's transactions
    address payable owner;
    // Set listing price
    // When we're working with ether, it's 18 decimal places (same as Polygon/matic)
    // So you could use those decimal places/that number 0.025000000 and talk about the value in wei or gwwei
    // And those are different values that you typically work with
    // But I think it makes a lot more sense when you're working with these extremely long numbers, to just rely on that top-level value (0.025)
    uint256 listingPrice = 0.025 ether;

    // For the constructor of this smart contract, we want to set the owner as the msg.sender
    // This is basically saying that the owner of this smart contract is the person deploying it
    // And that's basically going to be the contractAddress that we deploy this with
    constructor() {
        owner = payable(msg.sender);
    }

    // Next we want to define a struct for each individual market item (MarketItem)
    // Think of a {{ struct }} as like an object or a map in other programming languages
    // Essentially what we want to do is we want to have a value that holds other values as a map
    struct MarketItem {
        uint itemId;
        // nftContract = contractAddress
        address nftContract;
        // tokenId = ID of that token
        uint256 tokenId;
        // Address for the seller
        address payable seller;
        // Address for the owner
        address payable owner;
        // Integer for the price
        uint256 price;
        // boolean for whether it is sold or NOT
        bool sold;
    }

    // Now we want to create a mapping for our MarketItem
    // We want to start keeping up with all of the items that have been created
    // And the way that we can do that is to basically have a mapping where we are passing in an integer (which is the itemId), and it returns a MarketItem
    // So if I create a new MarketItem > it has an itemId (contd. below)
    // Then I want to be able to go in and fetch that MarketItem based on that itemId
    // This mapping allows us to do that - where can keep up with the itemIds (contd. below)
    // And all we need to do to fetch each individual MarketItem is know the itemId (the ID of that item)
    // And that will subsequently return all of the data in the struct above (the MarketItem struct)
    mapping(uint256 => MarketItem) private idToMarketItem;

    // Next we want to have an event for when a MarketItem is created
    // This event is going to match the MarketItem itself, pretty well
    // And this is just a way for us to omit an event, anytime someone creates a new MarketItem
    // You typically do this if you want to have a way to listen to these events from a frontend application, for instance
    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    // Next, we want to have a function that returns the listing price
    // When we deploy our smart contract, we don't actually know on the frontend, how much it is to list an item - so we need that value
    // Of course, we could just hard-code it - but this is a better way of doing it
    // Because this way, we can just call the contract, get that listing price, and make sure that we're sending the correct amount of payment across
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    // So we have our base configuration set up
    // Now we need to have two functions for interacting with the smart contract
    // 1) The first for creating a MarketItem - and putting it up for sale
    // 2) The other is for creating a market sale for actually buying or selling an item between parties
    
    // Function #1: createMarketItem
    // The 3 arguements that we have in the function are going to be (contd. below)
    // 1) The contract address for the NFT (NFT.sol)
    // 2) We must also pass in the ID for the token from that contract
    // 3) We're also going to pass in the price that the token is being put on sale for
    // So I define the price as a user (on the marketplace)
    // Or whoever is putting an item for sale, defines the price - typically on a client application, and we pass it in as an argument
    // We're also using this 'nonReentrant' modifier - and this will prevent a re-entry attack
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    )   public payable nonReentrant {
        // So the first thing we want to do, is we want to require a certain condition
        // The condition we want to require, is that the price be greater than 0
        // So we don't want people listing anything for free (at least one way)
        // Although in the real world, a lot of applications set that to 0.1 eth
        require(price > 0, "Price must be at least 1 wei");
        // We also want to require that the user sending in this transaction, is passing in the required listing price
        // So when I create this MarketItem, I need to send along some payment to pay for the listing
        // And this listing price is going to be locked into the smart contract (contd. below)
        // And upon transaction of someone buying or selling, we want to then transfer that value to the contract owner
        // So we're just requiring that the person sends in the listing price (payment) along with the transaction
        require(msg.value == listingPrice, "Price must be equal to listing price");

        // The next thing we want to do is increment our itemIds
        // And then we're going to create a variable called itemId
        // This is going to be the ID for the marketplace item that is going for sale right now
        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        // And then we're going to go ahead and create our mapping for this MarketItem
        // Here, we're going to create the MarketItem as well as set the mapping for that MarketItem
        // So we're saying idToMarketItem[itemId] - so for example: it could be idToMarketItem[1]
        // And then we're creating the MarketItem itself, and we're setting all the values (as seen below)
        idToMarketItem[itemId] = MarketItem(
            // So the itemId is coming from {{ _itemIds.increment() }} above
            itemId,
            // The nftContract is coming from the {{ function createMarketItem }} argument above
            nftContract,
            // The tokenId is coming from the argument above, as well
            tokenId,
            // The person selling this is the {{ msg.sender }} - which is available in the transacton
            payable(msg.sender),
            // The owner is being set to an empty address
            // This is because in the MarketItem struct above, there's a seller and an owner (contd. below)
            // So the owner right now, is nobody. This is because the seller has it on sale, and nobody owns it at this point
            // So we set it as an empty address - and the way to action this, is by passing in the address with 0 value
            payable(address(0)),
            // We're also setting the price
            price,
            // And we're setting the boolean of if it has been sold, to FALSE
            // This is because if it's just being put up for sale - then of course, it is not yet sold
            // We're creating out first market item at this point
            false
        );

        // We now want to transfer the ownership of the NFT to the smart contract itself
        // Because right now, the person that is writing this transaction owns this - and we want to transfer that ownership to the contract
        // And then the smart contract is going to then take that ownership of this item, and transfer it to the next buyer
        // You can also have functions in there that allow people to cancel their marketplace items, and a bunch of other things
        // And the way the transfer is done is by using the IERC721 that's passing in the '(nftContract)'
        // And we 'transferFrom'  the msg.sender > to the smart contract address, itself
        // And then this is the tokenId
        // And this is a method that's available on the 'IERC721'
        // So once you've imported this from @openzeppelin, you'll have that method available
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        // And then finally, we want to emite the event that we created above ('idToMarketItem[itemId] = MarketItem')
        // Where we say a MarketItem has been created
        // And that's the end of our function ('public payable nonReentrant')
        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    // So we have two functions:
    // 1) One for getting the listing price ('getListingPrice')
    // 2) One for creating a market item ('createMarketItem')
        
    // And now the last function we want, is for creating a market sale
    // This is going to look a little similar to the 'createMarketItem'
    // In the sense that we're using the non-Reentrant modifier
    // We're also using the contract address (nftContract), as well as the itemId
    // We don't need to pass in the price, because the price is already known in the contract
    function createMarketSale(
        address nftContract,
        uint256 itemId
        )   public payable nonReentrant {
        
        // So the first thing we're going to do is create a couple of variables based on our arguments
        // We want to go ahead and get a reference to the price - so we're creating a variable called price
        // And the way we get that is by using the mapping
        // We do the same thing with tokenId
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;

        // And then we can require that the person sending this transaction has sent in the correct value
        // Because in a transaction, if I set it up for 100 $MATIC - then I'm expecting that message value to = the price
        // And if it's not, then a prompt will appear in an error message
        require(msg.value == price, "Please submit the asking price in order to complete the purchase");

        // Next we want to go ahead and transfer the value of the transaction (i.e. how much $$ was sent in the transaction)
        // We want to go ahead and transfer that value to the seller
        // So I'm the seller and I put something up for sale for 15 $MATIC (contd. below)
        // The value that's now passed in, is going to be available in {{ msg.value }}
        // And we're going to to ahead and transfer that to the owner's address
        idToMarketItem[itemId].seller.transfer(msg.value);

        // The next thing we'll want to do is transfer the ownership of this token to the msg.sender
        // So we're saying we're gonna transfer from this smart contract address, to the msg.sender - and this is the tokenId
        // So this is actually transferring the ownership of the digital good from the contract address to the buyer
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);

        // So we've done two 2 transactions things in the two lines of code, above
        // 1) We've sent money to the seller
        // 2) We've sent a digital asset (the NFT) to the buyer

        // The next thing we want to do, is set the local value for the owner to be the msg.sender
        idToMarketItem[itemId].owner = payable(msg.sender);
        // And in this case, we're just updating that mapping here
        // We go ahead and set that value to SOLD, using that same mapping {{ idToMarketItem[itemId] }}
        idToMarketItem[itemId].sold = true;
        // We also talked about keeping up with the no. of items sold
        // So let's go ahead and increment the items sold by 1
        _itemsSold.increment();
        // And finally, we want to go ahead and pay the owner of the smart contract
        // We do that by doing owner.transfer - and passing in the listingPrice
        // So now we're transferring the amount that the person listed the item for, to the smart contract owner
        // So this is the commission that the person running this marketplace might start making residually
        payable(owner).transfer(listingPrice);
    }

    // 1) So we've now finished writing the function for creating the MarketItem
    // 2) As well as the MarketSale
    
    // The next 3 functions are going to be fairly similar
    // We basically want to have different views of our different selection sets of our NFTs
    // We want to have (contd. below):
    // 1) A function that returns all of the unsold items
    // 2) A function that returns ONLY the items that I have purchased
    // 3) A function that returns all of the items that I've created
    // This allows me to have a view for all of the items I've created, purchased, and the unsold items
    // Which are likely the 3 main views you'd consider having in an DApp like this

    // This function is going to be available from the client application (DApp)
    // So it is PUBLIC
    // It's a view - it's not doing any transactional stuff
    // And it returns an array of market items
    // This function is for fetching thd NFTs that have NOT been purchased by anyone
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        // The first thing we want to do is create a variable called itemCount
        // And this will be the TOTAL number of items that we have currently created
        uint itemCount = _itemIds.current();

        // And then using the itemCount, we can go ahead and get an unsoldItemCount (contd. below)
        // You subtract the no. of value that we have, as the TOTAL items that have been created
        // And subtract the items that have been sold
        // So let's say we have a total of 100 items created, and we've sold 30
        // This means that the unsoldItemCount will be = 70
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();

        // And finally we want to keep up with the local value of incrementing a number
        // Because we're going to be looping over an array
        // And will want to keep up with a number within that loop
        uint currentIndex = 0;

        // So in our case, we're going to be looping over the no. of items created
        // And we want to increment that number if we basically have an empty address
        // That basically means if the item has an empty address - it means it has not yet been sold
        // And we want to populate an array with that unsold item - and we want to return that item
        // Because remember: we only want to return from this function, the no. of unsold items
        // So to do that, let's create an empty array called {{ items }}
        // And this is going to be the legnth of unsoldItemCount
        // And the value in this array are going to be of MarketItem
        // So we're saying we want MarketItem memory items is = to a new array
        // And it's going to be the legnth of unsoldItemCount
        // And that's why we needed to keep up with that value, above
        MarketItem[] memory items = new MarketItem[] (unsoldItemCount);

        // Now we're goint to loop over the number of items that have been created
        // And we're going to first check to see if this item is unsold
        // The way we can do that is we can use the idToMarketItem map
        // And look for the owner value - and we can look for the address to be an empty address
        // So the .owner is going to be an address already
        // And if you recall, when we created the mapping for creating a new MarketItem (contd. below)
        // We set the address to an empty address to begin with
        // The only time this address is populated with an actual address is if the item has been sold
        // So here we can detect all of the unsold items
        // And what we want to do is insert the item into this items array
        // And we also want to increment this current item
        for (uint i = 0; i < itemCount; i++) {
            if (idToMarketItem[i +1].owner == address(0)) {
                // We're now going to create a new variable called 'currentId'
                // And this is going to be the ID of the item that we're interacting with right now
                uint currentId = idToMarketItem[i + 1].itemId;

                // We're now going to create a value called 'currentItem'
                // This will get the mapping of the idToMarketItem passing in the currentId
                // This will give us a reference to the MarketItem that we want to insert into the array
                MarketItem storage currentItem = idToMarketItem[currentId];

                // We now insert that item into the array by saying (see line of code below)
                // So we start off like an empty array
                // We will start incrementing and setting that value there
                // So we're setting the value of the items at this index to be the current item
                items[currentIndex] = currentItem; // This is the {{ uint currentIndex = 0 }} value above

                // And then finally we need to increment the currentIndex
                currentIndex += 1;

                // Now we're basically looping over the number of items we have
                // And if the item has not yet been sold - we're inserting it into the {{ items }} array, above
            }
        }
        // And then now we can return this array from this function
        // And now we should be good to go
        return items;
    }

    // We're going to be replicating a very similar functionality to the above, a couple more times

    // The next function we'll be returning is the function for returning the NFTs that the user has PURCHASED them self
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        // Similarly to how we kept up with the totalItemCount - we'll be doing that here
        // Where we look for the itemIds that are current
        uint totalItemCount = _itemIds.current();

        // We're also going to keep up with a new variable called 'itemCount'
        // We need to have another counter that we're going to be keeping up with
        // Basically we have not been keeping up with (for example - contd. below):
        // If I've created an item myself, and I want to fetch the no. of items that I've created
        // We don't really have a function that will tell us this number/amount
        // The only values we've been keeping up with in terms of counting the no. of items created, are:
        // 1) The TOTAL no. of items created 2) The TOTAL no. of items sold
        // But we've not been keeping up with that number for each individual user
        uint itemCount = 0;
        uint currentIndex = 0;

        // So the way we can get that number is by looping over all of the items
        // And we can say (contd. below):
        // If the idToMarketItem owner is = to the msg.sender
        // We want to increment this item count by 1
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i +1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        // So by doing this, we can basically map over or loop over every single item in the array, that we'll be working with
        // And we can say: I've bought/own 5 or 6 items (contd. below)
        // So that's the number we'll be able to then populate that array like we did earlier
        // Now, using that array we can say (just as we did earlier), where we have this items array (contd. below)
        // We can now use the itemCount as the length of the array (as opposed to unsoldItemCount like previously)
        // In this function we're using the itemCount
        MarketItem[] memory items = new MarketItem[] (itemCount);
        // This will look similar to the previous function, where we map over the totalItemCount
        // And then we now are going to be checking to see if the owner address is = to the msg.sender (which means it'll be mine)
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i +1].owner == msg.sender) {
                // Here we will get the currentId - which will be the itemId
                uint currentId = idToMarketItem[i +1].itemId;
                // We then want to get the reference to the currentItem
                MarketItem storage currentItem = idToMarketItem[currentId];
                // Finally we want to insert that item into the array
                items[currentIndex] = currentItem;
                // And then we want to increment the currentIndex
                currentIndex += 1;
            }
        }
        // And then we're just going to return the items
        return items;
    }

    // 1) So now we have a function for fetching the NFTs that have NOT been purchased by anyone
    // 2) We have a function for fetching only the NFTs that you have purchased
    // And now the last function that we want to create (contd. below):
    // 3) Is returning an array of the NFTs that a user has created them self

    // This function is for returning an array of the NFTs that a user has created them self
    // This will look similar to the previous function (contd. below):
    // Where instead of looking for the OWNER to be the msg.sender
    // We'll be looking for the .seller to be the msg.sender
    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            // So we're checking to see if this item .seller is = to the msg.sender
            if (idToMarketItem[i + 1].seller == msg.sender) {
                // And then we increment that itemCount by 1
                itemCount += 1;
            }
        }

        // Then we create our MarketItem array of items
        MarketItem[] memory items = new MarketItem[] (itemCount);
        // then you go ahead and loop over all of the items in the project
        for (uint i = 0; i < totalItemCount; i++) {
            // We check to see if the seller address is = to the msg.sender
            // If it is, then it means that I'm the person who created this item
            if (idToMarketItem[i + 1].seller == msg.sender) {
                uint currentId = idToMarketItem[i + 1].itemId;
                // Then we can go ahead and get the currentItem
                // And insert that into the array
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                // And then we can go ahead and increment the currentIndex
                currentIndex += 1;
            }
        }
        // Then finally, we can return the items
        return items;
    }
}