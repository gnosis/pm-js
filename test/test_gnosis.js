import assert from 'assert'
import Gnosis from '../src/index'

describe('Gnosis', () => {
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

        it('publishes event descriptions and loads them', () => {
            let description = {}
            let _SOMETHING_ = gnosis.publishEventDescription(description)
            assert(_SOMETHING_)
            let loadedDescription = gnosis.loadEventDescription(_SOMETHING_)
            assert.equal(loadedDescription, description)
        })
    })

    describe('#events', () => {
        let gnosis, oracle

        before(async () => {
            gnosis = await Gnosis.create()
            oracle = gnosis.createCentralizedOracle()
        })

        it('creates categorical events', () => {
            let event = gnosis.createCategoricalEvent({
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                outcomeCount: 2
            })
            assert(event)
        })

        it('creates scalar events', () => {
            let event = gnosis.createScalarEvent({
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
            oracle = gnosis.createCentralizedOracle()
            event = createCategoricalEvent({
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                outcomeCount: 2
            })
        })

        it('creates markets', () => {
            let market = gnosis.createMarket({
                marketFactory: gnosis.standardMarketFactory,
                event: event,
                marketMaker: gnosis.lmsrMarketMaker,
                fee: 100
            })
        })
    })

    describe('#lmsrMarketMaker', () => {
        let gnosis, oracle, event, market

        before(async () => {
            gnosis = await Gnosis.create()
            oracle = gnosis.createCentralizedOracle()
            event = createCategoricalEvent({
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                outcomeCount: 2
            })
            market = gnosis.createMarket({
                marketFactory: gnosis.standardMarketFactory,
                event: event,
                marketMaker: gnosis.lmsrMarketMaker,
                fee: 100
            })
        })

        it('calculates outcome token count from cost', () => {
            let outcomeTokenCount = 10000
            let cost = gnosis.lmsrMarketMaker.calcCost({
                market: market,
                outcomeTokenIndex: 0,
                outcomeTokenCount: outcomeTokenCount
            })

            let calculatedOutcomeTokenCount = gnosis.lmsrMarketMaker.calcOutcomeTokenCount({
                market: market,
                outcomeTokenIndex: 0,
                cost: cost
            })

            assert.equal(outcomeTokenCount, calculatedOutcomeTokenCount)
        })
    })

    describe('#db', () => {
        before(async () => {
            gnosis = await Gnosis.create()
        })

        it('exists', () => {
            assert(gnosis.db)
        })
    })
})
