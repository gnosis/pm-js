import assert from 'assert'
import _ from 'lodash'
import Gnosis from '../src/index'
import {
    description,
    options,
    assertIsClose,
    requireRejection,
} from './test_utils'

const { requireEventFromTXResult, sendTransactionAndGetResult, Decimal } = Gnosis

const ONE = Math.pow(2, 64)

describe('Gnosis markets', () => {
    let gnosis, oracle, event, ipfsHash

    beforeEach(async () => {
        gnosis = await Gnosis.create(options)
        ipfsHash = await gnosis.publishEventDescription(description)
        oracle = await gnosis.createCentralizedOracle(ipfsHash)
        event = await gnosis.createCategoricalEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: 2
        })
    })

    it('creates markets', async () => {
        let market = await gnosis.createMarket({
            event: event,
            marketMaker: gnosis.lmsrMarketMaker,
            fee: 100,
        })
        assert(market)
    })
})

describe('Gnosis market mechanics', () => {
    let gnosis, oracle, event, ipfsHash, market, netOutcomeTokensSold, funding, feeFactor, participants

    beforeEach(async () => {
        netOutcomeTokensSold = [0, 0]
        feeFactor = 5000 // 0.5%

        gnosis = await Gnosis.create(options)
        participants = gnosis.web3.eth.accounts.slice(0, 4)
        ipfsHash = await gnosis.publishEventDescription(description)
        oracle = await gnosis.createCentralizedOracle(ipfsHash)
        event = await gnosis.createCategoricalEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: netOutcomeTokensSold.length
        })
        market = await gnosis.createMarket({
            event: event,
            marketMaker: gnosis.lmsrMarketMaker,
            fee: feeFactor, // 0%
        })

        funding = 1e18
        requireEventFromTXResult(await gnosis.etherToken.deposit({ value: funding }), 'Deposit')
        requireEventFromTXResult(await gnosis.etherToken.approve(market.address, funding), 'Approval')
        requireEventFromTXResult(await market.fund(funding), 'MarketFunding')
    })

    it('can do buying and selling calculations and transactions', async () => {
        let outcomeTokenIndex = 0
        let outcomeTokenCount = 1e18

        // Buying shares, long version

        let localCalculatedCost = Gnosis.calcLMSRCost({
            netOutcomeTokensSold,
            funding,
            outcomeTokenIndex,
            outcomeTokenCount,
            feeFactor,
        })

        let chainCalculatedCost = await gnosis.lmsrMarketMaker.calcCost(market.address, outcomeTokenIndex, outcomeTokenCount)
        chainCalculatedCost = chainCalculatedCost.add(await market.calcMarketFee(chainCalculatedCost))
        assertIsClose(localCalculatedCost.valueOf(), chainCalculatedCost.valueOf())
        assert(localCalculatedCost.gte(chainCalculatedCost.valueOf()))

        requireEventFromTXResult(await gnosis.etherToken.deposit({ value: localCalculatedCost.valueOf() }), 'Deposit')
        requireEventFromTXResult(await gnosis.etherToken.approve(market.address, localCalculatedCost.valueOf()), 'Approval')
        let purchaseEvent = requireEventFromTXResult(
            await market.buy(outcomeTokenIndex, outcomeTokenCount, localCalculatedCost.valueOf()),
            'OutcomeTokenPurchase'
        )
        let actualCost = purchaseEvent.args.outcomeTokenCost.plus(purchaseEvent.args.marketFees)
        assertIsClose(localCalculatedCost.valueOf(), actualCost.valueOf())
        assert(localCalculatedCost.gte(actualCost.valueOf()))

        // Checking inverse calculation

        let calculatedOutcomeTokenCount = Gnosis.calcLMSROutcomeTokenCount({
            netOutcomeTokensSold,
            funding,
            outcomeTokenIndex,
            cost: localCalculatedCost.valueOf(),
            feeFactor,
        })

        assertIsClose(outcomeTokenCount.valueOf(), calculatedOutcomeTokenCount.valueOf())

        netOutcomeTokensSold[outcomeTokenIndex] += outcomeTokenCount

        // Buying shares, short version

        outcomeTokenCount = 2.5e17

        localCalculatedCost = Gnosis.calcLMSRCost({
            netOutcomeTokensSold,
            funding,
            outcomeTokenIndex,
            outcomeTokenCount,
            feeFactor,
        })

        requireEventFromTXResult(await gnosis.etherToken.deposit({ value: localCalculatedCost.valueOf() }), 'Deposit')
        actualCost = await gnosis.buyOutcomeTokens({
            market, outcomeTokenIndex, outcomeTokenCount
        })

        assertIsClose(localCalculatedCost.valueOf(), actualCost.valueOf())
        assert(localCalculatedCost.gte(actualCost.valueOf()))

        netOutcomeTokensSold[outcomeTokenIndex] += outcomeTokenCount

        // Selling shares, long version

        let numOutcomeTokensToSell = 5e17

        let localCalculatedProfit = Gnosis.calcLMSRProfit({
            netOutcomeTokensSold,
            funding,
            outcomeTokenIndex,
            outcomeTokenCount: numOutcomeTokensToSell,
            feeFactor,
        })

        let chainCalculatedProfit = await gnosis.lmsrMarketMaker.calcProfit(market.address, outcomeTokenIndex, numOutcomeTokensToSell)
        chainCalculatedProfit = chainCalculatedProfit.sub(await market.calcMarketFee(chainCalculatedProfit))
        assertIsClose(localCalculatedProfit.valueOf(), chainCalculatedProfit.valueOf())
        assert(localCalculatedProfit.lte(chainCalculatedProfit.valueOf()))

        let outcomeToken = await gnosis.contracts.ERC20.at(await gnosis.contracts.Event.at(await market.eventContract()).outcomeTokens(outcomeTokenIndex))
        requireEventFromTXResult(await outcomeToken.approve(market.address, numOutcomeTokensToSell), 'Approval')
        let saleEvent = requireEventFromTXResult(
            await market.sell(outcomeTokenIndex, numOutcomeTokensToSell, localCalculatedProfit.valueOf()),
            'OutcomeTokenSale'
        )
        let actualProfit = saleEvent.args.outcomeTokenProfit.minus(saleEvent.args.marketFees)
        assertIsClose(localCalculatedProfit.valueOf(), actualProfit.valueOf())
        assert(localCalculatedProfit.lte(actualProfit.valueOf()))

        netOutcomeTokensSold[outcomeTokenIndex] -= numOutcomeTokensToSell

        // Selling shares, short version

        numOutcomeTokensToSell = 2.5e17

        localCalculatedProfit = Gnosis.calcLMSRProfit({
            netOutcomeTokensSold,
            funding,
            outcomeTokenIndex,
            outcomeTokenCount: numOutcomeTokensToSell,
            feeFactor,
        })

        actualProfit = await gnosis.sellOutcomeTokens({
            market, outcomeTokenIndex,
            outcomeTokenCount: numOutcomeTokensToSell,
        })
        assertIsClose(localCalculatedProfit.valueOf(), actualProfit.valueOf())
        assert(localCalculatedProfit.lte(actualProfit.valueOf()))

        netOutcomeTokensSold[outcomeTokenIndex] -= numOutcomeTokensToSell

        // Setting the outcome and redeeming winnings

        await gnosis.resolveEvent({
            event,
            outcome: outcomeTokenIndex,
        })

        let balanceBefore = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)

        let winnings = await sendTransactionAndGetResult({
            callerContract: event,
            methodName: 'redeemWinnings',
            methodArgs: [],
            eventName: 'WinningsRedemption',
            eventArgName: 'winnings',
        })

        let balanceAfter = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)

        assert.equal(winnings.valueOf(), netOutcomeTokensSold[outcomeTokenIndex])
        assert.equal(balanceAfter.sub(balanceBefore).valueOf(), winnings.valueOf())
    })

    it('lmsr functions return objects with integer string representations', async () => {
        let localCalculatedCost = Gnosis.calcLMSRCost({
            netOutcomeTokensSold: [0, 1.2e25],
            funding: 1e27,
            outcomeTokenIndex: 0,
            outcomeTokenCount: 1e25,
            feeFactor: 500,
        })
        assert(/^-?(0x[\da-f]+|\d+)$/i.test(localCalculatedCost))
    })

    it('can override cost and minProfit for buying and selling', async () => {
        let outcomeTokenIndex = 0
        let outcomeTokenCount = 1e18

        let localCalculatedCost = Gnosis.calcLMSRCost({
            netOutcomeTokensSold,
            funding,
            outcomeTokenIndex,
            outcomeTokenCount,
            feeFactor,
        })

        requireEventFromTXResult(await gnosis.etherToken.deposit({ value: localCalculatedCost.valueOf() }), 'Deposit')
        await requireRejection(gnosis.buyOutcomeTokens({
            market, outcomeTokenIndex, outcomeTokenCount, cost: localCalculatedCost.div(10).valueOf()
        }))

        let localCalculatedProfit = Gnosis.calcLMSRProfit({
            netOutcomeTokensSold,
            funding,
            outcomeTokenIndex,
            outcomeTokenCount,
            feeFactor,
        })

        await requireRejection(gnosis.sellOutcomeTokens({
            market, outcomeTokenIndex, outcomeTokenCount, minProfit: localCalculatedProfit.mul(10).valueOf()
        }))
    })

    it('can do buying and selling with custom approve amounts', async () => {
        const approvalAmount = 2e18
        const outcomeTokenIndex = 0
        const outcomeTokenCount = 1e18

        const outcomeToken = await gnosis.contracts.ERC20.at(
            await gnosis.contracts.Event.at(
                await market.eventContract()
            ).outcomeTokens(outcomeTokenIndex)
        )

        requireEventFromTXResult(await gnosis.etherToken.deposit({ value: approvalAmount }), 'Deposit')

        const balanceBefore = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
        const allowanceBefore = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

        const actualCost = await gnosis.buyOutcomeTokens({
            market, outcomeTokenIndex, outcomeTokenCount, approvalAmount
        })

        const balanceAfter = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
        const allowanceAfter = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

        assert.equal(balanceBefore.sub(balanceAfter).valueOf(), actualCost.valueOf())
        assert.equal(allowanceAfter.sub(allowanceBefore).valueOf(), actualCost.sub(approvalAmount).neg().valueOf())

        const actualCost2 = await gnosis.buyOutcomeTokens({
            market, outcomeTokenIndex, outcomeTokenCount
        })

        const balanceAfter2 = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
        const allowanceAfter2 = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

        assert.equal(balanceAfter.sub(balanceAfter2).valueOf(), actualCost2.valueOf())
        assert.equal(allowanceAfter.sub(allowanceAfter2).valueOf(), actualCost2.valueOf())

        const amountToSell = 3e17

        const outcomeBalanceBefore = await outcomeToken.balanceOf(gnosis.defaultAccount)

        await gnosis.sellOutcomeTokens({
            market, outcomeTokenIndex, outcomeTokenCount: amountToSell, approvalAmount: outcomeTokenCount
        })

        const outcomeBalanceAfter = await outcomeToken.balanceOf(gnosis.defaultAccount)
        const outcomeAllowanceAfter = await outcomeToken.allowance(gnosis.defaultAccount, market.address)

        assert.equal(outcomeBalanceBefore.sub(outcomeBalanceAfter).valueOf(), amountToSell)
        assert.equal(outcomeAllowanceAfter.valueOf(), outcomeTokenCount - amountToSell)

        await gnosis.sellOutcomeTokens({
            market, outcomeTokenIndex, outcomeTokenCount: amountToSell
        })

        const outcomeBalanceAfter2 = await outcomeToken.balanceOf(gnosis.defaultAccount)
        const outcomeAllowanceAfter2 = await outcomeToken.allowance(gnosis.defaultAccount, market.address)

        assert.equal(outcomeBalanceAfter.sub(outcomeBalanceAfter2).valueOf(), amountToSell)
        assert.equal(outcomeAllowanceAfter2.valueOf(), outcomeTokenCount - 2 * amountToSell)
    })

    it('can do buying and selling while resetting to a custom amount', async () => {
        const approvalResetAmount = 2e18
        const outcomeTokenIndex = 0
        const outcomeTokenCount = 1e17

        const outcomeToken = await gnosis.contracts.ERC20.at(
            await gnosis.contracts.Event.at(
                await market.eventContract()
            ).outcomeTokens(outcomeTokenIndex)
        )

        requireEventFromTXResult(await gnosis.etherToken.deposit({ value: approvalResetAmount }), 'Deposit')

        const balanceBefore = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
        const allowanceBefore = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

        const actualCost = await gnosis.buyOutcomeTokens({
            market, outcomeTokenIndex, outcomeTokenCount, approvalResetAmount
        })

        let balanceAfter = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
        let allowanceAfter = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

        assert.equal(balanceBefore.sub(balanceAfter).valueOf(), actualCost.valueOf())
        assert.equal(allowanceAfter.sub(allowanceBefore).valueOf(), actualCost.sub(approvalResetAmount).neg().valueOf())

        let actualCost2 = await gnosis.buyOutcomeTokens({
            market, outcomeTokenIndex, outcomeTokenCount, approvalResetAmount
        })

        let balanceAfter2, allowanceAfter2
        while(allowanceAfter.gte(actualCost2)) {
            balanceAfter2 = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
            allowanceAfter2 = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

            assert.equal(balanceAfter.sub(balanceAfter2).valueOf(), actualCost2.valueOf())
            assert.equal(allowanceAfter.sub(allowanceAfter2).valueOf(), actualCost2.valueOf())

            balanceAfter = balanceAfter2
            allowanceAfter = allowanceAfter2
            actualCost2 = await gnosis.buyOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount, approvalResetAmount
            })
        }

        balanceAfter2 = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
        allowanceAfter2 = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

        assert.equal(balanceAfter.sub(balanceAfter2).valueOf(), actualCost2.valueOf())
        assert.equal(allowanceAfter2.sub(approvalResetAmount).neg().valueOf(), actualCost2.valueOf())

        const amountToSell = 3e17

        const outcomeBalanceBefore = await outcomeToken.balanceOf(gnosis.defaultAccount)
        const outcomeAllowanceBefore = await outcomeToken.allowance(gnosis.defaultAccount, market.address)

        const profit = await gnosis.sellOutcomeTokens({
            market, outcomeTokenIndex, outcomeTokenCount: amountToSell, approvalResetAmount
        })

        const outcomeBalanceAfter = await outcomeToken.balanceOf(gnosis.defaultAccount)
        const outcomeAllowanceAfter = await outcomeToken.allowance(gnosis.defaultAccount, market.address)

        assert.equal(outcomeBalanceBefore.sub(outcomeBalanceAfter).valueOf(), amountToSell)
        assert.equal(outcomeAllowanceAfter.valueOf(), approvalResetAmount - amountToSell)

        const profit2 = await gnosis.sellOutcomeTokens({
            market, outcomeTokenIndex, outcomeTokenCount: amountToSell, approvalResetAmount
        })

        const outcomeBalanceAfter2 = await outcomeToken.balanceOf(gnosis.defaultAccount)
        const outcomeAllowanceAfter2 = await outcomeToken.allowance(gnosis.defaultAccount, market.address)

        assert.equal(outcomeBalanceAfter.sub(outcomeBalanceAfter2).valueOf(), amountToSell)
        assert.equal(outcomeAllowanceAfter2.valueOf(), approvalResetAmount - 2 * amountToSell)
    })

    it('can buy and sell with a limit margin', async () => {
        const outcomeTokenIndex = 0
        const outcomeTokenCount = 4e16
        const amountToStart = 1e18
        const limitMargin = 0.05;

        (await Promise.all(participants.map(
            (p) => gnosis.etherToken.deposit({ value: amountToStart, from: p })
        ))).forEach((res) => requireEventFromTXResult(res, 'Deposit'));

        (await Promise.all(participants.map(
            (p) => gnosis.etherToken.balanceOf(p)
        ))).forEach((b) => assert(b.gte(amountToStart)));

        (await Promise.all(participants.map(
            (p) => gnosis.buyOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount,
                limitMargin,
                from: p,
            })
        )));

        (await Promise.all(participants.map(
            (p) => gnosis.sellOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount,
                limitMargin,
                from: p,
            })
        )))
    })

    it('accepts strings for outcome token index', async () => {
        let outcomeTokenIndex = 0
        let outcomeTokenCount = 1000000000

        let calculatedCost1 = Gnosis.calcLMSRCost({
            netOutcomeTokensSold,
            funding,
            outcomeTokenIndex,
            outcomeTokenCount,
        })

        let calculatedCost2 = Gnosis.calcLMSRCost({
            netOutcomeTokensSold,
            funding,
            outcomeTokenIndex: outcomeTokenIndex.toString(),
            outcomeTokenCount,
        })

        assert.equal(calculatedCost1.valueOf(), calculatedCost2.valueOf())
    })

    it('calculates marginal price function', async () => {
        let outcomeTokenIndex = 0
        let outcomeTokenCount = 1e18

        let chainCalculatedCost = await gnosis.lmsrMarketMaker.calcCost(market.address, outcomeTokenIndex, outcomeTokenCount)
        chainCalculatedCost = chainCalculatedCost.add(await market.calcMarketFee(chainCalculatedCost))
        requireEventFromTXResult(await gnosis.etherToken.deposit({ value: chainCalculatedCost }), 'Deposit')
        requireEventFromTXResult(await gnosis.etherToken.approve(market.address, chainCalculatedCost), 'Approval')
        requireEventFromTXResult(await market.buy(outcomeTokenIndex, outcomeTokenCount, chainCalculatedCost), 'OutcomeTokenPurchase')

        let newNetOutcomeTokensSold = netOutcomeTokensSold.slice()
        newNetOutcomeTokensSold[outcomeTokenIndex] = outcomeTokenCount

        let localCalculatedMarginalPrice = Gnosis.calcLMSRMarginalPrice({
            netOutcomeTokensSold: newNetOutcomeTokensSold,
            funding,
            outcomeTokenIndex
        })
        let chainCalculatedMarginalPrice = await gnosis.lmsrMarketMaker.calcMarginalPrice(market.address, outcomeTokenIndex)
        chainCalculatedMarginalPrice = Decimal(chainCalculatedMarginalPrice.valueOf())

        assertIsClose(localCalculatedMarginalPrice.valueOf(), chainCalculatedMarginalPrice.div(ONE).valueOf())
    })

    it('can do calculations when market is unfunded', async () => {
        const outcomeTokenIndex = 0
        const outcomeTokenCount = 1e18
        const localCalculatedCost = Gnosis.calcLMSRCost({
            netOutcomeTokensSold: [0, 0, 0],
            funding: 0,
            outcomeTokenIndex,
            outcomeTokenCount,
            feeFactor,
        })
        assertIsClose(
            localCalculatedCost.valueOf(),
            Decimal(outcomeTokenCount).mul(1e6 + feeFactor).div(1e6).valueOf()
        )

        const localCalculatedProfit = Gnosis.calcLMSRProfit({
            netOutcomeTokensSold: [0, 0, 0],
            funding: 0,
            outcomeTokenIndex,
            outcomeTokenCount,
            feeFactor,
        })
        assert.equal(localCalculatedProfit.valueOf(), 0)

        const localCalculatedMarginalPrice = Gnosis.calcLMSRMarginalPrice({
            netOutcomeTokensSold: [0, 0, 0],
            funding: 0,
            outcomeTokenIndex
        })
        assertIsClose(localCalculatedMarginalPrice.valueOf(), 1/3)
    })

    it('does not mutate arguments when performing calculations', () => {
        let netOutcomeTokensSoldCopy = _.clone(netOutcomeTokensSold)
        let outcomeTokenIndex = 0
        let cost = 1e18

        let lmsrOptions = { netOutcomeTokensSold, outcomeTokenIndex, cost, funding }
        let lmsrOptionsCopy = _.clone(lmsrOptions)

        assert.deepStrictEqual(netOutcomeTokensSoldCopy, netOutcomeTokensSold)
        assert.deepStrictEqual(lmsrOptionsCopy, lmsrOptions)

        const probability = Gnosis.calcLMSRMarginalPrice(lmsrOptions)

        assert.deepStrictEqual(netOutcomeTokensSoldCopy, netOutcomeTokensSold)
        assert.deepStrictEqual(lmsrOptionsCopy, lmsrOptions)
        assert(probability)

        const maximumWin = Gnosis.calcLMSROutcomeTokenCount(lmsrOptions)

        assert.deepStrictEqual(netOutcomeTokensSoldCopy, netOutcomeTokensSold)
        assert.deepStrictEqual(lmsrOptionsCopy, lmsrOptions)
        assert(maximumWin)
    })

    it('estimates buying and selling gas costs', async () => {
        let outcomeTokenIndex = 0
        let outcomeTokenCount = 1e18

        assert(await gnosis.buyOutcomeTokens.estimateGas({
            market, outcomeTokenIndex, outcomeTokenCount,
            using: 'stats'
        }) > 0)

        assert(await gnosis.sellOutcomeTokens.estimateGas({
            market, outcomeTokenIndex, outcomeTokenCount,
            using: 'stats'
        }) > 0)
    })
})
