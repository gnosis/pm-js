import _ from 'lodash'
import Promise from 'bluebird'
import TruffleContract from 'truffle-contract'
import Web3 from 'web3'
import * as oracles from './oracles'
import * as events from './events'

let parseInt = (s) => Number(_.split(s, ',').join(''))

const contractInfo = _.fromPairs([
        ['Math'],
        ['CategoricalEvent'],
        ['ScalarEvent'],
        ['EventFactory', { gas: parseInt('3,000,000') }],
        ['EtherToken'],
        ['CentralizedOracle'],
        ['CentralizedOracleFactory', { gas: parseInt('400,000') }],
        ['UltimateOracle'],
        ['UltimateOracleFactory', { gas: parseInt('900,000') }],
        ['LMSRMarketMaker'],
        ['StandardMarketFactory']
    ].map(([name, defaults]) => [name, {
        artifact: require(`../build/contracts/${name}.json`),
        defaults: defaults
    }]))

class Gnosis {
    static async create(opts) {
        let gnosis = new Gnosis(opts)
        await gnosis.initialized()
        return gnosis
    }

    constructor(opts) {
        opts = _.defaults(opts || {}, {
            ipfs: '',
            gnosisdb: 'https:/db.gnosis.pm'
        })

        if(opts.ethereum == null) {
            // Prefer Web3 injected by the browser (Mist/MetaMask)
            if(typeof web3 !== 'undefined') {
                this.web3 = new Web3(web3.currentProvider)
            } else {
                this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
            }
        } else if(typeof opts.ethereum === 'string') {
            this.web3 = new Web3(new Web3.providers.HttpProvider(opts.ethereum))
        } else {
            throw new TypeError(`type of option \`ethereum\` '${typeof opts.ethereum}' not supported!`)
        }

        this.contracts = _.mapValues(contractInfo, (info) => {
            let c = TruffleContract(info.artifact)
            c.setProvider(this.web3.currentProvider)

            if(info.defaults != null) {
                c.defaults(info.defaults)
            }

            return c
        })

        this.TruffleContract = TruffleContract
    }

    async initialized() {
        let accounts
        [accounts, this.etherToken] = await Promise.all([
            Promise.promisify(this.web3.eth.getAccounts)(),
            this.contracts.EtherToken.deployed()
        ])
        if(accounts.length > 0) {
            this.setDefaultAccount(accounts[0])
        }
    }

    setDefaultAccount(account) {
        this.defaultAccount = account
        _.forOwn(this.contracts, (c) => {
            c.defaults({
                from: account
            })
        })
    }
}

_.assign(Gnosis.prototype, oracles, events)

export default Gnosis;
