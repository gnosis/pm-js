var ConvertLib = artifacts.require("./ConvertLib.sol");
var MetaCoin = artifacts.require("./MetaCoin.sol");
var Math = artifacts.require("@gnosis.pm/gnosis-core-contracts/contracts/Utils/Math.sol");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.deploy(Math);
  deployer.link(ConvertLib, MetaCoin);
  deployer.link(Math, MetaCoin);
  deployer.deploy(MetaCoin);
};
