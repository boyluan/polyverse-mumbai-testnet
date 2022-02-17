// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// ERC721URIStorage inherits from ERC721
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Define your smart contract
contract NFT is ERC721URIStorage {
    // Use the Counters utility
    // We'll now be able to use the Counters.Counter to declare a variable called '_tokenIds'
    using Counters for Counters.Counter;

    // _tokenIds allow you to keep up with an incrementing value for a unique identifier for each token
    // So when the first token is minted - it will get a value of 0, the second will have a value of 2, and so on..
    // Using 'Counters' it will allow us to continue icnrementing these _tokenIds
    Counters.Counter private _tokenIds;

    // 'contractAddress' is a variable
    // This is going to be the address of the marketplace that we want to allow the NFT to be able to interact with, and vice versa
    // Example: we want to give the marketplace the ablity to transact with the tokens
    // Or be able to change the ownership of these tokens from a separate contract
    // We do that by callling this function 'setAprovalForAll'
    address contractAddress;

    // And here we're going to be passing in the value of the 'contractAddress'
    // Which we set in the constructor
    // The constructor is going to be taking in the NFT marketplace address as the only argument
    // And then we're setting the contractAddress as the arguement of marketplaceAddress
    // So when we deploy this contract, we need to pass in the address of the actual marketplace
    // So we're going to first be deploying the marketplace, and then deploying the contract
    // And then now we can reference the marketplace address anywhere within this smart contract by referencing the 'contractAddress'
    constructor(address marketplaceAddress) ERC721("Metaverse Tokens", "METT") {
        contractAddress = marketplaceAddress;
    }

    // Next, we're going to create a function called 'createToken'
    // This is going to be the only functon that we have in this contract
    // And this is going to be for minting new tokens
    // The only value we get/pass in here is the tokenURI
    // That's because we don't need to pass in the marketplaceAddress, since it's already stored above
    // We don't need to pass in the tokenIds either, because that's already being kept up within the smart contract
    // We also know who the person is invoking this, because it's a transaction
    // And so we're going to have the message.sender available
    // So we have a lot of metadata available, even though we're only passing in the tokenURI
    function createToken(string memory tokenURI) public returns (uint) {
        // First thing we want to do is increment the tokenIds
        // So this is going to increment the value, beginning with 0 and going up form there
        _tokenIds.increment();

        // We then create a variable called newItemId
        // And this is going to get the current value of the tokenIds
        uint256 newItemId = _tokenIds.current();

        _mint(msg.sender, newItemId);
        // The _setTokenURI function was made available to us from ERC721URIStorage
        _setTokenURI(newItemId, tokenURI);
        // The 'setApprovalForAll' is going to give the marketplace the approval to transact this token between users, from within another smart contract
        // If we did not do this, then we would not be able to do this any other contract
        setApprovalForAll(contractAddress, true);
        // For the purposes of our frontend app, wee're going to also return the ItemId
        // That's because if we do decide to interact with the smart contract from a client application.. (contd. below)
        // The way that this is going to happen: is we're typically going to mint the token, and set it for sale in a subsequent transaction
        // And in order to put it up for sale, we need to know the ID of the token (ItemId)
        // So by returning it, we can get a hold of that on the client appliction
        return newItemId;

        // That concludes the NFT smart contract
    }
}