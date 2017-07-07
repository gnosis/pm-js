import assert from 'assert'
import Gnosis from '../src/index'
import { requireEventFromTXResult, sendTransactionAndGetResult, Decimal } from '../src/utils'

const options = process.env.GNOSIS_OPTIONS ? JSON.parse(process.env.GNOSIS_OPTIONS) : null

const ONE = Math.pow(2, 64)

function isClose(a, b, relTol=1e9, absTol=1e18) {
    return Decimal(a.valueOf()).sub(b).abs().lte(
        Decimal.max(
            Decimal.max(
                Decimal.abs(a.valueOf()),
                Decimal.abs(b.valueOf())
            ).mul(relTol),
            absTol))
}

describe('Gnosis', function () {
    this.timeout(120000)
    let description = {
        title: 'Will Bitcoin Hardfork before 2018',
        description: 'Hello world',
        resolutionDate: new Date().toISOString(),
        outcomes: ['Yes', 'No']
    }

    it('exists', () => {
        assert(Gnosis)
    })

    it('initializes with defaults', async () => {
        let gnosis = await Gnosis.create()
        assert(gnosis)
    })

    it('initializes with options', async () => {
        let gnosis = await Gnosis.create({
            ethereum: 'http://localhost:8545',
            ipfs: '',
            gnosisdb: 'https:/db.gnosis.pm'
        })
        assert(gnosis)
    })

    describe('#oracles', () => {
        let gnosis, ipfsHash

        before(async () => {
            gnosis = await Gnosis.create(options)
            ipfsHash = await gnosis.publishEventDescription(description)
        })

        it('creates centralized oracles', async () => {
            let oracle = await gnosis.createCentralizedOracle(ipfsHash)
            assert(oracle)
        })

        it('creates ultimate oracles', async () => {
            let cenOracle = await gnosis.createCentralizedOracle(ipfsHash)
            let ultOracle = await gnosis.createUltimateOracle({
                forwardedOracle: cenOracle,
                collateralToken: gnosis.etherToken,
                spreadMultiplier: 2,
                challengePeriod: 3600,
                challengeAmount: 1000,
                frontRunnerPeriod: 60
            })
            assert(ultOracle)
        })

        it('publishes event descriptions and loads them', async () => {
            let newDescription = {
                title: 'Will Bitcoin Hardfork before 2018',
                description: 'Hello world',
                resolutionDate: description.resolutionDate,
                outcomes: [
                  'Yes',
                  'No'
                ]
            }
            let newIpfsHash = await gnosis.publishEventDescription(newDescription)
            assert(newIpfsHash)
            let loadedDescription = await gnosis.loadEventDescription(newIpfsHash)
            assert.deepEqual(loadedDescription, description)
        })
    })

    describe('#events', () => {
        let gnosis, oracle, ipfsHash

        before(async () => {
            gnosis = await Gnosis.create(options)
            ipfsHash = await gnosis.publishEventDescription(description)
            oracle = await gnosis.createCentralizedOracle(ipfsHash)
        })

        it('creates categorical events', async () => {
            let event = await gnosis.createCategoricalEvent({
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                outcomeCount: 2
            })
            assert(event)
        })

        it('creates scalar events', async () => {
            let event = await gnosis.createScalarEvent({
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                lowerBound: -1000,
                upperBound: 1000
            })
            assert(event)
        })
    })

    describe('#markets', () => {
        let gnosis, oracle, event, ipfsHash

        before(async () => {
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
                marketFactory: gnosis.standardMarketFactory,
                event: event,
                marketMaker: gnosis.lmsrMarketMaker,
                fee: 100,
            })
            assert(market)
        })
    })

    describe('.lmsr', () => {
        let gnosis, oracle, event, ipfsHash, market, netOutcomeTokensSold, funding

        beforeEach(async () => {
            netOutcomeTokensSold = [0, 0]

            gnosis = await Gnosis.create(options)
            ipfsHash = await gnosis.publishEventDescription(description)
            oracle = await gnosis.createCentralizedOracle(ipfsHash)
            event = await gnosis.createCategoricalEvent({
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                outcomeCount: netOutcomeTokensSold.length
            })
            market = await gnosis.createMarket({
                marketFactory: gnosis.standardMarketFactory,
                event: event,
                marketMaker: gnosis.lmsrMarketMaker,
                fee: 0, // 0%
            })

            funding = 1000000000
            requireEventFromTXResult(await gnosis.etherToken.deposit({ value: funding }), 'Deposit')
            requireEventFromTXResult(await gnosis.etherToken.approve(market.address, funding), 'Approval')
            requireEventFromTXResult(await market.fund(funding), 'MarketFunding')
        })

        it('calculates outcome token count from cost', async () => {
            let outcomeTokenIndex = 0
            let outcomeTokenCount = 1000000000

            let localCalculatedCost = Gnosis.calcLMSRCost({
                netOutcomeTokensSold,
                funding,
                outcomeTokenIndex,
                outcomeTokenCount,
            })

            let chainCalculatedCost = await gnosis.lmsrMarketMaker.calcCost(market.address, outcomeTokenIndex, outcomeTokenCount)
            assert.equal(localCalculatedCost.valueOf(), chainCalculatedCost.valueOf())

            requireEventFromTXResult(await gnosis.etherToken.deposit({ value: localCalculatedCost }), 'Deposit')
            requireEventFromTXResult(await gnosis.etherToken.approve(market.address, localCalculatedCost), 'Approval')
            let actualCost = await sendTransactionAndGetResult({
                factoryContract: market,
                methodName: 'buy',
                methodArgs: [outcomeTokenIndex, outcomeTokenCount, localCalculatedCost],
                eventName: 'OutcomeTokenPurchase',
                eventArgName: 'cost',
            })
            assert.equal(localCalculatedCost.valueOf(), actualCost.valueOf())

            let calculatedOutcomeTokenCount = Gnosis.calcLMSROutcomeTokenCount({
                netOutcomeTokensSold,
                funding,
                outcomeTokenIndex: 0,
                cost: localCalculatedCost
            })

            assert.equal(outcomeTokenCount.valueOf(), calculatedOutcomeTokenCount.valueOf())
        })

        it('calculates marginal price function', async () => {
            let outcomeTokenIndex = 0
            let localCalculatedMarginalPrice = Gnosis.calcLMSRMarginalPrice({
                netOutcomeTokensSold,
                funding,
                outcomeTokenIndex
            })
            let chainCalculatedMarginalPrice = await gnosis.lmsrMarketMaker.calcMarginalPrice(market.address, outcomeTokenIndex)
            chainCalculatedMarginalPrice = Decimal(chainCalculatedMarginalPrice.valueOf())

            assert(isClose(localCalculatedMarginalPrice.valueOf(), chainCalculatedMarginalPrice.div(ONE).valueOf()))
        })
    })
})
