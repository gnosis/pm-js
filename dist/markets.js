'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.sellOutcomeTokens = exports.buyOutcomeTokens = exports.createMarket = undefined;

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

/**
 * Buys outcome tokens. If you have ether and plan on transacting with a market on an event which
 * uses EtherToken as collateral, be sure to convert the ether into EtherToken by sending ether to
 * the deposit() method of the contract. For other ERC20 collateral tokens, follow the token's
 * acquisition process defined by the token's contract.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {Contract|string} opts.market - The market to buy tokens from
 * @param {number|string|BigNumber} opts.outcomeTokenIndex - The index of the outcome
 * @param {number|string|BigNumber} opts.outcomeTokenCount - Number of outcome tokens to buy
 * @param {number|string|BigNumber} [opts.limitMargin=0] - Because transactions change prices, there is a chance that the cost limit for the buy, which is set to the cost according to the latest mined block, will prevent the buy transaction from succeeding. This parameter can be used to increase the cost limit by a fixed proportion. For example, specifying `limitMargin: 0.05` will make the cost limit increase by 5%.
 * @param {number|string|BigNumber} [opts.cost] - Overrides the cost limit supplied to the market contract which is derived from the latest block state of the market along with the `outcomeTokenCount` and `limitMargin` parameters.
 * @param {number|string|BigNumber} [opts.approvalAmount] - Amount of collateral to allow market to spend. If unsupplied or null, allowance will be reset to the `approvalResetAmount` only if necessary. If set to 0, the approval transaction will be skipped.
 * @param {number|string|BigNumber} [opts.approvalResetAmount] - Set to this amount when resetting market collateral allowance. If unsupplied or null, will be the cost of this transaction.
 * @param {Object} [opts.approveTxOpts] - Extra transaction options for the approval transaction if it occurs. These options override the options specified in sibling properties of the parameter object.
 * @param {Object} [opts.buyTxOpts] - Extra transaction options for the buy transaction. These options override the options specified in sibling properties of the parameter object.
 * @returns {BigNumber} How much collateral tokens caller paid
 * @alias Gnosis#buyOutcomeTokens
 */
