'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createUltimateOracle = exports.createCentralizedOracle = undefined;

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ipfsHashLength = 46;

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
var createCentralizedOracle = exports.createCentralizedOracle = (0, _utils.wrapWeb3Function)(function (self) {
    return {
        callerContract: self.contracts.CentralizedOracleFactory,
        methodName: 'createCentralizedOracle',
        eventName: 'CentralizedOracleCreation',
        eventArgName: 'centralizedOracle',
        resultContract: self.contracts.CentralizedOracle,
        validators: [function (_ref) {
            var _ref2 = (0, _slicedToArray3.default)(_ref, 1),
                ipfsHash = _ref2[0];

            if (ipfsHash.length !== ipfsHashLength) throw new Error('expected ipfsHash ' + ipfsHash + ' to have length ' + ipfsHashLength);
        }]
    };
});

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
var createUltimateOracle = exports.createUltimateOracle = (0, _utils.wrapWeb3Function)(function (self) {
    return {
        callerContract: self.contracts.UltimateOracleFactory,
        methodName: 'createUltimateOracle',
        eventName: 'UltimateOracleCreation',
        eventArgName: 'ultimateOracle',
        resultContract: self.contracts.UltimateOracle,
        argAliases: {
            forwardedOracle: 'oracle'
        }
    };
});
//# sourceMappingURL=oracles.js.map