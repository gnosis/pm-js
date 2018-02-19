/******************************************************************
*   This scripts aims to demonstrate how to resolve an existing
*   prediction market using GnosisJS.
*   Prerequisites:
*   - Have a testnet (TestRPC, Ganache) up and running on localhost port 8545 (testrpc -d -i 437894314312)
*   - Have the Gnosis contract migrated on your local testnet
*     cd gnosis.js/node_modules/@gnosis.pm/gnosis-core-contracts/
*     npm install
*     npm run migrate
*   - Have created a prediction market using either categorical_market_creation.js
*     or scalar_market_creation.js
*   - Take a look at the config.json file
*
/*****************************************************************/

let Gnosis;
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
let config;
if (process.argv.length == 2){
  config = require('./config.json');
}
else{
  config = require(process.argv[2])
}
const provider_url = config.blockchain.protocol + "://" + config.blockchain.host + ":" + config.blockchain.port;
const hd_provider = new HDWalletProvider(config.mnemonic, provider_url);
const web3Instance = new Web3(hd_provider);

const options = {
  ethereum: web3Instance.currentProvider,
  ipfs: config.ipfs
};

// Market properties
const marketAddress = "0x487ce41d066352bbc34916ac90664aa416bf6e53";
const eventOutcome = "1";

// Market stages are defined in market contract
const marketStages = {
  created: 0,
  funded: 1,
  closed: 2
}

let gnosisInstance;
let eventAddress;
let marketInstance;
let executionStep;

return Gnosis.create(options)
.then(result => {
  gnosisInstance = result;
  console.info('[GnosisJS] > connection established');
  console.info("[GnosisJS] > Market resolution for address " + marketAddress + " started...");
})
.then(() => {
  marketInstance = gnosisInstance.contracts.StandardMarket.at(marketAddress);
  return marketInstance.stage().then((stage) => {
    // Market has to have fund and not be closed!
    switch (stage.toNumber()) {
      case marketStages.created:
        return Promise.reject('Market cannot be resolved. It must be in funded stage (current is CREATED stage)');
      case marketStages.closed:
        return Promise.reject('Market cannot be resolved. It must be in funded stage (current is CLOSED stage)');
      default:
        return Promise.resolve();
    }
  });
})
.then(() => {
  return marketInstance.close().then(() => {
    console.info('[GnosisJS] > Market resolved');
    return marketInstance.stage().then((stage) => {
      if (stage.toNumber() !== marketStages.closed) {
        return Promise.reject("[GnosisJS] > OOPS, Market hasn't passed to closed stage. Check it manually.")
      }
    });
  })
})
.then(() => {
  console.info('[GnosisJS] > Obtaining event address...');
  return marketInstance.eventContract().then((address) => {
    eventAddress = address
  });
})
.then(() => {
  return gnosisInstance.resolveEvent({event: eventAddress, outcome: eventOutcome}).then(() => {
    console.info('[GnosisJS] > Event resolved');
  });
})
.then(() => {
  console.log('[GnosisJS] > Market resolved successfully.');
})
.catch(error => {
  console.warn('[GnosisJS] > ERROR');
  console.warn(error);
});
