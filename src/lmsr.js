import _ from 'lodash'
import { getTruffleArgsFromOptions, Decimal } from './utils'

/**
 * Estimates the cost of buying specified number of outcome tokens from LMSR market.
 * @param {(number[]|string[]|BigNumber[])} netOutcomeTokensSold - Amounts of net outcome tokens that have been sold. Negative amount means more have been bought than sold.
 * @param {(number|string|BigNumber)} funding - The amount of funding market has
 * @param {(number|string|BigNumber)} opts.outcomeTokenIndex - The index of the outcome
 * @param {(number|string|BigNumber)} opts.outcomeTokenCount - The number of outcome tokens to buy
 * @returns {Decimal} The cost of the outcome tokens in event collateral tokens
 * @alias Gnosis.calcLMSRCost
 */
export function calcLMSRCost (opts) {
    let { netOutcomeTokensSold, funding, outcomeTokenIndex, outcomeTokenCount } = opts

    outcomeTokenCount = new Decimal(outcomeTokenCount.toString())
    let b = new Decimal(funding.toString()).dividedBy(new Decimal(netOutcomeTokensSold.length).ln())

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
 * @param {Number[]|string[]|BigNumber[]} netOutcomeTokensSold - Amounts of net outcome tokens that have been sold. Negative amount means more have been bought than sold.
 * @param {(number|string|BigNumber)} funding - The amount of funding market has
 * @param {(number|string|BigNumber)} opts.outcomeTokenIndex - The index of the outcome
 * @param {(number|string|BigNumber)} opts.outcomeTokenCount - The amount of collateral for buying tokens
 * @returns {Decimal} The number of outcome tokens that can be bought
 * @alias Gnosis.calcLMSROutcomeTokenCount
 */
export function calcLMSROutcomeTokenCount (opts) {
    // decimal.js making this reaaally messy :/
    let { netOutcomeTokensSold, funding, outcomeTokenIndex, cost } = opts

    cost = new Decimal(cost.toString())
    let b = new Decimal(funding.toString()).dividedBy(new Decimal(netOutcomeTokensSold.length).ln())

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
