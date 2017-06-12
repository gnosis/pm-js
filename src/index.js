import _ from 'lodash'
import TruffleContract from 'truffle-contract'
import Web3 from 'web3'

import * as oracles from './oracles'

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

let contracts = _.zipObject(
    contract_names,
    contract_names.map(
        (name) => TruffleContract(require(`../build/contracts/${name}.json`))
    )
)

_.values(contracts).forEach((c) => {
    c.setProvider(web3.currentProvider)
})

function allContractsDeployed() {
    let name_contract_pairs = _.entries(contracts)
    return Promise.all(name_contract_pairs.map(([n, c]) => c.deployed())).then((contractSequence) =>
        _.zipObject(name_contract_pairs.map(([n, c]) => n), contractSequence))
}

export default class Gnosis {}