var buyOutcomeTokens = exports.buyOutcomeTokens = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
        var _normalizeWeb3Args,
            _normalizeWeb3Args2,
            _normalizeWeb3Args2$,
            marketAddress,
            outcomeTokenIndex,
            outcomeTokenCount,
            opts,
            _ref4,
            approvalAmount,
            approvalResetAmount,
            limitMargin,
            cost,
            approveTxOpts,
            buyTxOpts,
            market,
            collateralToken,
            baseCost,
            baseCostWithFee,
            txInfo,
            buyer,
            marketAllowance,
            txRequiredEvents,
            purchaseEvent,
            _args3 = arguments;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        _normalizeWeb3Args = (0, _utils.normalizeWeb3Args)((0, _from2.default)(_args3), {
                            methodName: 'buyOutcomeTokens',
                            functionInputs: [{ name: 'market', type: 'address' }, { name: 'outcomeTokenIndex', type: 'uint8' }, { name: 'outcomeTokenCount', type: 'uint256' }]
                        }), _normalizeWeb3Args2 = (0, _slicedToArray3.default)(_normalizeWeb3Args, 2), _normalizeWeb3Args2$ = (0, _slicedToArray3.default)(_normalizeWeb3Args2[0], 3), marketAddress = _normalizeWeb3Args2$[0], outcomeTokenIndex = _normalizeWeb3Args2$[1], outcomeTokenCount = _normalizeWeb3Args2$[2], opts = _normalizeWeb3Args2[1];
                        _ref4 = opts || {}, approvalAmount = _ref4.approvalAmount, approvalResetAmount = _ref4.approvalResetAmount, limitMargin = _ref4.limitMargin, cost = _ref4.cost, approveTxOpts = _ref4.approveTxOpts, buyTxOpts = _ref4.buyTxOpts;

                        ['approvalAmount', 'approvalResetAmount', 'limitMargin', 'cost', 'approveTxOpts', 'buyTxOpts'].forEach(function (prop) {
                            delete opts[prop];
                        });
                        approveTxOpts = (0, _assign2.default)({}, opts, approveTxOpts);
                        buyTxOpts = (0, _assign2.default)({}, opts, buyTxOpts);

                        _context3.next = 7;
                        return this.contracts.Market.at(marketAddress);

                    case 7:
                        market = _context3.sent;
                        _context3.t0 = this.contracts.Token;
                        _context3.t1 = this.contracts.Event;
                        _context3.next = 12;
                        return market.eventContract(opts);

                    case 12:
                        _context3.t2 = _context3.sent;
                        _context3.next = 15;
                        return _context3.t1.at.call(_context3.t1, _context3.t2).collateralToken();

                    case 15:
                        _context3.t3 = _context3.sent;
                        _context3.next = 18;
                        return _context3.t0.at.call(_context3.t0, _context3.t3);

                    case 18:
                        collateralToken = _context3.sent;

                        if (!(cost == null)) {
                            _context3.next = 30;
                            break;
                        }

                        if (limitMargin == null) {
                            limitMargin = 0;
                        }

                        _context3.next = 23;
                        return this.lmsrMarketMaker.calcCost(marketAddress, outcomeTokenIndex, outcomeTokenCount, opts);

                    case 23:
                        baseCost = _context3.sent;
                        _context3.t4 = baseCost;
                        _context3.next = 27;
                        return market.calcMarketFee(baseCost, opts);

                    case 27:
                        _context3.t5 = _context3.sent;
                        baseCostWithFee = _context3.t4.add.call(_context3.t4, _context3.t5);

                        cost = baseCostWithFee.mul(this.web3.toBigNumber(1).add(limitMargin)).round();

                    case 30:

                        if (approvalResetAmount == null) {
                            approvalResetAmount = cost;
                        }

                        txInfo = [];

                        if (!(approvalAmount == null)) {
                            _context3.next = 42;
                            break;
                        }

                        buyer = opts.from || this.defaultAccount;
                        _context3.next = 36;
                        return collateralToken.allowance(buyer, marketAddress, opts);

                    case 36:
                        marketAllowance = _context3.sent;

                        if (!marketAllowance.lt(cost)) {
                            _context3.next = 40;
                            break;
                        }

                        _context3.next = 40;
                        return pushDescribedTransaction(txInfo, this.log, {
                            caller: collateralToken,
                            methodName: 'approve',
                            methodArgs: [marketAddress, approvalResetAmount, approveTxOpts],
                            requiredEventName: 'Approval'
                        });

                    case 40:
                        _context3.next = 45;
                        break;

                    case 42:
                        if (!this.web3.toBigNumber(0).lt(approvalAmount)) {
                            _context3.next = 45;
                            break;
                        }

                        _context3.next = 45;
                        return pushDescribedTransaction(txInfo, this.log, {
                            caller: collateralToken,
                            methodName: 'approve',
                            methodArgs: [marketAddress, approvalAmount, approveTxOpts],
                            requiredEventName: 'Approval'
                        });

                    case 45:
                        _context3.next = 47;
                        return pushDescribedTransaction(txInfo, this.log, {
                            caller: market,
                            methodName: 'buy',
                            methodArgs: [outcomeTokenIndex, outcomeTokenCount, cost, buyTxOpts],
                            requiredEventName: 'OutcomeTokenPurchase'
                        });

                    case 47:
                        _context3.next = 49;
                        return syncDescribedTransactions(txInfo, this.log);

                    case 49:
                        txRequiredEvents = _context3.sent;
                        purchaseEvent = txRequiredEvents[txRequiredEvents.length - 1];
                        return _context3.abrupt('return', purchaseEvent.args.outcomeTokenCost.plus(purchaseEvent.args.marketFees));

                    case 52:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function buyOutcomeTokens() {
        return _ref3.apply(this, arguments);
    };
}();

