import _ from 'lodash'
import TruffleContract from 'truffle-contract'
import Web3 from 'web3'
import IPFS from 'ipfs-mini'

import * as lmsr from './lmsr'
import * as utils from './utils'
import * as oracles from './oracles'
import * as events from './events'
import * as markets from './markets'

const parseInt = (s) => Number(s.replace(/ /g, ''))

const gasStatsData = require('@gnosis.pm/gnosis-core-contracts/build/gas-stats.json')

const contractInfo = _.fromPairs([
        ['Math'],
        ['Event'],
        ['CategoricalEvent'],
        ['ScalarEvent'],
        ['EventFactory', { gas: parseInt('3 000 000') }],
        ['Token'],
        ['EtherToken'],
        ['CentralizedOracle'],
        ['CentralizedOracleFactory', { gas: parseInt('400 000') }],
        ['UltimateOracle'],
        ['UltimateOracleFactory', { gas: parseInt('1 000 000') }],
        ['LMSRMarketMaker'],
        ['Market', { gas: parseInt('500 000') }],
        ['StandardMarketFactory', { gas: parseInt('2 000 000') }]
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
     *
     * Note: this method is asynchronous and will return a Promise
     *
     * @param {(string|Provider)} [opts.ethereum] - An instance of a Web3 provider or a URL of a Web3 HTTP provider. If not specified, Web3 provider will be either the browser-injected Web3 (Mist/MetaMask) or an HTTP provider looking at http://localhost:8545
     * @param {Object} [opts.ipfs] - ipfs-mini configuration object
     * @param {string} [opts.ipfs.host='ipfs.infura.io'] - IPFS node address
     * @param {Number} [opts.ipfs.port=5001] - IPFS protocol port
     * @param {string} [opts.ipfs.protocol='https'] - IPFS protocol name
     * @returns {Gnosis} An instance of the gnosis.js API
     */
    static async create (opts) {
        opts = _.defaultsDeep(opts || {}, {
            ipfs: {
                host: 'ipfs.infura.io',
                port: 5001,
                protocol: 'https'
            }
        })

        let gnosis = new Gnosis(opts)
        await gnosis.initialized(opts)
        return gnosis
    }

    /**
     * **Warning:** Do not use constructor directly. Some asynchronous initialization will not be handled. Instead, use {@link Gnosis.create}.
     * @constructor
     */
    constructor (opts) {
        // IPFS instantiation
        this.ipfs = utils.promisifyAll(new IPFS(opts.ipfs))

        this.contracts = _.mapValues(contractInfo, (info) => {
            const c = TruffleContract(info.artifact)
            const name = c.contract_name

            if(gasStatsData[name] != null) {
                c.prototype.gasStats = gasStatsData[name]
                c.addProp('gasStats', () => gasStatsData[name])
            }

            if (info.defaults != null) {
                c.defaults(info.defaults)
            }

            return c
        })

        this.TruffleContract = TruffleContract
    }

    async initialized (opts) {
        await this.setWeb3Provider(opts.ethereum)
    }

    /**
     * Setter for the ethereum web3 provider.
     *
     * Note: this method is asynchronous and will return a Promise
     *
     * @param {(string|Provider)} [provider] - An instance of a Web3 provider or a URL of a Web3 HTTP provider. If not specified, Web3 provider will be either the browser-injected Web3 (Mist/MetaMask) or an HTTP provider looking at http://localhost:8545
     */
    async setWeb3Provider (provider) {
        if (provider == null) {
            // Prefer Web3 injected by the browser (Mist/MetaMask)
            if (typeof web3 !== 'undefined') {
                this.web3 = new Web3(web3.currentProvider)
            } else {
                this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
            }
        } else if (typeof provider === 'string') {
            this.web3 = new Web3(new Web3.providers.HttpProvider(provider))
        } else if (typeof provider === 'object' && provider.constructor.name.endsWith('Provider')) {
            this.web3 = new Web3(provider)
        } else {
            throw new TypeError(`provider of type '${typeof provider}' not supported`)
        }

        _.forOwn(this.contracts, (c) => { c.setProvider(this.web3.currentProvider) })

        const accounts = await utils.promisify(this.web3.eth.getAccounts)()

        if (accounts.length > 0) {
            this.setDefaultAccount(accounts[0])
        }

        await Promise.all([
            this.trySettingContractInstance('etherToken', this.contracts.EtherToken),
            this.trySettingContractInstance('standardMarketFactory', this.contracts.StandardMarketFactory),
            this.trySettingContractInstance('lmsrMarketMaker', this.contracts.LMSRMarketMaker),
        ])
    }

    async trySettingContractInstance(instanceName, contract) {
        try {
            this[instanceName] = await contract.deployed()
        } catch(e) {
            delete this[instanceName]
            if(!e.message.includes('has not been deployed to detected network')) {
                throw e
            }
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
_.assign(Gnosis, lmsr, utils)

export default Gnosis
