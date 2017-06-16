import _ from 'lodash'
import { getTruffleArgsFromOptions, Decimal } from './utils'

export async function calcCost(opts) {
    let args = getTruffleArgsFromOptions([
        'market',
        'outcomeTokenIndex',
        'outcomeTokenCount'
    ], opts)
    return await this._calcCost.call(...args)
}

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
