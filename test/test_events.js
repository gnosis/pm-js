import assert from 'assert'
import Gnosis from '../src/index'
import {
    description,
    options,
    multiWeb3GnosisDescribe,
} from './test_utils'

const { requireEventFromTXResult } = Gnosis

multiWeb3GnosisDescribe('Gnosis events', ({ gnosisQ }) => {
    let gnosis, ipfsHash, oracle

    beforeEach(async () => {
        gnosis = await gnosisQ
        ipfsHash = await gnosis.publishEventDescription(description)
        oracle = await gnosis.createCentralizedOracle(ipfsHash)
    })

    it('creates and resolves categorical events', async () => {
        let event = await gnosis.createCategoricalEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: 2
        })
        assert(event)
        assert(!await oracle.isOutcomeSet())
        assert(!await event.isOutcomeSet())

        await gnosis.resolveEvent({
            event,
            outcome: 1,
        })

        assert(await oracle.isOutcomeSet())
        assert(await event.isOutcomeSet())
    })

    it('creates and resolves scalar events', async () => {
        let event = await gnosis.createScalarEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            lowerBound: -1000,
            upperBound: 1000
        })
        assert(event)
        assert(!await oracle.isOutcomeSet())
        assert(!await event.isOutcomeSet())

        await gnosis.resolveEvent({
            event,
            outcome: -55,
        })

        assert(await oracle.isOutcomeSet())
        assert(await event.isOutcomeSet())
    })

    it('estimates gas usage for categorical event creation', async () => {
        let eventFactory = await gnosis.contracts.EventFactory.deployed()
        let eventArgs = {
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: 2
        }

        let actualUsingRPC = await eventFactory.createCategoricalEvent.estimateGas(
            eventArgs.collateralToken.address,
            eventArgs.oracle.address,
            eventArgs.outcomeCount
        )
        let actualUsingStats = eventFactory.gasStats.createCategoricalEvent.averageGasUsed

        assert.equal(actualUsingRPC, await gnosis.createCategoricalEvent.estimateGas(Object.assign({ using: 'rpc' }, eventArgs)))
        assert.equal(actualUsingStats, await gnosis.createCategoricalEvent.estimateGas({ using: 'stats' }))
    })

    it('estimates gas usage for event resolution', async () => {
        let event = await gnosis.createCategoricalEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: 2
        })
        assert(await gnosis.resolveEvent.estimateGas({ event, using: 'stats' }) > 0)
    })

    it('by default supplies a gas limit suitable for buyAllOutcomes', async () => {
        let event = await gnosis.createCategoricalEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: 2
        })

        const funding = 1e18
        requireEventFromTXResult(await gnosis.etherToken.deposit({ value: funding }), 'Deposit')
        requireEventFromTXResult(await gnosis.etherToken.approve(event.address, funding), 'Approval')
        requireEventFromTXResult(await event.buyAllOutcomes(funding), 'OutcomeTokenSetIssuance')
    })
})
