require("@nomiclabs/hardhat-waffle");

const fs = require("fs")
const privateKey = fs.readFileSync(".secret").toString()

const projectId = "8f400932cbb8406cae44bb12e9840528"

module.exports = {
  // The name of your application
  networks: {
    hardhat: {
      chainId: 1337
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${projectId}`,
      accounts: [privateKey]
    },
    mainnet: {
      url: `https://polygon-mainnet.infura.io/v3/${projectId}`,
      accounts: [privateKey]
    },
  },
  solidity: "0.8.4",
};