/**
 * Sells outcome tokens. If transacting with a market which deals with EtherToken as collateral,
 * will need additional step of sending a withdraw(uint amount) transaction to the EtherToken
 * contract if raw ether is desired.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {Contract|string} opts.market - The market to sell tokens to
 * @param {number|string|BigNumber} opts.outcomeTokenIndex - The index of the outcome
 * @param {number|string|BigNumber} opts.outcomeTokenCount - Number of outcome tokens to sell
 * @param {number|string|BigNumber} [opts.limitMargin=0] - Because transactions change profits, there is a chance that the profit limit for the sell, which is set to the profit according to the latest mined block, will prevent the sell transaction from succeeding. This parameter can be used to decrease the profit limit by a fixed proportion. For example, specifying `limitMargin: 0.05` will make the profit limit decrease by 5%.
 * @param {number|string|BigNumber} [opts.minProfit] - Overrides the minimum profit limit supplied to the market contract which is derived from the latest block state of the market along with the `outcomeTokenCount` and `limitMargin` parameters.
 * @param {number|string|BigNumber} [opts.approvalAmount] - Amount of outcome tokens to allow market to handle. If unsupplied or null, allowance will be reset to the `approvalResetAmount` only if necessary. If set to 0, the approval transaction will be skipped.
 * @param {number|string|BigNumber} [opts.approvalResetAmount] - Set to this amount when resetting market outcome token allowance. If unsupplied or null, will be the sale amount specified by `outcomeTokenCount`.
 * @param {Object} [opts.approveTxOpts] - Extra transaction options for the approval transaction if it occurs. These options override the options specified in sibling properties of the parameter object.
 * @param {Object} [opts.sellTxOpts] - Extra transaction options for the sell transaction. These options override the options specified in sibling properties of the parameter object.
 * @returns {BigNumber} How much collateral tokens caller received from sale
 * @alias Gnosis#sellOutcomeTokens
 */
