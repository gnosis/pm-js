import assert from 'assert'
import Gnosis from '../src/index'

describe('Gnosis', () => {
    it('exists', () => {
        assert(Gnosis)
    })

    it('initializes with defaults', () => {
        let gnosis = new Gnosis()
        assert(gnosis)
    })

    it('initializes with options', () => {
        let gnosis = new Gnosis({
            ethereum: 'https://mainnnet.infura.io',
            ipfs: '',
            gnosisdb: 'https:/db.gnosis.pm'
        })
        assert(gnosis)
    })

    describe('#oracles', () => {
        let gnosis

        before(() => {
            gnosis = new Gnosis()
        })

        it('creates centralized oracles', () => {
            let oracle = gnosis.createCentralizedOracle()
            assert(oracle)
        })

        it('creates ultimate oracles', () => {
            let cenOracle = gnosis.createCentralizedOracle()
            let ultOracle = gnosis.createUltimateOracle({
                forwardedOracle: cenOracle,
                collateralToken: gnosis.etherToken,
                spreadMultiplier: 1,
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

        before(() => {
            gnosis = new Gnosis()
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

        before(() => {
            gnosis = new Gnosis()
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

        before(() => {
            gnosis = new Gnosis()
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
        before(() => {
            gnosis = new Gnosis()
        })

        it('exists', () => {
            assert(gnosis.db)
        })
    })
})
