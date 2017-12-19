import _ from 'lodash'
import { wrapWeb3Function, normalizeWeb3Args, requireEventFromTXResult } from './utils'

/**
 * Creates a categorical event.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @function
 * @param {(Contract|string)} opts.collateralToken - The collateral token contract or its address
 * @param {(Contract|string)} opts.oracle - The oracle responsible for resolving this event
 * @param {(number|string|BigNumber)} opts.outcomeCount - The number of outcomes of this event
 * @returns {Contract} The created categorical event
 * @alias Gnosis#createCategoricalEvent
 */
export const createCategoricalEvent = wrapWeb3Function((self) => ({
    callerContract: self.contracts.EventFactory,
    methodName: 'createCategoricalEvent',
    eventName: 'CategoricalEventCreation',
    eventArgName: 'categoricalEvent',
    resultContract: self.contracts.CategoricalEvent
}))

/**
 * Creates a scalar event.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @function
 * @param {(Contract|string)} opts.collateralToken - The collateral token contract or its address
 * @param {(Contract|string)} opts.oracle - The oracle responsible for resolving this event
 * @param {(number|string|BigNumber)} opts.lowerBound - The lower bound for the event outcome
 * @param {(number|string|BigNumber)} opts.upperBound - The upper bound for the event outcome
 * @returns {Contract} The created scalar event
 * @alias Gnosis#createScalarEvent
 */
export const createScalarEvent = wrapWeb3Function((self) => ({
    callerContract: self.contracts.EventFactory,
    methodName: 'createScalarEvent',
    eventName: 'ScalarEventCreation',
    eventArgName: 'scalarEvent',
    resultContract: self.contracts.ScalarEvent
}))

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
    const resultHash = await this.ipfs.addJSONAsync(description)
    this.log(`published event description on IPFS at ${resultHash}`)
    return resultHash
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

/**
 * Resolves an event. Assumes event is backed solely by a centralized oracle controlled by you
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {(Contract|string)} opts.event - The event address or instance
 * @param {(number|string|BigNumber)} opts.outcome - The outcome to set this event to. This is the zero-based index of the outcome for categorical events and the decimals-adjusted value of the outcome for scalar events.
 * @alias Gnosis#resolveEvent
 */
export async function resolveEvent() {
    const [[eventAddress, outcome], opts] =
        normalizeWeb3Args(Array.from(arguments), {
            methodName: 'resolveEvent',
            functionInputs: [
                { name: 'event', type: 'address' },
                { name: 'outcome', type: 'int256'},
            ]
        })

    const event = await this.contracts.Event.at(eventAddress)
    const oracle = await this.contracts.CentralizedOracle.at(await event.oracle(opts))
    requireEventFromTXResult(await oracle.setOutcome(outcome, opts), 'OutcomeAssignment')
    requireEventFromTXResult(await event.setOutcome(opts), 'OutcomeAssignment')
}

resolveEvent.estimateGas = async function({ using }) {
    if(using === 'stats') {
        return this.contracts.CentralizedOracle.gasStats.setOutcome.averageGasUsed +
            this.contracts.Event.gasStats.setOutcome.averageGasUsed
    }
    throw new Error(`unsupported gas estimation source ${using}`)
}
