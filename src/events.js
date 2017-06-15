import _ from 'lodash'
import { getTruffleArgsFromOptions, sendTransactionAndGetResult } from './utils'

export async function createCategoricalEvent(opts) {
    let args = getTruffleArgsFromOptions([
        'collateralToken',
        'oracle',
        'outcomeCount'
    ], opts)

    return await sendTransactionAndGetResult({
        factoryContract: this.contracts.EventFactory,
        methodName: 'createCategoricalEvent',
        methodArgs: args,
        eventName: 'CategoricalEventCreation',
        eventArgName: 'categoricalEvent',
        resultContract: this.contracts.CategoricalEvent
    })
}

export async function createScalarEvent(opts) {
    let args = getTruffleArgsFromOptions([
        'collateralToken',
        'oracle',
        'lowerBound',
        'upperBound'
    ], opts)

    return await sendTransactionAndGetResult({
        factoryContract: this.contracts.EventFactory,
        methodName: 'createScalarEvent',
        methodArgs: args,
        eventName: 'ScalarEventCreation',
        eventArgName: 'scalarEvent',
        resultContract: this.contracts.ScalarEvent
    })
}