var sellOutcomeTokens = exports.sellOutcomeTokens = function () {
    var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
        var _normalizeWeb3Args3,
            _normalizeWeb3Args4,
            _normalizeWeb3Args4$,
            marketAddress,
            outcomeTokenIndex,
            outcomeTokenCount,
            opts,
            _ref8,
            approvalAmount,
            approvalResetAmount,
            limitMargin,
            minProfit,
            approveTxOpts,
            sellTxOpts,
            market,
            outcomeToken,
            baseProfit,
            baseProfitWithFee,
            txInfo,
            seller,
            marketAllowance,
            txRequiredEvents,
            saleEvent,
            _args5 = arguments;

        return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        _normalizeWeb3Args3 = (0, _utils.normalizeWeb3Args)((0, _from2.default)(_args5), {
                            methodName: 'sellOutcomeTokens',
                            functionInputs: [{ name: 'market', type: 'address' }, { name: 'outcomeTokenIndex', type: 'uint8' }, { name: 'outcomeTokenCount', type: 'uint256' }]
                        }), _normalizeWeb3Args4 = (0, _slicedToArray3.default)(_normalizeWeb3Args3, 2), _normalizeWeb3Args4$ = (0, _slicedToArray3.default)(_normalizeWeb3Args4[0], 3), marketAddress = _normalizeWeb3Args4$[0], outcomeTokenIndex = _normalizeWeb3Args4$[1], outcomeTokenCount = _normalizeWeb3Args4$[2], opts = _normalizeWeb3Args4[1];
                        _ref8 = opts || {}, approvalAmount = _ref8.approvalAmount, approvalResetAmount = _ref8.approvalResetAmount, limitMargin = _ref8.limitMargin, minProfit = _ref8.minProfit, approveTxOpts = _ref8.approveTxOpts, sellTxOpts = _ref8.sellTxOpts;

                        ['approvalAmount', 'approvalResetAmount', 'limitMargin', 'minProfit', 'approveTxOpts', 'sellTxOpts'].forEach(function (prop) {
                            delete opts[prop];
                        });
                        approveTxOpts = (0, _assign2.default)({}, opts, approveTxOpts);
                        sellTxOpts = (0, _assign2.default)({}, opts, sellTxOpts);

                        _context5.next = 7;
                        return this.contracts.Market.at(marketAddress);

                    case 7:
                        market = _context5.sent;
                        _context5.t0 = this.contracts.Token;
                        _context5.t1 = this.contracts.Event;
                        _context5.next = 12;
                        return market.eventContract(opts);

                    case 12:
                        _context5.t2 = _context5.sent;
                        _context5.t3 = outcomeTokenIndex;
                        _context5.next = 16;
                        return _context5.t1.at.call(_context5.t1, _context5.t2).outcomeTokens(_context5.t3);

                    case 16:
                        _context5.t4 = _context5.sent;
                        _context5.next = 19;
                        return _context5.t0.at.call(_context5.t0, _context5.t4);

                    case 19:
                        outcomeToken = _context5.sent;

                        if (!(minProfit == null)) {
                            _context5.next = 31;
                            break;
                        }

                        if (limitMargin == null) {
                            limitMargin = 0;
                        }

                        _context5.next = 24;
                        return this.lmsrMarketMaker.calcProfit(marketAddress, outcomeTokenIndex, outcomeTokenCount, opts);

                    case 24:
                        baseProfit = _context5.sent;
                        _context5.t5 = baseProfit;
                        _context5.next = 28;
                        return market.calcMarketFee(baseProfit, opts);

                    case 28:
                        _context5.t6 = _context5.sent;
                        baseProfitWithFee = _context5.t5.sub.call(_context5.t5, _context5.t6);

                        minProfit = baseProfitWithFee.mul(this.web3.toBigNumber(1).sub(limitMargin)).round();

                    case 31:

                        if (approvalResetAmount == null) {
                            approvalResetAmount = outcomeTokenCount;
                        }

                        txInfo = [];

                        if (!(approvalAmount == null)) {
                            _context5.next = 43;
                            break;
                        }

                        seller = opts.from || this.defaultAccount;
                        _context5.next = 37;
                        return outcomeToken.allowance(seller, marketAddress, opts);

                    case 37:
                        marketAllowance = _context5.sent;

                        if (!marketAllowance.lt(outcomeTokenCount)) {
                            _context5.next = 41;
                            break;
                        }

                        _context5.next = 41;
                        return pushDescribedTransaction(txInfo, this.log, {
                            caller: outcomeToken,
                            methodName: 'approve',
                            methodArgs: [marketAddress, approvalResetAmount, approveTxOpts],
                            requiredEventName: 'Approval'
                        });

                    case 41:
                        _context5.next = 46;
                        break;

                    case 43:
                        if (!this.web3.toBigNumber(0).lt(approvalAmount)) {
                            _context5.next = 46;
                            break;
                        }

                        _context5.next = 46;
                        return pushDescribedTransaction(txInfo, this.log, {
                            caller: outcomeToken,
                            methodName: 'approve',
                            methodArgs: [marketAddress, approvalAmount, approveTxOpts],
                            requiredEventName: 'Approval'
                        });

                    case 46:
                        _context5.next = 48;
                        return pushDescribedTransaction(txInfo, this.log, {
                            caller: market,
                            methodName: 'sell',
                            methodArgs: [outcomeTokenIndex, outcomeTokenCount, minProfit, sellTxOpts],
                            requiredEventName: 'OutcomeTokenSale'
                        });

                    case 48:
                        _context5.next = 50;
                        return syncDescribedTransactions(txInfo, this.log);

                    case 50:
                        txRequiredEvents = _context5.sent;
                        saleEvent = txRequiredEvents[txRequiredEvents.length - 1];
                        return _context5.abrupt('return', saleEvent.args.outcomeTokenProfit.minus(saleEvent.args.marketFees));

                    case 53:
                    case 'end':
                        return _context5.stop();
                }
            }
        }, _callee5, this);
    }));

    return function sellOutcomeTokens() {
        return _ref7.apply(this, arguments);
    };
}();

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Creates a market.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {Contract|string} opts.event - The forwarded oracle contract or its address
 * @param {Contract|string} opts.marketMaker - The collateral token contract or its address
 * @param {number|string|BigNumber} opts.fee - The fee factor. Specifying 1,000,000 corresponds to 100%, 50,000 corresponds to 5%, etc.
 * @param {Contract|string} [opts.marketFactory=Gnosis.standardMarketFactory] - The factory contract
 * @returns {Contract} The created market contract instance. If marketFactory is `StandardMarketFactory <https://gnosis-pm-contracts.readthedocs.io/en/latest/StandardMarketFactory.html>`_, this should be a `StandardMarket <https://gnosis-pm-contracts.readthedocs.io/en/latest/StandardMarket.html>`_
 * @alias Gnosis#createMarket
 */
