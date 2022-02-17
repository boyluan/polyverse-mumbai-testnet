// {{ RE-POST FROM index.js - Line 21 }}
// Now when we deploy our project, we're going to need to have a reference to our:
// 1) marketplace address, as well as our 2) nft address
// To do this, we create a file at the root of our project called 'config.js'

// nftaddress is = to empty string
export const nftaddress = "0x9Dd4a0E94270DD2D69d2897a757E7E2F9808a593"
export const nftmarketaddress = "0xf7f6c3b5c6e99C3150054deFF9c7C700F62E37c3"

// Once we've deployed, we'll have those values filled in
// So now we can return to index.js and import those - so that we have a reference to our addresses
