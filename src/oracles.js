import { wrapWeb3Function } from './utils'

const ipfsHashLength = 46

/**
 * Creates a centralized oracle linked to a published event.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @function
 * @param {string} ipfsHash - The published event's IPFS hash
 * @returns {Contract} The created centralized oracle contract instance
 * @alias Gnosis#createCentralizedOracle
 */
export const createCentralizedOracle = wrapWeb3Function((self) => ({
    callerContract: self.contracts.CentralizedOracleFactory,
    methodName: 'createCentralizedOracle',
    eventName: 'CentralizedOracleCreation',
    eventArgName: 'centralizedOracle',
    resultContract: self.contracts.CentralizedOracle,
    validators: [
        ([ipfsHash]) => {
            if(ipfsHash.length !== ipfsHashLength)
                throw new Error(`expected ipfsHash ${ipfsHash} to have length ${ipfsHashLength}`)
        }
    ]
}))

/**
 * Creates an ultimate oracle.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @function
 * @param {Contract|string} opts.forwardedOracle - The forwarded oracle contract or its address
 * @param {Contract|string} opts.collateralToken - The collateral token contract or its address
 * @param {number|string|BigNumber} opts.spreadMultiplier - The spread multiplier
 * @param {number|string|BigNumber} opts.challengePeriod - The challenge period in seconds
 * @param {number|string|BigNumber} opts.challengeAmount - The amount of collateral tokens put at stake in the challenge
 * @param {number|string|BigNumber} opts.frontRunnerPeriod - The front runner period in seconds
 * @returns {Contract} The created ultimate oracle contract instance
 * @alias Gnosis#createUltimateOracle
 */
export const createUltimateOracle = wrapWeb3Function((self) => ({
    callerContract: self.contracts.UltimateOracleFactory,
    methodName: 'createUltimateOracle',
    eventName: 'UltimateOracleCreation',
    eventArgName: 'ultimateOracle',
    resultContract: self.contracts.UltimateOracle,
    argAliases: {
        forwardedOracle: 'oracle'
    }
}))
