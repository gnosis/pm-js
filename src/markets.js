import { wrapWeb3Function } from './utils'

/**
 * Creates a market.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @function
 * @param {(Contract|string)} opts.event - The forwarded oracle contract or its address
 * @param {(Contract|string)} opts.marketMaker - The collateral token contract or its address
 * @param {(number|string|BigNumber)} opts.fee - The fee factor. Specifying 1,000,000 corresponds to 100%, 50,000 corresponds to 5%, etc.
 * @returns {Contract} The created market contract instance
 * @alias Gnosis#createMarket
 */
export const createMarket = wrapWeb3Function((self, opts) => ({
    callerContract: opts.marketFactory,
    callerABI: self.contracts.MarketFactory.abi,
    methodName: 'createMarket',
    eventName: 'MarketCreation',
    eventArgName: 'market',
    resultContract: self.contracts.Market,
    argAliases: {
        event: 'eventContract',
    }
}))
