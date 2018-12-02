'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.sendTransactionAndGetResult = exports.TransactionError = exports.Decimal = undefined;

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _functionsIn2 = require('lodash/functionsIn');

var _functionsIn3 = _interopRequireDefault(_functionsIn2);

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _clone2 = require('lodash/clone');

var _clone3 = _interopRequireDefault(_clone2);

var _defaults2 = require('lodash/defaults');

var _defaults3 = _interopRequireDefault(_defaults2);

var _forOwn2 = require('lodash/forOwn');

var _forOwn3 = _interopRequireDefault(_forOwn2);

var _isNumber2 = require('lodash/isNumber');

var _isNumber3 = _interopRequireDefault(_isNumber2);

var _isBoolean2 = require('lodash/isBoolean');

var _isBoolean3 = _interopRequireDefault(_isBoolean2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _has2 = require('lodash/has');

var _has3 = _interopRequireDefault(_has2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var sendTransactionAndGetResult = exports.sendTransactionAndGetResult = function () {
    var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(opts) {
        var caller, txHash, txResult, matchingLog, contractInstance, _caller$opts$methodNa;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        opts = opts || {};
                        caller = void 0, txHash = void 0, txResult = void 0, matchingLog = void 0, contractInstance = void 0;
                        _context3.prev = 2;

                        caller = opts.callerContract;

                        if (!(0, _has3.default)(caller, 'deployed')) {
                            _context3.next = 8;
                            break;
                        }

                        _context3.next = 7;
                        return caller.deployed();

                    case 7:
                        caller = _context3.sent;

                    case 8:
                        _context3.next = 10;
                        return (_caller$opts$methodNa = caller[opts.methodName]).sendTransaction.apply(_caller$opts$methodNa, (0, _toConsumableArray3.default)(opts.methodArgs));

                    case 10:
                        txHash = _context3.sent;


                        if (opts.log != null) {
                            opts.log('got tx hash ' + txHash + ' for call ' + formatCallSignature({ caller: caller, methodName: opts.methodName, methodArgs: opts.methodArgs }));
                        }

                        _context3.next = 14;
                        return caller.constructor.syncTransaction(txHash);

                    case 14:
                        txResult = _context3.sent;

                        matchingLog = requireEventFromTXResult(txResult, opts.eventName);

                        if (!(opts.resultContract == null)) {
                            _context3.next = 20;
                            break;
                        }

                        return _context3.abrupt('return', matchingLog.args[opts.eventArgName]);

                    case 20:
                        opts.log('tx hash ' + txHash.slice(0, 6) + '..' + txHash.slice(-4) + ' returned ' + opts.resultContract.contractName + '(' + matchingLog.args[opts.eventArgName] + ')');
                        _context3.next = 23;
                        return opts.resultContract.at(matchingLog.args[opts.eventArgName]);

                    case 23:
                        contractInstance = _context3.sent;

                        // Set the resulting transaction hash on the contract instance
                        contractInstance.transactionHash = txHash;
                        return _context3.abrupt('return', contractInstance);

                    case 26:
                        _context3.next = 31;
                        break;

                    case 28:
                        _context3.prev = 28;
                        _context3.t0 = _context3['catch'](2);
                        throw new TransactionError((0, _assign2.default)({
                            caller: caller, txHash: txHash, txResult: txResult, matchingLog: matchingLog,
                            subError: _context3.t0
                        }, opts));

                    case 31:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this, [[2, 28]]);
    }));

    return function sendTransactionAndGetResult(_x) {
        return _ref9.apply(this, arguments);
    };
}();

// I know bluebird does this, but it's heavy
// Also, as of Node v8.5.0, `util.promisify` doesn't call the function with the same `this`


exports.normalizeWeb3Args = normalizeWeb3Args;
exports.wrapWeb3Function = wrapWeb3Function;
exports.requireEventFromTXResult = requireEventFromTXResult;
exports.formatCallSignature = formatCallSignature;
exports.promisify = promisify;
exports.promisifyAll = promisifyAll;

var _decimal = require('decimal.js');

