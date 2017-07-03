import { getTruffleArgsFromOptions, sendTransactionAndGetResult } from './utils'

/**
 * Creates a market.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {(Contract|string)} opts.event - The forwarded oracle contract or its address
 * @param {(Contract|string)} opts.marketMaker - The collateral token contract or its address
 * @param {(number|string|BigNumber)} opts.fee - The fee factor. Specifying 1,000,000 corresponds to 100%, 50,000 corresponds to 5%, etc.
 * @returns {Contract} The created market contract instance
 * @alias Gnosis#createMarket
 */
export async function createMarket (opts) {
    let args = getTruffleArgsFromOptions([
        'event',
        'marketMaker',
        'fee'
    ], opts)

    return await sendTransactionAndGetResult({
        factoryContract: opts.marketFactory,
        methodName: 'createMarket',
        methodArgs: args,
        eventName: 'MarketCreation',
        eventArgName: 'market',
        resultContract: this.contracts.Market
    })
}
