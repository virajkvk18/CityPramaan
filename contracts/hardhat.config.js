require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
const privateKey = process.env.PRIVATE_KEY;
module.exports = {
  solidity: "0.8.24",
  networks: {
    tenderly: {
      url: "https://virtual.mainnet.eu.rpc.tenderly.co/8d2a987d-7fb8-4cd1-bd11-cc3408f705dd",
      chainId: 9991,
      accounts: privateKey ? [privateKey] : [],
    },
  },
};
