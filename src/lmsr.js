import { Decimal, normalizeWeb3Args } from './utils'

/**
 * Estimates the cost of buying specified number of outcome tokens from LMSR market.
 * @param {(number[]|string[]|BigNumber[])} opts.netOutcomeTokensSold - Amounts of net outcome tokens that have been sold. Negative amount means more have been bought than sold.
 * @param {(number|string|BigNumber)} opts.funding - The amount of funding market has
 * @param {(number|string|BigNumber)} opts.outcomeTokenIndex - The index of the outcome
 * @param {(number|string|BigNumber)} opts.outcomeTokenCount - The number of outcome tokens to buy
 * @returns {Decimal} The cost of the outcome tokens in event collateral tokens
 * @alias Gnosis.calcLMSRCost
 */
export function calcLMSRCost () {
    let [[netOutcomeTokensSold, funding, outcomeTokenIndex, outcomeTokenCount], otherOpts] =
        normalizeWeb3Args(Array.from(arguments), {
            methodName: 'calcLMSRCost',
            functionInputs: [
                { name: 'netOutcomeTokensSold', type: 'int256[]' },
                { name: 'funding', type: 'uint256'},
                { name: 'outcomeTokenIndex', type: 'uint8'},
                { name: 'outcomeTokenCount', type: 'uint256'},
            ]
        })

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
        )).times(1+1e-9).ceil() // TODO: Standardize this 1e-9 and 1e9 in isClose of tests
                                //       This is necessary because of rounding errors due to
                                //       series truncation in solidity implementation.
}

/**
 * Estimates profit from selling specified number of outcome tokens to LMSR market.
 * @param {(number[]|string[]|BigNumber[])} opts.netOutcomeTokensSold - Amounts of net outcome tokens that have been sold by the market already. Negative amount means more have been sold to the market than sold by the market.
 * @param {(number|string|BigNumber)} opts.funding - The amount of funding market has
 * @param {(number|string|BigNumber)} opts.outcomeTokenIndex - The index of the outcome
 * @param {(number|string|BigNumber)} opts.outcomeTokenCount - The number of outcome tokens to sell
 * @returns {Decimal} The profit from selling outcome tokens in event collateral tokens
 * @alias Gnosis.calcLMSRProfit
 */
export function calcLMSRProfit () {
    let [[netOutcomeTokensSold, funding, outcomeTokenIndex, outcomeTokenCount], otherOpts] =
        normalizeWeb3Args(Array.from(arguments), {
            methodName: 'calcLMSRProfit',
            functionInputs: [
                { name: 'netOutcomeTokensSold', type: 'int256[]' },
                { name: 'funding', type: 'uint256'},
                { name: 'outcomeTokenIndex', type: 'uint8'},
                { name: 'outcomeTokenCount', type: 'uint256'},
            ]
        })

    outcomeTokenCount = new Decimal(outcomeTokenCount.toString())
    let b = new Decimal(funding.toString()).dividedBy(new Decimal(netOutcomeTokensSold.length).ln())

    return b.times(
        netOutcomeTokensSold.reduce((acc, numShares) =>
            acc.plus(
                new Decimal(numShares.toString())
                .dividedBy(b)
                .exp()),
            new Decimal(0)).ln()
        .minus(netOutcomeTokensSold.reduce((acc, numShares, i) =>
            acc.plus(
                new Decimal(numShares.toString())
                .minus(i === outcomeTokenIndex ? outcomeTokenCount : 0)
                .dividedBy(b)
                .exp()),
            new Decimal(0)).ln()
        )).dividedBy(1+1e-9).floor() // TODO: Standardize this 1e-9 and 1e9 in isClose of tests
                                     //       This is necessary because of rounding errors due to
                                     //       series truncation in solidity implementation.
}

/**
 * Estimates the number of outcome tokens which can be purchased by specified amount of collateral.
 * @param {(Number[]|string[]|BigNumber[])} opts.netOutcomeTokensSold - Amounts of net outcome tokens that have been sold. Negative amount means more have been bought than sold.
 * @param {(number|string|BigNumber)} opts.funding - The amount of funding market has
 * @param {(number|string|BigNumber)} opts.outcomeTokenIndex - The index of the outcome
 * @param {(number|string|BigNumber)} opts.cost - The amount of collateral for buying tokens
 * @returns {Decimal} The number of outcome tokens that can be bought
 * @alias Gnosis.calcLMSROutcomeTokenCount
 */
export function calcLMSROutcomeTokenCount (opts) {
    // decimal.js making this reaaally messy :/
    let [[netOutcomeTokensSold, funding, outcomeTokenIndex, cost], otherOpts] =
        normalizeWeb3Args(Array.from(arguments), {
            methodName: 'calcLMSROutcomeTokenCount',
            functionInputs: [
                { name: 'netOutcomeTokensSold', type: 'int256[]' },
                { name: 'funding', type: 'uint256'},
                { name: 'outcomeTokenIndex', type: 'uint8'},
                { name: 'cost', type: 'uint256'},
            ]
        })

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

/**
 * Estimates the marginal price of outcome token.
 * @param {(Number[]|string[]|BigNumber[])} opts.netOutcomeTokensSold - Amounts of net outcome tokens that have been sold. Negative amount means more have been bought than sold.
 * @param {(number|string|BigNumber)} opts.funding - The amount of funding market has
 * @param {(number|string|BigNumber)} opts.outcomeTokenIndex - The index of the outcome
 * @returns {Decimal} The marginal price of outcome tokens. Will differ from actual price, which varies with quantity being moved.
 * @alias Gnosis.calcLMSRMarginalPrice
 */
export function calcLMSRMarginalPrice(opts) {
    let [[netOutcomeTokensSold, funding, outcomeTokenIndex], otherOpts] =
        normalizeWeb3Args(Array.from(arguments), {
            methodName: 'calcLMSRMarginalPrice',
            functionInputs: [
                { name: 'netOutcomeTokensSold', type: 'int256[]' },
                { name: 'funding', type: 'uint256'},
                { name: 'outcomeTokenIndex', type: 'uint8'},
            ]
        })

    const b = Decimal(funding.valueOf()).div(Decimal.ln(netOutcomeTokensSold.length))
    const expOffset = Decimal.max(...netOutcomeTokensSold).div(b)

    return Decimal(netOutcomeTokensSold[outcomeTokenIndex].valueOf()).div(b).sub(expOffset).exp().div(
        netOutcomeTokensSold.reduce(
            (acc, tokensSold) => acc.add(Decimal(tokensSold.valueOf()).div(b).sub(expOffset).exp()),
            Decimal(0)
        )
    )
}
