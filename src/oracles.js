import _ from 'lodash'
import { getTruffleArgsFromOptions, sendTransactionAndGetResult } from './utils'

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
