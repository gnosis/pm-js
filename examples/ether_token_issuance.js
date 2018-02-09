/******************************************************************
*   This scripts is to demonstrate how to issue Ether Tokens
*   using GnosisJS.
*   Prerequisites:
*   - Have testnet (TestRPC, Ganache) up and running on localhost port 8545 (testrpc -d -i 437894314312)
*   - Have gnosis contract migrated on your local testnet:
*     cd gnosis.js/node_modules/@gnosis.pm/gnosis-core-contracts/
*     npm install
*     npm run migrate
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
const etherTokenAddress = config.etherTokenAddress;
const provider_url = config.blockchain.protocol + "://" + config.blockchain.host + ":" + config.blockchain.port;
const hd_provider = new HDWalletProvider(config.mnemonic, provider_url);
const web3Instance = new Web3(hd_provider);
const tokensAmount = 4e18; // Amount of tokens to issue/deposit

const options = {
  ethereum: web3Instance.currentProvider,
  ipfs: config.ipfs
};

return Gnosis.create(options)
.then(result => {
  gnosisInstance = result;
  console.info('[GnosisJS] > connection established');
  console.info("[GnosisJS] > Issuance started...");
  etherTokenContract = gnosisInstance.contracts.EtherToken.at(etherTokenAddress);
  return new Promise((resolve, reject) => {
    etherTokenContract.deposit({ value: tokensAmount }).then(result => {
      console.info('[GnosisJS] > Issuance ended successfully.');
      resolve();
    })
    .catch(error => {
      console.warn('[GnosisJS] > Error while sending tokens');
      console.warn(error);
      reject(error);
    });
  });
})
.catch(error => {
  console.warn('[GnosisJS] > ERROR');
  console.warn(error);
});
