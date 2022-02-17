// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");


// Additional Notes \\

// This file by default, contains a basic deploy script
// It's pretty cool because it's essentially what we're going to be doing when we deploy locally

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const NFTMarket = await hre.ethers.getContractFactory("NFTMarket");
  const nftMarket = await NFTMarket.deploy();

  await nftMarket.deployed();

  console.log("nftMarket deployed to:", nftMarket.address);

  // So we've deployed our NFTMarket
  // Now let's go ahead and deploy the NFT

  const NFT = await hre.ethers.getContractFactory("NFT");
  // We're also going to create a reference to wait for the NFT to actually be deployed
  // Using the nftMarket.address as the argument, because we need to set that address in the NFT marketplace
  const nft = await NFT.deploy(nftMarket.address);
  // The next thing we want to do is just wait for this to be deployed
  await nft.deployed();
  // We want to console.log the nft address, as well as the nft market address
  // Because we need to update our config.js with those values
  console.log("nft deployed to:", nft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
