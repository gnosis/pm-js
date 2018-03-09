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
const gasDefaultMaxMultiplier = 2

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

contractArtifacts.push(require('@gnosis.pm/olympia-token/build/contracts/OlympiaToken.json'))
contractArtifacts.push(require('@gnosis.pm/olympia-token/build/contracts/AddressRegistry.json'))

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
     * @param {string} [opts.defaultAccount] - The account to use as the default `from` address for ethereum transactions conducted through the Web3 instance. If unspecified, will be the first account found on Web3. See Gnosis.setWeb3Provider `defaultAccount` parameter for more info.
     * @param {Object} [opts.ipfs] - ipfs-mini configuration object
     * @param {string} [opts.ipfs.host='ipfs.infura.io'] - IPFS node address
     * @param {Number} [opts.ipfs.port=5001] - IPFS protocol port
     * @param {string} [opts.ipfs.protocol='https'] - IPFS protocol name
     * @param {Function} [opts.logger] - A callback for logging. Can also provide 'console' to use `console.log`.
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
     * **Warning:** Do not use constructor directly. Some asynchronous initialization will not be handled. Instead, use Gnosis.create.
     * @constructor
     */
    constructor (opts) {
        // Logger setup
        const { logger } = opts
        this.log = logger == null ? () => {} : logger === 'console' ? console.log : logger

        // IPFS instantiation
        this.ipfs = utils.promisifyAll(new IPFS(opts.ipfs))

        /**
         * A collection of Truffle contract abstractions for the following Gnosis contracts:
         *
         * - Math (https://gnosis.github.io/gnosis-contracts/docs/Math)
         * - Event (https://gnosis.github.io/gnosis-contracts/docs/Event)
         * - CategoricalEvent (https://gnosis.github.io/gnosis-contracts/docs/CategoricalEvent)
         * - ScalarEvent (https://gnosis.github.io/gnosis-contracts/docs/ScalarEvent)
         * - EventFactory (https://gnosis.github.io/gnosis-contracts/docs/EventFactory)
         * - Token (https://gnosis.github.io/gnosis-contracts/docs/Token)
         * - HumanFriendlyToken (https://gnosis.github.io/gnosis-contracts/docs/HumanFriendlyToken)
         * - EtherToken (https://gnosis.github.io/gnosis-contracts/docs/EtherToken)
         * - CentralizedOracle (https://gnosis.github.io/gnosis-contracts/docs/CentralizedOracle)
         * - CentralizedOracleFactory (https://gnosis.github.io/gnosis-contracts/docs/CentralizedOracleFactory)
         * - UltimateOracle (https://gnosis.github.io/gnosis-contracts/docs/UltimateOracle)
         * - UltimateOracleFactory (https://gnosis.github.io/gnosis-contracts/docs/UltimateOracleFactory)
         * - LMSRMarketMaker (https://gnosis.github.io/gnosis-contracts/docs/LMSRMarketMaker)
         * - Market (https://gnosis.github.io/gnosis-contracts/docs/Market)
         * - StandardMarket (https://gnosis.github.io/gnosis-contracts/docs/StandardMarket)
         * - StandardMarketFactory (https://gnosis.github.io/gnosis-contracts/docs/StandardMarketFactory)
         * - OlympiaToken (https://github.com/gnosis/olympia-token)
         *
         * These are configured to use the web3 provider specified in Gnosis.create or subsequently modified with Gnosis.setWeb3Provider. The default gas costs for these abstractions are set to the maximum cost of their respective entries found in the `gas-stats.json` file built from the core contracts (https://github.com/gnosis/gnosis-contracts#readme). Additionally, the default message sender (i.e. `from` address) is set via the optional `defaultAccount` param in Gnosis.setWeb3Provider.
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

        _.forOwn(this.contracts, (c, name, cs) => {
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
        await this.setWeb3Provider(opts.ethereum, opts.defaultAccount)
    }

    /**
     * Setter for the ethereum web3 provider.
     *
     * Note: this method is asynchronous and will return a Promise
     *
     * @param {(string|Provider)} [provider] - An instance of a Web3 provider or a URL of a Web3 HTTP provider. If not specified, Web3 provider will be either the browser-injected Web3 (Mist/MetaMask) or an HTTP provider looking at http://localhost:8545
     * @param {(string)} [defaultAccount] - An address to be used as the default `from` account for conducting transactions using the associated Web3 instance. If not specified, will be inferred from Web3 using the first account obtained by `web3.eth.getAccounts`. If no such account exists, default account will not be set.
     */
    async setWeb3Provider (provider, defaultAccount) {
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
        } else if (
            typeof provider === 'object' &&
            typeof provider.send === 'function' &&
            typeof provider.sendAsync === 'function'
        ) {
            this.web3 = new Web3(provider)
        } else {
            throw new TypeError(`provider of type '${typeof provider}' not supported`)
        }

        _.forOwn(this.contracts, (c) => { c.setProvider(this.web3.currentProvider) })

        if(defaultAccount == null) {
            const accounts = await utils.promisify(this.web3.eth.getAccounts)()

            if (accounts.length > 0) {
                this.setDefaultAccount(accounts[0])
            }
        } else {
            this.setDefaultAccount(defaultAccount)
        }

        await Promise.all([
            /**
             * If on mainnet, this will be an EtherToken contract abstraction pointing to the MakerDAO WETH contract (https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2#code).
             *
             * Otherwise, if EtherToken (https://gnosis.github.io/gnosis-contracts/docs/EtherToken/) is deployed to the current network, this will be set to an EtherToken contract abstraction pointing at the deployment address.
             *
             * @member {Contract} Gnosis#etherToken
             */
            (async () => {
                if(await utils.promisify(this.web3.version.getNetwork)() == 1) {
                    this.etherToken = this.contracts.EtherToken.at('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
                } else {
                    await this.trySettingContractInstance('etherToken', this.contracts.EtherToken)
                }
            })(),

            /**
             * If StandardMarketFactory (https://gnosis.github.io/gnosis-contracts/docs/StandardMarketFactory/) is deployed to the current network, this will be set to an StandardMarketFactory contract abstraction pointing at the deployment address.
             *
             * @member {Contract} Gnosis#standardMarketFactory
             */
            this.trySettingContractInstance('standardMarketFactory', this.contracts.StandardMarketFactory),

            /**
             * If LMSRMarketMaker (https://gnosis.github.io/gnosis-contracts/docs/LMSRMarketMaker/) is deployed to the current network, this will be set to an LMSRMarketMaker contract abstraction pointing at the deployment address.
             *
             * @member {Contract} Gnosis#lmsrMarketMaker
             */
            this.trySettingContractInstance('lmsrMarketMaker', this.contracts.LMSRMarketMaker),

            /**
             * If OlympiaToken (https://github.com/gnosis/olympia-token) is deployed to the current network (this should only work for Rinkeby), this will be set to an OlympiaToken contract abstraction pointing at the deployment address.
             *
             * @member {Contract} Gnosis#olympiaToken
             */
            this.trySettingContractInstance('olympiaToken', this.contracts.OlympiaToken),

            /**
             * If AddressRegistry (https://github.com/gnosis/olympia-token) is deployed to the current network (this should only work for Rinkeby), this will be set to an AddressRegistry contract abstraction pointing at the deployment address. This is intended for use with Olympia.
             *
             * @member {Contract} Gnosis#olympiaAddressRegistry
             */
            this.trySettingContractInstance('olympiaAddressRegistry', this.contracts.AddressRegistry),
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
        /**
         * The default account to be used as the `from` address for transactions done with this Gnosis instance. If there is no account, this will not be set.
         *
         * @member {string} Gnosis#defaultAccount
         */
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
