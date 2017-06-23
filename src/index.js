import _ from 'lodash'
import TruffleContract from 'truffle-contract'
import Web3 from 'web3'
import IPFS from 'ipfs-mini'

import * as lmsr from './lmsr'
import * as oracles from './oracles'
import * as events from './events'
import * as markets from './markets'
import { promisify, promisifyAll } from './utils'

const parseInt = (s) => Number(_.split(s, ',').join(''))

const contractInfo = _.fromPairs([
        ['Math'],
        ['Event'],
        ['CategoricalEvent'],
        ['ScalarEvent'],
        ['EventFactory', { gas: parseInt('3,000,000') }],
        ['EtherToken'],
        ['CentralizedOracle'],
        ['CentralizedOracleFactory', { gas: parseInt('400,000') }],
        ['UltimateOracle'],
        ['UltimateOracleFactory', { gas: parseInt('900,000') }],
        ['LMSRMarketMaker'],
        ['Market', { gas: parseInt('300,000') }],
        ['StandardMarketFactory', { gas: parseInt('2,000,000') }]
].map(([name, defaults]) => [name, {
    artifact: require(`@gnosis.pm/gnosis-core-contracts/build/contracts/${name}.json`),
    defaults: defaults
}]))

/**
 * Represents the gnosis.js API
 */
class Gnosis {
    /**
     * Factory function for asynchronously creating an instance of the API
     * @param {string} [opts.ethereum] - The URL of a Web3 HTTP provider.
     If not specified, Web3 provider will be either the browser-injected Web3
     (Mist/MetaMask) or an HTTP provider looking at http://localhost:8545
     * @param {Object} [opts.ipfs] - ipfs-mini configuration object
     * @param {string} [opts.ipfs.host='ipfs.infura.io'] - IPFS node address
     * @param {Number} [opts.ipfs.port=5001] - IPFS protocol port
     * @param {string} [opts.ipfs.protocol='https'] - IPFS protocol name
     * @returns {Gnosis} An instance of the gnosis.js API
     */
    static async create (opts) {
        let gnosis = new Gnosis(opts)
        await gnosis.initialized()
        return gnosis
    }

    /**
     * <strong>Warning:</strong> Do not use constructor directly. Some asynchronous initialization will not be handled. Instead, use {@link Gnosis.create}.
     * @constructor
     */
    constructor (opts) {
        opts = _.defaultsDeep(opts || {}, {
            ipfs: {
                host: 'ipfs.infura.io',
                port: 5001,
                protocol: 'https'
            }
        })

        if (opts.ethereum == null) {
            // Prefer Web3 injected by the browser (Mist/MetaMask)
            if (typeof web3 !== 'undefined') {
                this.web3 = new Web3(web3.currentProvider)
            } else {
                this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
            }
        } else if (typeof opts.ethereum === 'string') {
            this.web3 = new Web3(new Web3.providers.HttpProvider(opts.ethereum))
        } else {
            throw new TypeError(`type of option \`ethereum\` '${typeof opts.ethereum}' not supported!`)
        }

        // IPFS instantiation
        this.ipfs = promisifyAll(
            new IPFS(opts.ipfs)
          )

        this.contracts = _.mapValues(contractInfo, (info) => {
            let c = TruffleContract(info.artifact)
            c.setProvider(this.web3.currentProvider)

            if (info.defaults != null) {
                c.defaults(info.defaults)
            }

            return c
        })

        this.TruffleContract = TruffleContract
    }

    async initialized () {
        let accounts
        [accounts, this.etherToken, this.standardMarketFactory, this.lmsrMarketMaker] = await Promise.all([
            promisify(this.web3.eth.getAccounts)(),
            this.contracts.EtherToken.deployed(),
            this.contracts.StandardMarketFactory.deployed(),
            this.contracts.LMSRMarketMaker.deployed()
        ])

        if (accounts.length > 0) {
            this.setDefaultAccount(accounts[0])
        }
    }

    setDefaultAccount (account) {
        this.defaultAccount = account
        _.forOwn(this.contracts, (c) => {
            c.defaults({
                from: account
            })
        })
    }
}

_.assign(Gnosis.prototype, oracles, events, markets)
_.assign(Gnosis, lmsr)

export default Gnosis
