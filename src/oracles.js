import _ from 'lodash'
import { getTruffleArgsFromOptions, sendTransactionAndGetResult } from './utils'

/**
 * Creates a centralized oracle linked to a published event.
 * @param {string} ipfsHash - The published event's IPFS hash
 * @returns {Contract} The created centralized oracle contract instance
 * @alias Gnosis.createCentralizedOracle
 */
export async function createCentralizedOracle(ipfsHash) {
    return await sendTransactionAndGetResult({
        factoryContract: this.contracts.CentralizedOracleFactory,
        methodName: 'createCentralizedOracle',
        methodArgs: [ipfsHash],
        eventName: 'CentralizedOracleCreation',
        eventArgName: 'centralizedOracle',
        resultContract: this.contracts.CentralizedOracle
    })
}

/**
 * Creates an ultimate oracle.
 * @param {Contract|string} opts.forwardedOracle - The forwarded oracle contract or its address
 * @param {Contract|string} opts.collateralToken - The collateral token contract or its address
 * @param {Number|string|BigNumber} opts.spreadMultiplier - The spread multiplier
 * @param {Number|string|BigNumber} opts.challengePeriod - The challenge period in seconds
 * @param {Number|string|BigNumber} opts.challengeAmount - The amount of collateral tokens put at stake in the challenge
 * @param {Number|string|BigNumber} opts.frontRunnerPeriod - The front runner period in seconds
 * @returns {Contract} The created ultimate oracle contract instance
 * @alias Gnosis.createUltimateOracle
 */
export async function createUltimateOracle(opts) {
    let args = getTruffleArgsFromOptions([
        'forwardedOracle',
        'collateralToken',
        'spreadMultiplier',
        'challengePeriod',
        'challengeAmount',
        'frontRunnerPeriod'
    ], opts)

    return await sendTransactionAndGetResult({
        factoryContract: this.contracts.UltimateOracleFactory,
        methodName: 'createUltimateOracle',
        methodArgs: args,
        eventName: 'UltimateOracleCreation',
        eventArgName: 'ultimateOracle',
        resultContract: this.contracts.UltimateOracle
    })
}