var _decimal2 = _interopRequireDefault(_decimal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function makeWeb3Compatible(value, type, argName) {
    if (type == null) {
        throw new Error('type must be specified for argument ' + argName);
    }

    var match = /^(.*)\[(\d*)\]$/.exec(type);
    if (match != null) {
        if (!(0, _isArray3.default)(value)) {
            throw new Error('expected ' + value + ' to be convertable to ' + type + ' ' + argName);
        }

        if (match[2] !== '' && value.length !== Number(match[2])) {
            throw new Error(value + ' has ' + value.length + ' items but should be ' + type + ' ' + argName);
        }

        return value.map(function (v) {
            return makeWeb3Compatible(v, match[1], argName);
        });
    }

    if (type === 'address') {
        // if it quacks like a TruffleContract
        if ((0, _has3.default)(value, 'address')) {
            value = value.address;
        }

        if (!(0, _isString3.default)(value)) {
            throw new Error(value + ' must be string for ' + type + ' ' + argName);
        }

        if (!/^(0x)?[0-9a-f]{40}$/i.test(value)) {
            throw new Error(value + ' has wrong format for ' + type + ' ' + argName);
        }

        return value;
    }

    if (type === 'bool') {
        if (!(0, _isBoolean3.default)(value)) {
            throw new Error('expected ' + value + ' to be a bool for ' + type + ' ' + argName);
        }

        return value;
    }

    if (type === 'bytes' || type === 'string') {
        if ((0, _isString3.default)(value)) {
            return value;
        }

        throw new Error('could not format ' + value + ' for ' + type + ' ' + argName);
    }

    match = /^bytes(\d+)$/.exec(type);
    if (match != null) {
        var bytesLength = Number(match[1]);
        if (bytesLength > 32 || bytesLength === 0 || match[1].startsWith('0')) {
            throw new Error('invalid type ' + type + ' specified for ' + argName);
        }

        if ((0, _isString3.default)(value)) {
            // TODO: refine this check to account for things like '\uACDC'.length
            if (value.length > bytesLength) {
                throw new Error('value ' + value + ' too long for ' + type + ' ' + argName);
            }
            return value;
        }

        throw new Error('could not format ' + value + ' for ' + type + ' ' + argName);
    }

    match = /^(u?)int(\d+)$/.exec(type);
    if (match != null) {
        var signed = match[1] === '';
        var numBits = Number(match[2]);
        if (numBits % 8 !== 0) {
            throw new Error('number of bits for ' + type + ' ' + argName + ' not divisible by 8');
        }

        if (numBits > 256) {
            throw new Error('number of bits for ' + type + ' ' + argName + ' is too large');
        }

        value = value.valueOf();

        if ((0, _isString3.default)(value) && /^-?(0x[\da-f]+|\d+)$/i.test(value) || (0, _isNumber3.default)(value)) {
            if ((0, _isString3.default)(value) && value.startsWith('0x') && value.slice(2) === Number(value).toString(16) || value == Number(value).toString()) {
                value = Number(value);
            }

            if (!signed && value.toString().startsWith('-')) {
                throw new Error('cannot pass negative value ' + value + ' for ' + type + ' ' + argName);
            }

            return value;
        }

        throw new Error('could not normalize ' + value + ' for ' + type + ' ' + argName);
    }

    throw new Error('unsupported type ' + type + ' for ' + argName);
}

function getOptsFromArgs(args) {
    return (0, _typeof3.default)(args[args.length - 1]) === 'object' ? args[args.length - 1] : {};
}

function getTruffleArgsWhileMutatingOptions(argInfo, opts, argAliases) {
    opts = opts == null ? {} : opts;

    if (argAliases != null) {
        (0, _forOwn3.default)(argAliases, function (name, alias) {
            if ((0, _has3.default)(opts, alias)) {
                if ((0, _has3.default)(opts, name)) {
                    throw new Error('both name ' + name + ' and its alias ' + alias + ' specified in ' + opts);
                }
                opts[name] = opts[alias];
                delete opts[alias];
            }
        });
    }

    return argInfo.map(function (_ref) {
        var name = _ref.name,
            type = _ref.type;

        if (!(0, _has3.default)(opts, name)) {
            throw new Error('missing argument ' + name);
        }
        var ret = makeWeb3Compatible(opts[name], type, name);
        delete opts[name];
        return ret;
    });
}

var Decimal = exports.Decimal = _decimal2.default.clone({ precision: 80, toExpPos: 9999 });

function normalizeWeb3Args(args, opts) {
    var functionInputs = opts.functionInputs,
        methodName = opts.methodName,
        argAliases = opts.argAliases,
        defaults = opts.defaults;

    // Format arguments in a way that web3 likes

    var methodArgs = void 0,
        methodOpts = void 0;
    if (functionInputs.length === 1 && args.length === 1) {
        // if there is one input, user could have supplied either the argument with no options
        // or the argument inside of an options object
        if ((0, _typeof3.default)(args[0]) === 'object' && (0, _has3.default)(args[0], functionInputs[0].name)) {
            // we consider argument to be an options object if it has the parameter name as a key on it
            methodOpts = (0, _defaults3.default)((0, _clone3.default)(args[0]), defaults);
            methodArgs = getTruffleArgsWhileMutatingOptions(functionInputs, methodOpts, argAliases);
        } else {
            methodOpts = null;
            methodArgs = functionInputs.map(function (_ref2, i) {
                var name = _ref2.name,
                    type = _ref2.type;
                return makeWeb3Compatible(args[i], type, name);
            });
        }
    } else if (functionInputs.length === args.length) {
        methodOpts = null;
        methodArgs = functionInputs.map(function (_ref3, i) {
            var name = _ref3.name,
                type = _ref3.type;
            return makeWeb3Compatible(args[i], type, name);
        });
    } else if (functionInputs.length + 1 === args.length && (0, _typeof3.default)(args[functionInputs.length]) === 'object') {
        methodOpts = args[args.length - 1];
        // this map should not hit the last element of args
        methodArgs = functionInputs.map(function (_ref4, i) {
            var name = _ref4.name,
                type = _ref4.type;
            return makeWeb3Compatible(args[i], type, name);
        });
    } else if (args.length === 1 && (0, _typeof3.default)(args[0]) === 'object') {
        methodOpts = (0, _defaults3.default)((0, _clone3.default)(args[0]), defaults);
        methodArgs = getTruffleArgsWhileMutatingOptions(functionInputs, methodOpts, argAliases);
    } else {
        throw new Error(methodName + '(' + functionInputs.map(function (_ref5) {
            var name = _ref5.name,
                type = _ref5.type;
            return type + ' ' + name;
        }).join(', ') + ') can\'t be called with args (' + args.join(', ') + ')');
    }

    return [methodArgs, methodOpts];
}

function getWeb3CallMetadata(args, opts, speccedOpts) {
    var callerContract = speccedOpts.callerContract,
        callerABI = speccedOpts.callerABI,
        methodName = speccedOpts.methodName,
        eventName = speccedOpts.eventName,
        eventArgName = speccedOpts.eventArgName,
        resultContract = speccedOpts.resultContract,
        argAliases = speccedOpts.argAliases,
        validators = speccedOpts.validators;


    if (callerABI == null) {
        callerABI = callerContract.abi;
    }

    var functionCandidates = callerABI.filter(function (_ref6) {
        var name = _ref6.name;
        return name === methodName;
    });

    if (functionCandidates.length === 0) {
        throw new Error('could not find function ' + methodName + ' in abi ' + callerABI);
    } else if (functionCandidates.length > 1) {
        // eslint-disable-next-line no-console
        console.warn('function ' + methodName + ' has multiple candidates in abi ' + callerABI + ' -- using last candidate');
    }

    var functionInputs = functionCandidates.pop().inputs;

    var _normalizeWeb3Args = normalizeWeb3Args(args, { functionInputs: functionInputs, methodName: methodName, argAliases: argAliases }),
        _normalizeWeb3Args2 = (0, _slicedToArray3.default)(_normalizeWeb3Args, 2),
        methodArgs = _normalizeWeb3Args2[0],
        methodOpts = _normalizeWeb3Args2[1];

    if (validators != null) {
        validators.forEach(function (validator) {
            validator(methodArgs);
        });
    }

    // Pass extra options down to the web3 layer
    if (methodOpts != null) {
        methodArgs.push(methodOpts);
    }

    return {
        callerContract: callerContract, methodName: methodName, methodArgs: methodArgs,
        eventName: eventName, eventArgName: eventArgName, resultContract: resultContract
    };
}

function wrapWeb3Function(spec) {
    var wrappedFn = function () {
        var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
            var opts,
                speccedOpts,
                callMetadata,
                _args = arguments;
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            opts = getOptsFromArgs(_args);
                            speccedOpts = spec(this, opts);
                            callMetadata = getWeb3CallMetadata(_args, opts, speccedOpts);

                            callMetadata.log = this.log;

                            _context.next = 6;
                            return sendTransactionAndGetResult(callMetadata);

                        case 6:
                            return _context.abrupt('return', _context.sent);

                        case 7:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));

        return function wrappedFn() {
            return _ref7.apply(this, arguments);
        };
    }();

    wrappedFn.estimateGas = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
        var opts,
            speccedOpts,
            callerContract,
            methodName,
            _caller$methodName,
            _getWeb3CallMetadata,
            methodArgs,
            caller,
            _args2 = arguments;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        opts = getOptsFromArgs(_args2);
                        speccedOpts = spec(this, opts);
                        callerContract = speccedOpts.callerContract, methodName = speccedOpts.methodName;

                        if (!(opts.using === 'stats')) {
                            _context2.next = 5;
                            break;
                        }

                        return _context2.abrupt('return', callerContract.gasStats[methodName].averageGasUsed);

                    case 5:
                        if (!(opts.using === 'rpc')) {
                            _context2.next = 15;
                            break;
                        }

                        _getWeb3CallMetadata = getWeb3CallMetadata(_args2, opts, speccedOpts), methodArgs = _getWeb3CallMetadata.methodArgs;
                        caller = callerContract;

                        if (!(0, _has3.default)(caller, 'deployed')) {
                            _context2.next = 12;
                            break;
                        }

                        _context2.next = 11;
                        return caller.deployed();

                    case 11:
                        caller = _context2.sent;

                    case 12:
                        _context2.next = 14;
                        return (_caller$methodName = caller[methodName]).estimateGas.apply(_caller$methodName, (0, _toConsumableArray3.default)(methodArgs));

                    case 14:
                        return _context2.abrupt('return', _context2.sent);

                    case 15:
                        throw new Error('unsupported gas estimation source ' + opts.using);

                    case 16:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return wrappedFn;
}

