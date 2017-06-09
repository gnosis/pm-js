pragma solidity ^0.4.2;

import "@gnosis.pm/gnosis-core-contracts/contracts/Utils/Math.sol";
import "@gnosis.pm/gnosis-core-contracts/contracts/Events/EventFactory.sol";
import "@gnosis.pm/gnosis-core-contracts/contracts/Tokens/EtherToken.sol";
import "@gnosis.pm/gnosis-core-contracts/contracts/Oracles/CentralizedOracleFactory.sol";
import "@gnosis.pm/gnosis-core-contracts/contracts/Oracles/UltimateOracleFactory.sol";
import "@gnosis.pm/gnosis-core-contracts/contracts/MarketMakers/LMSRMarketMaker.sol";
import "@gnosis.pm/gnosis-core-contracts/contracts/Markets/StandardMarketFactory.sol";

import "./ConvertLib.sol";

// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!

contract MetaCoin {
	using Math for *;

	mapping (address => uint) balances;

	event Transfer(address indexed _from, address indexed _to, uint256 _value);

	function MetaCoin() {
		balances[tx.origin] = 100;
	}

	function sendCoin(address receiver, uint amount) returns(bool sufficient) {
		if (!balances[msg.sender].safeToSub(amount) || !balances[receiver].safeToAdd(amount)) return false;
		balances[msg.sender] -= amount;
		balances[receiver] += amount;
		Transfer(msg.sender, receiver, amount);
		return true;
	}

	function getBalanceInEth(address addr) returns(uint){
		return ConvertLib.convert(getBalance(addr),2);
	}

	function getBalance(address addr) returns(uint) {
		return balances[addr];
	}
}
