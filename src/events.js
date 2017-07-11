import { getTruffleArgsFromOptions, sendTransactionAndGetResult } from './utils'

/**
 * Creates a categorical event.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {(Contract|string)} opts.collateralToken - The collateral token contract or its address
 * @param {(Contract|string)} opts.oracle - The oracle responsible for resolving this event
 * @param {(number|string|BigNumber)} opts.outcomeCount - The number of outcomes of this event
 * @returns {Contract} The created categorical event
 * @alias Gnosis#createCategoricalEvent
 */
export async function createCategoricalEvent (opts) {
    let args = getTruffleArgsFromOptions([
        'collateralToken',
        'oracle',
        'outcomeCount'
    ], opts)

    return await sendTransactionAndGetResult({
        callerContract: this.contracts.EventFactory,
        methodName: 'createCategoricalEvent',
        methodArgs: args,
        eventName: 'CategoricalEventCreation',
        eventArgName: 'categoricalEvent',
        resultContract: this.contracts.CategoricalEvent
    })
}

/**
 * Creates a scalar event.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {(Contract|string)} opts.collateralToken - The collateral token contract or its address
 * @param {(Contract|string)} opts.oracle - The oracle responsible for resolving this event
 * @param {(number|string|BigNumber)} opts.lowerBound - The lower bound for the event outcome
 * @param {(number|string|BigNumber)} opts.upperBound - The upper bound for the event outcome
 * @returns {Contract} The created scalar event
 * @alias Gnosis#createScalarEvent
 */
export async function createScalarEvent (opts) {
    let args = getTruffleArgsFromOptions([
        'collateralToken',
        'oracle',
        'lowerBound',
        'upperBound'
    ], opts)

    return await sendTransactionAndGetResult({
        callerContract: this.contracts.EventFactory,
        methodName: 'createScalarEvent',
        methodArgs: args,
        eventName: 'ScalarEventCreation',
        eventArgName: 'scalarEvent',
        resultContract: this.contracts.ScalarEvent
    })
}

/**
 * Publishes an event description onto IPFS.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {Object} eventDescription - A POD object describing the event
 * @param {string} eventDescription.title - A string describing the title of the event
 * @param {string} eventDescription.description - A string describing the purpose of the event
 * @param {string} eventDescription.resolutionDate - A string containing the resolution date of the event
 * @param {string[]} eventDescription.outcomes - A string array containing the outcomes of the event
 * @returns {string} The IPFS hash locating the published event
 * @alias Gnosis#publishEventDescription
 */
export async function publishEventDescription (description) {
    return await this.ipfs.addJSONAsync(description)
}

/**
 * Loads an event description from IPFS.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {string} ipfsHash - The IPFS hash locating the published event
 * @returns {Object} A POD object describing the event
 * @alias Gnosis#loadEventDescription
 */
export async function loadEventDescription (ipfsHash) {
    return await this.ipfs.catJSONAsync(ipfsHash)
}
