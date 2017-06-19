let Math = artifacts.require("@gnosis.pm/gnosis-core-contracts/contracts/Utils/Math.sol");
let EventFactory = artifacts.require("@gnosis.pm/gnosis-core-contracts/contracts/Events/EventFactory.sol");
let EtherToken = artifacts.require("@gnosis.pm/gnosis-core-contracts/contracts/Tokens/EtherToken.sol");
let CentralizedOracleFactory = artifacts.require("@gnosis.pm/gnosis-core-contracts/contracts/Oracles/CentralizedOracleFactory.sol");
let UltimateOracleFactory = artifacts.require("@gnosis.pm/gnosis-core-contracts/contracts/Oracles/UltimateOracleFactory.sol");
let LMSRMarketMaker = artifacts.require("@gnosis.pm/gnosis-core-contracts/contracts/MarketMakers/LMSRMarketMaker.sol");
let StandardMarketFactory = artifacts.require("@gnosis.pm/gnosis-core-contracts/contracts/Markets/StandardMarketFactory.sol");

module.exports = function(deployer) {

  deployer.link(Math, EventFactory)
  deployer.deploy(EventFactory)

  deployer.deploy(CentralizedOracleFactory)

  deployer.link(Math, UltimateOracleFactory)
  deployer.deploy(UltimateOracleFactory)

  deployer.link(Math, LMSRMarketMaker)
  deployer.deploy(LMSRMarketMaker)

  deployer.link(Math, StandardMarketFactory)
  deployer.deploy(StandardMarketFactory)

  deployer.link(Math, EtherToken)
  deployer.deploy(EtherToken)

};
