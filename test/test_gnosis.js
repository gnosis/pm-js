import assert from 'assert'
import Gnosis from '../src/index'
import { requireEventFromTXResult } from '../src/utils'
/**
  * Testing Testing
  * 123
  **/

describe('Gnosis', function() {
    this.timeout(120000)

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
        let gnosis

        before(async () => {
            gnosis = await Gnosis.create()
        })

        it('creates centralized oracles', async () => {
            let oracle = await gnosis.createCentralizedOracle()
            assert(oracle)
        })

        it('creates ultimate oracles', async () => {
            let cenOracle = await gnosis.createCentralizedOracle()
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
            let description = {
              title: "Will Bitcoin Hardfork before 2018",
              description: "Hello world",
              resolutionDate: "tbd"
            }
            let ipfsHash = await gnosis.publishEventDescription(description)
            assert(ipfsHash)
            let loadedDescription = await gnosis.loadEventDescription(ipfsHash)
            assert.deepEqual(loadedDescription, description)
        })
    })

    describe('#events', () => {
        let gnosis, oracle

        before(async () => {
            gnosis = await Gnosis.create()
            oracle = await gnosis.createCentralizedOracle()
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
        let gnosis, oracle, event

        before(async () => {
            gnosis = await Gnosis.create()
            oracle = await gnosis.createCentralizedOracle()
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
                marketContract: gnosis.contracts.StandardMarket
            })
        })
    })

    describe('#lmsrMarketMaker', () => {
        let gnosis, oracle, event, market

        before(async () => {
            gnosis = await Gnosis.create()
            oracle = await gnosis.createCentralizedOracle()
            event = await gnosis.createCategoricalEvent({
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                outcomeCount: 2
            })
            market = await gnosis.createMarket({
                marketFactory: gnosis.standardMarketFactory,
                event: event,
                marketMaker: gnosis.lmsrMarketMaker,
                fee: 100,
                marketContract: gnosis.contracts.StandardMarket
            })

            requireEventFromTXResult(await gnosis.etherToken.deposit({ value: '100000000' }), 'Deposit')
            requireEventFromTXResult(await gnosis.etherToken.approve(market.address, '100000000'), 'Approval')
            requireEventFromTXResult(await market.fund('100000000'), 'MarketFunding')
        })

        it('calculates outcome token count from cost', async () => {
            let outcomeTokenCount = 1000000000

            let cost = await gnosis.lmsrMarketMaker.calcCost({
                market: market,
                outcomeTokenIndex: 0,
                outcomeTokenCount: outcomeTokenCount
            })

            let calculatedOutcomeTokenCount = await gnosis.lmsrMarketMaker.calcOutcomeTokenCount({
                market: market,
                outcomeTokenIndex: 0,
                cost: cost
            })

            assert.equal(outcomeTokenCount.toString(), calculatedOutcomeTokenCount.toString())
        })
    })

    describe('#db', () => {
        let gnosis
        before(async () => {
            gnosis = await Gnosis.create()
        })

        it('exists', () => {
            assert(gnosis.db)
        })
    })
})
