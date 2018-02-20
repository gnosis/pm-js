/******************************************************************
*   This scripts aims to demonstrate how to create a scalar prediction market
*   using GnosisJS.
*   Prerequisites:
*   - Have a testnet (TestRPC, Ganache) up and running on localhost port 8545 (testrpc -d -i 437894314312)
*   - Have the Gnosis contracts migrated on your local testnet
*     cd gnosis.js/node_modules/@gnosis.pm/gnosis-core-contracts/
*     npm install
*     npm run migrate
*   - Take a look at the config.json file
*
/*****************************************************************/

let Gnosis;
try {
    Gnosis = require('../');
} catch (err) {
    console.error(err)
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
const etherTokenAddress = config.etherTokenAddress;
const gasPrice = config.gasPrice;

const options = {
  ethereum: new Web3(hd_provider).currentProvider,
  ipfs: config.ipfs
};

const marketJSON = {
  'title': 'My first scalar prediction market',
  'description': 'This market was created by using GnosisJS library',
  'resolutionDate': new Date().toISOString(),
  'lowerBound': '100',
  'upperBound': '200',
  'decimals': 0,
  'unit': 'EUR',
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
      console.info("[GnosisJS] > Creating scalar Event...");
      return gnosisInstance.createScalarEvent({
        collateralToken: etherTokenAddress,
        oracle,
        lowerBound: marketJSON.lowerBound,
        upperBound: marketJSON.upperBound,
        gasPrice
      })
    }).then(result => {
      event = result;
      console.info("[GnosisJS] > Scalar event was created");
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
