import _ from 'lodash'
import { getTruffleArgsFromOptions, sendTransactionAndGetResult } from './utils'

export async function createMarket(opts) {
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
        resultContract: opts.marketContract
    })
}