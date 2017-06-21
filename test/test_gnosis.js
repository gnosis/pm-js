import assert from 'assert'
import Gnosis from '../src/index'
import { requireEventFromTXResult } from '../src/utils'

describe('Gnosis', function () {
    this.timeout(120000)
    let description = {
        title: 'Will Bitcoin Hardfork before 2018',
        description: 'Hello world',
        resolutionDate: 'tbd'
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
            gnosis = await Gnosis.create()
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
                resolutionDate: 'tbd'
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
            gnosis = await Gnosis.create()
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
            gnosis = await Gnosis.create()
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
                marketContract: gnosis.contracts.StandardMarket
            })
            assert(market)
        })
    })

    describe('#lmsrMarketMaker', () => {
        let gnosis, oracle, event, market, ipfsHash

        before(async () => {
            gnosis = await Gnosis.create()
            ipfsHash = await gnosis.publishEventDescription(description)
            oracle = await gnosis.createCentralizedOracle(ipfsHash)
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
})