/**
 * Looks for a single event in the logs of a transaction result. If no such events or multiple matching events are found, throws an error. Otherwise returns the matching event log.
 *
 * @param {Transaction} result Result of sending a transaction
 * @param {string} eventName Name of the event
 * @return {Object} The matching event log found
 * @alias Gnosis.requireEventFromTXResult
 */
function requireEventFromTXResult(result, eventName) {
    var matchingLogs = (0, _filter3.default)(result.logs, function (l) {
        return l.event === eventName;
    });

    if (matchingLogs.length < 1) {
        throw new Error('could not find any logs in transaction ' + result.tx + ' corresponding to event ' + eventName);
    } else if (matchingLogs.length > 1) {
        throw new Error('found too many logs in transaction ' + result.tx + ' corresponding to event ' + eventName);
    }

    return matchingLogs[0];
}

function formatCallSignature(opts) {
    return opts.caller.constructor.contractName + '(' + opts.caller.address.slice(0, 6) + '..' + opts.caller.address.slice(-4) + ').' + opts.methodName + '(' + opts.methodArgs.map(function (v) {
        try {
            return (0, _stringify2.default)(v);
        } catch (e) {
            return v;
        }
    }).join(', ') + ')';
}

var TransactionError = exports.TransactionError = function (_Error) {
    (0, _inherits3.default)(TransactionError, _Error);

    function TransactionError(opts) {
        (0, _classCallCheck3.default)(this, TransactionError);

        var _this = (0, _possibleConstructorReturn3.default)(this, (TransactionError.__proto__ || (0, _getPrototypeOf2.default)(TransactionError)).call(this, '' + formatCallSignature(opts) + (opts.txHash == null ? '' : '\n\n  with transaction hash ' + opts.txHash) + '\n\n  failed with ' + opts.subError));

        (0, _assign2.default)(_this, opts);

        _this.name = 'TransactionError';
        return _this;
    }

    return TransactionError;
}(Error);

function promisify(fn) {
    return new Proxy(fn, {
        apply: function apply(target, thisArg, args) {
            return new _promise2.default(function (resolve, reject) {
                var newArgs = (0, _from2.default)(args);
                newArgs.push(function (err, result) {
                    if (err != null) {
                        reject(new Error('' + err + (result == null ? '' : ' (' + result + ')')));
                    } else {
                        resolve(result);
                    }
                });
                target.apply(thisArg, newArgs);
            });
        }
    });
}

function promisifyAll(obj) {
    (0, _functionsIn3.default)(obj).forEach(function (fnName) {
        var asyncFnName = fnName + 'Async';
        if (!(0, _has3.default)(obj, asyncFnName)) {
            obj[asyncFnName] = promisify(obj[fnName]);
        }
    });
    return obj;
}
//# sourceMappingURL=utils.js.map