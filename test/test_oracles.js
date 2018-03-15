import assert from 'assert'
import Gnosis from '../src/index'
import {
    description,
    options,
    requireRejection,
} from './test_utils'

const { requireEventFromTXResult } = Gnosis

describe('Gnosis oracles', () => {
    let gnosis, ipfsHash

    beforeEach(async () => {
        gnosis = await Gnosis.create(options)
        ipfsHash = await gnosis.publishEventDescription(description)
    })

    it('creates centralized oracles', async () => {
        let oracle = await gnosis.createCentralizedOracle(ipfsHash)
        assert(oracle)
    })

    it('estimates gas usage for centralized oracle creation', async () => {
        let centralizedOracleFactory = await gnosis.contracts.CentralizedOracleFactory.deployed()
        let actualUsingRPC = await centralizedOracleFactory.createCentralizedOracle.estimateGas(ipfsHash)
        let actualUsingStats = centralizedOracleFactory.gasStats.createCentralizedOracle.averageGasUsed

        assert.equal(actualUsingRPC, await gnosis.createCentralizedOracle.estimateGas(ipfsHash, { using: 'rpc' }))
        assert.equal(actualUsingStats, await gnosis.createCentralizedOracle.estimateGas({ using: 'stats' }))
    })

    it('errors with sensible message when creating centralized oracle incorrectly', async () => {
        let error = await requireRejection(gnosis.createCentralizedOracle('???'))
        assert.equal(error.toString(), 'Error: expected ipfsHash ??? to have length 46')
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

    it('estimates gas usage for ultimate oracle creation', async () => {
        let cenOracle = await gnosis.createCentralizedOracle(ipfsHash)

        let ultimateOracleFactory = await gnosis.contracts.UltimateOracleFactory.deployed()
        let ultOracleArgs = {
            forwardedOracle: cenOracle,
            collateralToken: gnosis.etherToken,
            spreadMultiplier: 2,
            challengePeriod: 3600,
            challengeAmount: 1000,
            frontRunnerPeriod: 60
        }

        let actualUsingRPC = await ultimateOracleFactory.createUltimateOracle.estimateGas(
            ultOracleArgs.forwardedOracle.address,
            ultOracleArgs.collateralToken.address,
            ultOracleArgs.spreadMultiplier,
            ultOracleArgs.challengePeriod,
            ultOracleArgs.challengeAmount,
            ultOracleArgs.frontRunnerPeriod
        )
        let actualUsingStats = ultimateOracleFactory.gasStats.createUltimateOracle.averageGasUsed

        assert.equal(actualUsingRPC, await gnosis.createUltimateOracle.estimateGas(Object.assign({ using: 'rpc' }, ultOracleArgs)))
        assert.equal(actualUsingStats, await gnosis.createUltimateOracle.estimateGas({ using: 'stats' }))
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
