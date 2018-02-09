/******************************************************************
*   This scripts is to demonstrate how to buy shares on a prediction market
*   using GnosisJS.
*   Prerequisites:
*   - Have testnet (TestRPC, Ganache) up and running on localhost port 8545 (testrpc -d -i 437894314312)
*   - Have gnosis contract migrated on your local testnet
*     cd gnosis.js/node_modules/@gnosis.pm/gnosis-core-contracts/
*     npm install
*     npm run migrate
*   - Have created a prediction market using either categorical_market_creation.js
*     or scalar_market_creation.js
*
/*****************************************************************/

let Gnosis
try {
    Gnosis = require('@gnosis.pm/gnosisjs');
} catch (err) {
    const error = 'Not able to find the module @gnosis.pm/gnosisjs on your project path,' +
    ' be sure to have it installed' +
    ' on your project.';
    console.error(error)
    process.exit();
}

const Web3 = require('web3');
const HDWalletProvider = require("truffle-hdwallet-provider");
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
// CHANGE THE MNEMONIC WITH THE ONE FROM YOUR TESTNET
const provider_url = config.blockchain.protocol + "://" + config.blockchain.host + ":" + config.blockchain.port;
const hd_provider = new HDWalletProvider(config.mnemonic, provider_url);
const gasPrice = config.gasPrice;

const options = {
  ethereum: new Web3(hd_provider).currentProvider,
  ipfs: config.ipfs
};

const marketAddress = "0x471978edf16a410377cf3e10add939e366e29556";
const outcomeIndex = "1"; // outcome to buy, is the index taken from the market outcomes array
const outcomeAmount = 0.5e18; // amount of shares to buy

let gnosisInstance;

return Gnosis.create(options)
.then(result => {
  gnosisInstance = result;
  console.info('[GnosisJS] > connection established');
  console.info("[GnosisJS] > Started buying shares on market with address " + marketAddress);
  return new Promise((resolve, reject) => {
    gnosisInstance.buyOutcomeTokens({
        market: marketAddress,
        outcomeTokenIndex: outcomeIndex,
        outcomeTokenCount: outcomeAmount,
        gasPrice
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error);
    });
  });
})
.then(() => {
  console.info("[GnosisJS] > Shares were bought successfully.");
})
.catch(error => {
  console.warn('[GnosisJS] > ERROR');
  console.warn(error);
});
