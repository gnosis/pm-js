import _ from 'lodash'
import { getTruffleArgsFromOptions, Decimal } from './utils'

// TODO: Figure out a better way to do this:
async function getOutcomeCountFromMarket(market, Event) {
    return Number((
        await (
            await Event.at(
                await market.eventContract()
            )
        ).getOutcomeCount()).toString())
}

async function getNetOutcomeTokensSoldFromMarket(market, outcomeCount) {
    return (await Promise.all(_.range(outcomeCount).map(
        (i) => market.netOutcomeTokensSold(i)
    ))).map((v) => new Decimal(v.toString()))
}

/**
 * Calculates the cost of buying specified number of outcome tokens from LMSR market.
 * @param {Contract|string} opts.market - Market to calculate LMSR costs on
 * @param {Number|string|BigNumber} opts.outcomeTokenIndex - The index of the outcome
 * @param {Number|string|BigNumber} opts.outcomeTokenCount - The number of outcome tokens to buy
 * @returns {BigNumber} The cost of the outcome tokens in event collateral tokens
 * @alias Gnosis#lmsrMarketMaker.calcCost
 */
export async function calcCost (opts) {
    let { market, outcomeTokenIndex, outcomeTokenCount } = opts
    outcomeTokenCount = new Decimal(outcomeTokenCount.toString())

    let outcomeCount = await getOutcomeCountFromMarket(market, this.gnosis.contracts.Event)
    let netOutcomeTokensSold = await getNetOutcomeTokensSoldFromMarket(market, outcomeCount)
    let b = new Decimal((await market.funding()).toString()).dividedBy(new Decimal(outcomeCount).ln())

    return b.times(
        netOutcomeTokensSold.reduce((acc, numShares, i) =>
            acc.plus(
                new Decimal(numShares.toString())
                .plus(i === outcomeTokenIndex ? outcomeTokenCount : 0)
                .dividedBy(b)
                .exp()),
            new Decimal(0)).ln()
        .minus(netOutcomeTokensSold.reduce((acc, numShares) =>
            acc.plus(
                new Decimal(numShares.toString())
                .dividedBy(b)
                .exp()),
            new Decimal(0)).ln()
        )).ceil()
}

/**
 * Estimates the number of outcome tokens which can be purchased by specified amount of collateral.
 * @param {Contract|string} opts.market - Market to calculate LMSR costs on
 * @param {Number|string|BigNumber} opts.outcomeTokenIndex - The index of the outcome
 * @param {Number|string|BigNumber} opts.outcomeTokenCount - The amount of collateral for buying tokens
 * @returns {BigNumber} The number of outcome tokens that can be bought
 * @alias Gnosis#lmsrMarketMaker.calcOutcomeTokenCount
 */
export async function calcOutcomeTokenCount (opts) {
    // decimal.js making this reaaally messy :/
    let { market, outcomeTokenIndex, cost } = opts
    cost = new Decimal(cost.toString()).minus(0.5)

    let outcomeCount = await getOutcomeCountFromMarket(market, this.gnosis.contracts.Event)
    let netOutcomeTokensSold = await getNetOutcomeTokensSoldFromMarket(market, outcomeCount)
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
            i === outcomeTokenIndex ? acc
            : acc.plus(
                new Decimal(numShares.toString())
                .dividedBy(b)
                .exp()),
            new Decimal(0)))
        .ln()).minus(netOutcomeTokensSold[outcomeTokenIndex]).floor()
}
