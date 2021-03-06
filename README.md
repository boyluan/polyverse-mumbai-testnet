# Polyverse (Polygon-Mumbai & Next.js)
### Welcome 🧩

An NFT marketplace deployed to Polygon's Mumbai testnet network.

To get started with this project, see the following prerequisites:

1. Install Node.js on your computer
2. Add the Metamask wallet extension to your web browser


### Local Setup

git clone https://github.com/dabit3/polygon-ethereum-nextjs-marketplace.git

cd `polygon-ethereum-nextjs-marketplace`

# install using NPM or Yarn
`npm install`

# or

`yarn`

# Start the local Hardhat node
`npx hardhat node`

# Deploy smart contracts to local network in a separate terminal window
`npx hardhat run scripts/deploy.js --network localhost`

# Start App
`npm run dev`

1. cd into the `app` folder
2. Run `npm install` at the root of your directory
3. Run `npm run start` to start the project
4. Start coding :)

### Questions?
This project was put together by Nader Dabit (https://github.com/dabit3). So if you have any questions, it's best to refer to the comments made by others at the links below - as they likely would have found the answers to your questions already. Due to how my brain retains data, I've left extensive notes on my code. To supplement this however, I will also be uploading my code without any comments soon.

Link to YouTube tutorial: https://www.youtube.com/watch?v=GKJBEEXUha0

Link to step-by-step guide: https://dev.to/dabit3/building-scalable-full-stack-apps-on-ethereum-with-polygon-2cfb

Link to repository: https://github.com/dabit3/polygon-ethereum-nextjs-marketplace


## ##

# Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```
