import _ from 'lodash'
import TruffleContract from 'truffle-contract'
import Web3 from 'web3'
import IPFS from 'ipfs-mini'

import * as lmsr from './lmsr'
import * as utils from './utils'
import * as oracles from './oracles'
import * as events from './events'
import * as markets from './markets'

const windowLoaded = new Promise((accept, reject) => {
    if(typeof window === 'undefined')
        return accept()

    if(typeof window.addEventListener !== 'function')
        return reject(new Error('expected to be able to register event listener'))

    window.addEventListener('load', function loadHandler(event) {
        window.removeEventListener('load', loadHandler, false)
        return accept(event)
    }, false)
})

const gasStatsData = require('@gnosis.pm/gnosis-core-contracts/build/gas-stats.json')
const gasLimit = 4e6
const gasDefaultMaxMultiplier = 1.5

const implementationInterfaceMap = {
    StandardMarket: ['Market'],
}

const contractArtifacts = [
    'Math',
    'Event',
    'CategoricalEvent',
    'ScalarEvent',
    'EventFactory',
    'Token',
    'HumanFriendlyToken',
    'EtherToken',
    'CentralizedOracle',
    'CentralizedOracleFactory',
    'UltimateOracle',
    'UltimateOracleFactory',
    'LMSRMarketMaker',
    'Market',
    'StandardMarket',
    'StandardMarketFactory',
].map((name) => require(`@gnosis.pm/gnosis-core-contracts/build/contracts/${name}.json`))

const instanceModules = [oracles, events, markets]

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

        /**
         * A collection of Truffle contract abstractions for the following Gnosis contracts:
         *
         * - [Math](https://gnosis.github.io/gnosis-contracts/docs/Math)
         * - [Event](https://gnosis.github.io/gnosis-contracts/docs/Event)
         * - [CategoricalEvent](https://gnosis.github.io/gnosis-contracts/docs/CategoricalEvent)
         * - [ScalarEvent](https://gnosis.github.io/gnosis-contracts/docs/ScalarEvent)
         * - [EventFactory](https://gnosis.github.io/gnosis-contracts/docs/EventFactory)
         * - [Token](https://gnosis.github.io/gnosis-contracts/docs/Token)
         * - [EtherToken](https://gnosis.github.io/gnosis-contracts/docs/EtherToken)
         * - [CentralizedOracle](https://gnosis.github.io/gnosis-contracts/docs/CentralizedOracle)
         * - [CentralizedOracleFactory](https://gnosis.github.io/gnosis-contracts/docs/CentralizedOracleFactory)
         * - [UltimateOracle](https://gnosis.github.io/gnosis-contracts/docs/UltimateOracle)
         * - [UltimateOracleFactory](https://gnosis.github.io/gnosis-contracts/docs/UltimateOracleFactory)
         * - [LMSRMarketMaker](https://gnosis.github.io/gnosis-contracts/docs/LMSRMarketMaker)
         * - [Market](https://gnosis.github.io/gnosis-contracts/docs/Market)
         * - [StandardMarket](https://gnosis.github.io/gnosis-contracts/docs/StandardMarket)
         * - [StandardMarketFactory](https://gnosis.github.io/gnosis-contracts/docs/StandardMarketFactory)
         *
         * These are configured to use the web3 provider specified in {@link Gnosis.create} or subsequently modified with {@link Gnosis#setWeb3Provider}. The default gas costs for these abstractions are set to the maximum cost of their respective entries found in the `gas-stats.json` file built from the [core contracts](https://github.com/gnosis/gnosis-contracts#readme). Additionally, the default message sender (i.e. `from` address) is set to the first account reported by the web3 provider.
         *
         * @member {Object} Gnosis#contracts
         */
        this.contracts = _.fromPairs(contractArtifacts.map((artifact) => {
            const c = TruffleContract(artifact)
            const name = c.contract_name

            if(gasStatsData[name] != null) {
                c.prototype.gasStats = gasStatsData[name]
                c.addProp('gasStats', () => gasStatsData[name])
            }

            return [name, c]
        }))

        _.forEach(this.contracts, (c, name, cs) => {
            const maxGasCost = Math.max(
                ...Object.values(c.gasStats || {}).map(
                    (fnStats) => fnStats.max != null ? fnStats.max.gasUsed : -Infinity),
                ..._.flatMap(implementationInterfaceMap[name] || [],
                    (implName) => Object.values(cs[implName].gasStats || {}).map(
                        (fnStats) => fnStats.max != null ? fnStats.max.gasUsed : -Infinity))
            )

            if(maxGasCost > 0) {
                c.defaults({ gas: Math.min(gasLimit, (gasDefaultMaxMultiplier * maxGasCost) | 0) })
            }
        })

        this.TruffleContract = TruffleContract

        instanceModules.forEach((module) => {
            Object.keys(module).forEach((instanceProp) => {
                if(
                    this[instanceProp] != null &&
                    typeof this[instanceProp].estimateGas === 'function'
                ) {
                    this[instanceProp].estimateGas = this[instanceProp].estimateGas.bind(this)
                }
            })
        })
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
            // Window must be loaded first so that there isn't a race condition for resolving injected Web3 instance
            await windowLoaded

            if (typeof web3 !== 'undefined') {
                this.web3 = new Web3(web3.currentProvider)
            } else {
                this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
            }
        } else if (typeof provider === 'string') {
            this.web3 = new Web3(new Web3.providers.HttpProvider(provider))
        } else if (typeof provider === 'object' && provider.constructor.name.toLowerCase().endsWith('provider')) {
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
            /**
             * If [EtherToken](https://gnosis.github.io/gnosis-contracts/docs/EtherToken/) is deployed to the current network, this will be set to an EtherToken contract abstraction pointing at the deployment address.
             *
             * @member {Contract} Gnosis#etherToken
             */
            this.trySettingContractInstance('etherToken', this.contracts.EtherToken),

            /**
             * If [StandardMarketFactory](https://gnosis.github.io/gnosis-contracts/docs/StandardMarketFactory/) is deployed to the current network, this will be set to an StandardMarketFactory contract abstraction pointing at the deployment address.
             *
             * @member {Contract} Gnosis#standardMarketFactory
             */
            this.trySettingContractInstance('standardMarketFactory', this.contracts.StandardMarketFactory),

            /**
             * If [LMSRMarketMaker](https://gnosis.github.io/gnosis-contracts/docs/LMSRMarketMaker/) is deployed to the current network, this will be set to an LMSRMarketMaker contract abstraction pointing at the deployment address.
             *
             * @member {Contract} Gnosis#lmsrMarketMaker
             */
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

_.assign(Gnosis.prototype, ...instanceModules)
_.assign(Gnosis, lmsr, utils)

export default Gnosis
