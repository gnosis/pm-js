/******************************************************************
*   This scripts is to demonstrate how to create a categorical prediction market
*   using GnosisJS.
*   Prerequisites:
*   - Have testnet (TestRPC, Ganache) up and running on localhost port 8545 (testrpc -d -i 437894314312)
*   - Have gnosis contract migrated on your local testnet
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
const provider_url = config.blockchain.protocol + "://" + config.blockchain.host + ":" + config.blockchain.port;
const hd_provider = new HDWalletProvider(config.mnemonic, provider_url);
const etherTokenAddress = config.etherTokenAddress;
const gasPrice = config.gasPrice;

const options = {
  ethereum: new Web3(hd_provider).currentProvider,
  ipfs: config.ipfs
};

const marketJSON = {
  'title': 'My first categorical prediction market',
  'description': 'This market was created by using GnosisJS library',
  'outcomes': ['Yes', 'No'],
  'resolutionDate': new Date().toISOString(),
  'fee': 0,
  'funding': 1e18 // 1 Ether token
};

let gnosisInstance;
let ipfsHash;
let oracle;
let market;

return Gnosis.create(options)
.then(result => {
  gnosisInstance = result;
  console.info('[GnosisJS] > connection established');
  console.info("[GnosisJS] > Creation started...");
}).then(() => {
  return new Promise((resolve, reject) => {
    let eventDescription = {
      title: marketJSON.title,
      description: marketJSON.description,
      resolutionDate: marketJSON.resolutionDate,
    };

    return gnosisInstance.publishEventDescription(eventDescription).then(result => {
        ipfsHash = result;
        console.info("[GnosisJS] > Event description hash: " + ipfsHash);
        console.info("[GnosisJS] > Creating Centralized Oracle...");
        return gnosisInstance.createCentralizedOracle(ipfsHash, { gasPrice });
    }).then(result => {
      oracle = result;
      console.info("[GnosisJS] > Centralized Oracle was created");
      console.info("[GnosisJS] > Creating categorical Event...");

      return gnosisInstance.createCategoricalEvent({
          collateralToken: etherTokenAddress,
          oracle,
          // Note the outcomeCount must match the length of the outcomes array published on IPFS
          outcomeCount: marketJSON.outcomes.length,
          gasPrice
      });
    }).then(result => {
      event = result;
      console.info("[GnosisJS] > Categorical event was created");
      console.info("[GnosisJS] > Creating market...");
      return gnosisInstance.createMarket({
          event: event,
          marketMaker: gnosisInstance.lmsrMarketMaker,
          marketFactory: gnosisInstance.standardMarketFactory,
          fee: marketJSON.fee,
          gasPrice
      })
    }).then(response => {
      market = response; // market instance
      console.info("[GnosisJS] > Market was created, address " + market.address);
      console.info("[GnosisJS] > Funding market...");
      const etherToken = gnosisInstance.contracts.EtherToken.at(etherTokenAddress);
      return new Promise((resolve, reject) => {
        etherToken.approve(market.address, marketJSON.funding).then(result => {
          console.info('[GnosisJS] > Market tokens were approved');
          console.info('[GnosisJS] > Sending funds: ' + marketJSON.funding + '...');
          market.fund(marketJSON.funding).then(result => {
            console.info("[GnosisJS] > Market creation done successfully");
            resolve();
          })
          .catch(error => {
            console.warn('[GnosisJS] > Error while sending tokens');
            console.warn(error);
            reject(error);
          });
        })
        .catch(error => {
          console.warn('[GnosisJS] > Error while approving tokens');
          console.warn(error);
          reject(error);
        });
      });
    }).then(values => {
      console.info("[GnosisJS] > All done!");
      resolve(market.address);
    })
    .catch(error => {
      console.warn(error);
      reject(error);
    });
  })
})
.catch(error => {
  console.warn('[GnosisJS] > ERROR');
  console.warn(error);
});
