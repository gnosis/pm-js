'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.resolveEvent = exports.loadEventDescription = exports.publishEventDescription = exports.createScalarEvent = exports.createCategoricalEvent = undefined;

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

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
var publishEventDescription = exports.publishEventDescription = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(description) {
        var resultHash;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return this.ipfs.addJSONAsync(description);

                    case 2:
                        resultHash = _context.sent;

                        this.log('published event description on IPFS at ' + resultHash);
                        return _context.abrupt('return', resultHash);

                    case 5:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function publishEventDescription(_x) {
        return _ref.apply(this, arguments);
    };
}();

/**
 * Loads an event description from IPFS.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {string} ipfsHash - The IPFS hash locating the published event
 * @returns {Object} A POD object describing the event
 * @alias Gnosis#loadEventDescription
 */


var loadEventDescription = exports.loadEventDescription = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(ipfsHash) {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        _context2.next = 2;
                        return this.ipfs.catJSONAsync(ipfsHash);

                    case 2:
                        return _context2.abrupt('return', _context2.sent);

                    case 3:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function loadEventDescription(_x2) {
        return _ref2.apply(this, arguments);
    };
}();

/**
 * Resolves an event. Assumes event is backed solely by a centralized oracle controlled by you
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {Contract|string} opts.event - The event address or instance
 * @param {number|string|BigNumber} opts.outcome - The outcome to set this event to. This is the zero-based index of the outcome for categorical events and the decimals-adjusted value of the outcome for scalar events.
 * @alias Gnosis#resolveEvent
 */


var resolveEvent = exports.resolveEvent = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
        var _normalizeWeb3Args,
            _normalizeWeb3Args2,
            _normalizeWeb3Args2$,
            eventAddress,
            outcome,
            opts,
            event,
            oracle,
            _args3 = arguments;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        _normalizeWeb3Args = (0, _utils.normalizeWeb3Args)((0, _from2.default)(_args3), {
                            methodName: 'resolveEvent',
                            functionInputs: [{ name: 'event', type: 'address' }, { name: 'outcome', type: 'int256' }]
                        }), _normalizeWeb3Args2 = (0, _slicedToArray3.default)(_normalizeWeb3Args, 2), _normalizeWeb3Args2$ = (0, _slicedToArray3.default)(_normalizeWeb3Args2[0], 2), eventAddress = _normalizeWeb3Args2$[0], outcome = _normalizeWeb3Args2$[1], opts = _normalizeWeb3Args2[1];
                        _context3.next = 3;
                        return this.contracts.Event.at(eventAddress);

                    case 3:
                        event = _context3.sent;
                        _context3.t0 = this.contracts.CentralizedOracle;
                        _context3.next = 7;
                        return event.oracle(opts);

                    case 7:
                        _context3.t1 = _context3.sent;
                        _context3.next = 10;
                        return _context3.t0.at.call(_context3.t0, _context3.t1);

                    case 10:
                        oracle = _context3.sent;
                        _context3.t2 = _utils.requireEventFromTXResult;
                        _context3.next = 14;
                        return oracle.setOutcome(outcome, opts);

                    case 14:
                        _context3.t3 = _context3.sent;
                        (0, _context3.t2)(_context3.t3, 'OutcomeAssignment');
                        _context3.t4 = _utils.requireEventFromTXResult;
                        _context3.next = 19;
                        return event.setOutcome(opts);

                    case 19:
                        _context3.t5 = _context3.sent;
                        (0, _context3.t4)(_context3.t5, 'OutcomeAssignment');

                    case 21:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function resolveEvent() {
        return _ref3.apply(this, arguments);
    };
}();

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Creates a categorical event.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @function
 * @param {Contract|string} opts.collateralToken - The collateral token contract or its address
 * @param {Contract|string} opts.oracle - The oracle responsible for resolving this event
 * @param {number|string|BigNumber} opts.outcomeCount - The number of outcomes of this event
 * @returns {Contract} The created categorical event
 * @alias Gnosis#createCategoricalEvent
 */
var createCategoricalEvent = exports.createCategoricalEvent = (0, _utils.wrapWeb3Function)(function (self) {
    return {
        callerContract: self.contracts.EventFactory,
        methodName: 'createCategoricalEvent',
        eventName: 'CategoricalEventCreation',
        eventArgName: 'categoricalEvent',
        resultContract: self.contracts.CategoricalEvent
    };
});

/**
 * Creates a scalar event.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @function
 * @param {Contract|string} opts.collateralToken - The collateral token contract or its address
 * @param {Contract|string} opts.oracle - The oracle responsible for resolving this event
 * @param {number|string|BigNumber} opts.lowerBound - The lower bound for the event outcome
 * @param {number|string|BigNumber} opts.upperBound - The upper bound for the event outcome
 * @returns {Contract} The created scalar event
 * @alias Gnosis#createScalarEvent
 */
var createScalarEvent = exports.createScalarEvent = (0, _utils.wrapWeb3Function)(function (self) {
    return {
        callerContract: self.contracts.EventFactory,
        methodName: 'createScalarEvent',
        eventName: 'ScalarEventCreation',
        eventArgName: 'scalarEvent',
        resultContract: self.contracts.ScalarEvent
    };
});

resolveEvent.estimateGas = function () {
    var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(_ref4) {
        var using = _ref4.using;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        if (!(using === 'stats')) {
                            _context4.next = 2;
                            break;
                        }

                        return _context4.abrupt('return', this.contracts.CentralizedOracle.gasStats.setOutcome.averageGasUsed + this.contracts.Event.gasStats.setOutcome.averageGasUsed);

                    case 2:
                        throw new Error('unsupported gas estimation source ' + using);

                    case 3:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, this);
    }));

    return function (_x3) {
        return _ref5.apply(this, arguments);
    };
}();
//# sourceMappingURL=events.js.map