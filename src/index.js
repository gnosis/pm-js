import TruffleContract from 'truffle-contract'
import Web3 from 'web3'

let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

let contract_names = [
    'Math',
    'EventFactory',
    'EtherToken',
    'CentralizedOracleFactory',
    'UltimateOracleFactory',
    'LMSRMarketMaker',
    'StandardMarketFactory'
]

let contracts = contract_names.reduce((obj, name) => Object.assign(obj, {[name]: TruffleContract(require(`../build/contracts/${name}.json`))}), {})

Object.values(contracts).forEach((c) => {
    c.setProvider(web3.currentProvider)
})

let allContractsDeployed = () => Promise.all(Object.values(contracts).map((c) => c.deployed()))

export default class Gnosis {}