var createMarket = exports.createMarket = (0, _utils.wrapWeb3Function)(function (self, opts) {
    var callerContract = opts.marketFactory || self.standardMarketFactory;
    delete opts.marketFactory;

    return {
        callerContract: callerContract,
        callerABI: self.contracts.StandardMarketFactory.abi,
        methodName: 'createMarket',
        eventName: 'StandardMarketCreation',
        eventArgName: 'market',
        resultContract: self.contracts.Market,
        argAliases: {
            event: 'eventContract'
        }
    };
});

var pushDescribedTransaction = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(txInfo, log, opts) {
        var caller, methodName, methodArgs, txHash, _caller$methodName;

        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        caller = opts.caller, methodName = opts.methodName, methodArgs = opts.methodArgs;
                        txHash = void 0;
                        _context.prev = 2;
                        _context.next = 5;
                        return (_caller$methodName = caller[methodName]).sendTransaction.apply(_caller$methodName, (0, _toConsumableArray3.default)(methodArgs));

                    case 5:
                        txHash = _context.sent;

                        log('got tx hash ' + txHash + ' for call ' + (0, _utils.formatCallSignature)(opts));
                        txInfo.push((0, _assign2.default)({ txHash: txHash }, opts));
                        _context.next = 13;
                        break;

                    case 10:
                        _context.prev = 10;
                        _context.t0 = _context['catch'](2);
                        throw new _utils.TransactionError((0, _assign2.default)({ txHash: txHash, subError: _context.t0 }, opts));

                    case 13:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined, [[2, 10]]);
    }));

    return function pushDescribedTransaction(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
}();

var syncDescribedTransactions = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(txInfo, log) {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        _context2.next = 2;
                        return _promise2.default.all(txInfo.map(function (opts) {
                            return opts.caller.constructor.syncTransaction(opts.txHash).then(function (res) {
                                log('tx ' + opts.txHash + ' synced');
                                return res;
                            }).catch(function (err) {
                                return new _utils.TransactionError((0, _assign2.default)({ subError: err }, opts));
                            });
                        }));

                    case 2:
                        _context2.t0 = function (res, i) {
                            return (0, _utils.requireEventFromTXResult)(res, txInfo[i].requiredEventName);
                        };

                        return _context2.abrupt('return', _context2.sent.map(_context2.t0));

                    case 4:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, undefined);
    }));

    return function syncDescribedTransactions(_x4, _x5) {
        return _ref2.apply(this, arguments);
    };
}();

buyOutcomeTokens.estimateGas = function () {
    var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(_ref5) {
        var using = _ref5.using;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        if (!(using === 'stats')) {
                            _context4.next = 2;
                            break;
                        }

                        return _context4.abrupt('return', this.contracts.Token.gasStats.approve.averageGasUsed + this.contracts.Market.gasStats.buy.averageGasUsed);

                    case 2:
                        throw new Error('unsupported gas estimation source ' + using);

                    case 3:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, this);
    }));

    return function (_x6) {
        return _ref6.apply(this, arguments);
    };
}();

sellOutcomeTokens.estimateGas = function () {
    var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(_ref9) {
        var using = _ref9.using;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
            while (1) {
                switch (_context6.prev = _context6.next) {
                    case 0:
                        if (!(using === 'stats')) {
                            _context6.next = 2;
                            break;
                        }

                        return _context6.abrupt('return', this.contracts.Token.gasStats.approve.averageGasUsed + this.contracts.Market.gasStats.sell.averageGasUsed);

                    case 2:
                        throw new Error('unsupported gas estimation source ' + using);

                    case 3:
                    case 'end':
                        return _context6.stop();
                }
            }
        }, _callee6, this);
    }));

    return function (_x7) {
        return _ref10.apply(this, arguments);
    };
}();
//# sourceMappingURL=markets.js.map