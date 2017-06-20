import _ from 'lodash'
import { getTruffleArgsFromOptions, Decimal } from './utils'

/**
 * Calculates the cost of buying specified number of outcome tokens from LMSR market.
 * @param {Contract|string} opts.market - Market to calculate LMSR costs on
 * @param {Number|string|BigNumber} opts.outcomeTokenIndex - The index of the outcome
 * @param {Number|string|BigNumber} opts.outcomeTokenCount - The number of outcome tokens to buy
 * @returns {BigNumber} The cost of the outcome tokens in event collateral tokens
 */
export async function calcCost(opts) {
    let args = getTruffleArgsFromOptions([
        'market',
        'outcomeTokenIndex',
        'outcomeTokenCount'
    ], opts)
    return await this._calcCost.call(...args)
}

/**
 * Estimates the number of outcome tokens which can be purchased by specified amount of collateral.
 * @param {Contract|string} opts.market - Market to calculate LMSR costs on
 * @param {Number|string|BigNumber} opts.outcomeTokenIndex - The index of the outcome
 * @param {Number|string|BigNumber} opts.outcomeTokenCount - The amount of collateral for buying tokens
 * @returns {BigNumber} The number of outcome tokens that can be bought
 */
export async function calcOutcomeTokenCount(opts) {
    // decimal.js making this reaaally messy :/
    let { market, outcomeTokenIndex, cost } = opts
    cost = new Decimal(cost.toString())

    // TODO: Figure out a better way to do this:
    let outcomeCount = Number((
        await (
            await this.gnosis.contracts.Event.at(
                await market.eventContract()
            )
        ).getOutcomeCount()).toString())

    let netOutcomeTokensSold = (await Promise.all(_.range(outcomeCount).map((i) => market.netOutcomeTokensSold(i)))).map((v) => new Decimal(v.toString()))
    let b = new Decimal((await market.funding()).toString()).dividedBy(new Decimal(outcomeCount).ln())
    return b.times(
        netOutcomeTokensSold.reduce((acc, numShares) =>
            acc.plus(
                new Decimal(numShares.toString())
                .plus(cost)
                .dividedBy(b)
                .exp()),
            new Decimal(0))
        .minus(netOutcomeTokensSold.reduce((acc, numShares, i) =>
            i === outcomeTokenIndex ? acc :
            acc.plus(
                new Decimal(numShares.toString())
                .dividedBy(b)
                .exp()),
            new Decimal(0)))
        .ln()).minus(netOutcomeTokensSold[outcomeTokenIndex]).floor()
}
