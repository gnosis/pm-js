'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

exports.calcLMSRCost = calcLMSRCost;
exports.calcLMSRProfit = calcLMSRProfit;
exports.calcLMSROutcomeTokenCount = calcLMSROutcomeTokenCount;
exports.calcLMSRMarginalPrice = calcLMSRMarginalPrice;

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Estimates the cost of buying specified number of outcome tokens from LMSR market. Unfunded markets will be handled as a special case, returning the outcomeTokenCount passed plus its corresponding fee fee.
 * @param {number[]|string[]|BigNumber[]} opts.netOutcomeTokensSold - Amounts of net outcome tokens that have been sold. Negative amount means more have been bought than sold.
 * @param {number|string|BigNumber} opts.funding - The amount of funding market has
 * @param {number|string|BigNumber} opts.outcomeTokenIndex - The index of the outcome
 * @param {number|string|BigNumber} opts.outcomeTokenCount - The number of outcome tokens to buy
 * @param {number|string|BigNumber} opts.feeFactor - The fee factor. Specifying 1,000,000 corresponds to 100%, 50,000 corresponds to 5%, etc.
 * @returns {Decimal} The cost of the outcome tokens in event collateral tokens
 * @alias Gnosis.calcLMSRCost
 */
function calcLMSRCost() {
    var _normalizeWeb3Args = (0, _utils.normalizeWeb3Args)((0, _from2.default)(arguments), {
        methodName: 'calcLMSRCost',
        functionInputs: [{ name: 'netOutcomeTokensSold', type: 'int256[]' }, { name: 'funding', type: 'uint256' }, { name: 'outcomeTokenIndex', type: 'uint8' }, { name: 'outcomeTokenCount', type: 'uint256' }, { name: 'feeFactor', type: 'uint24' }],
        defaults: {
            feeFactor: 0
        }
    }),
        _normalizeWeb3Args2 = (0, _slicedToArray3.default)(_normalizeWeb3Args, 1),
        _normalizeWeb3Args2$ = (0, _slicedToArray3.default)(_normalizeWeb3Args2[0], 5),
        netOutcomeTokensSold = _normalizeWeb3Args2$[0],
        funding = _normalizeWeb3Args2$[1],
        outcomeTokenIndex = _normalizeWeb3Args2$[2],
        outcomeTokenCount = _normalizeWeb3Args2$[3],
        feeFactor = _normalizeWeb3Args2$[4];

    outcomeTokenCount = new _utils.Decimal(outcomeTokenCount.toString());

    var baseCost = void 0;

    if (funding == 0) {
        baseCost = outcomeTokenCount;
    } else {
        var b = new _utils.Decimal(funding.toString()).dividedBy(new _utils.Decimal(netOutcomeTokensSold.length).ln());
        baseCost = b.times(netOutcomeTokensSold.reduce(function (acc, numShares, i) {
            return acc.plus(new _utils.Decimal(numShares.toString()).plus(i === outcomeTokenIndex ? outcomeTokenCount : 0).dividedBy(b).exp());
        }, new _utils.Decimal(0)).ln().minus(netOutcomeTokensSold.reduce(function (acc, numShares) {
            return acc.plus(new _utils.Decimal(numShares.toString()).dividedBy(b).exp());
        }, new _utils.Decimal(0)).ln()));
    }
    return baseCost.times(new _utils.Decimal(1).plus(new _utils.Decimal(feeFactor).dividedBy(1e6))).times(1 + 1e-9).ceil(); // TODO: Standardize this 1e-9 and 1e9 in isClose of tests
    //       This is necessary because of rounding errors due to
    //       series truncation in solidity implementation.
}

/**
 * Estimates profit from selling specified number of outcome tokens to LMSR market.Unfunded markets will be handled as a special case, returning no profit.
 * @param {number[]|string[]|BigNumber[]} opts.netOutcomeTokensSold - Amounts of net outcome tokens that have been sold by the market already. Negative amount means more have been sold to the market than sold by the market.
 * @param {number|string|BigNumber} opts.funding - The amount of funding market has
 * @param {number|string|BigNumber} opts.outcomeTokenIndex - The index of the outcome
 * @param {number|string|BigNumber} opts.outcomeTokenCount - The number of outcome tokens to sell
 * @param {number|string|BigNumber} opts.feeFactor - The fee factor. Specifying 1,000,000 corresponds to 100%, 50,000 corresponds to 5%, etc.
 * @returns {Decimal} The profit from selling outcome tokens in event collateral tokens
 * @alias Gnosis.calcLMSRProfit
 */
function calcLMSRProfit() {
    var _normalizeWeb3Args3 = (0, _utils.normalizeWeb3Args)((0, _from2.default)(arguments), {
        methodName: 'calcLMSRProfit',
        functionInputs: [{ name: 'netOutcomeTokensSold', type: 'int256[]' }, { name: 'funding', type: 'uint256' }, { name: 'outcomeTokenIndex', type: 'uint8' }, { name: 'outcomeTokenCount', type: 'uint256' }, { name: 'feeFactor', type: 'uint24' }],
        defaults: {
            feeFactor: 0
        }
    }),
        _normalizeWeb3Args4 = (0, _slicedToArray3.default)(_normalizeWeb3Args3, 1),
        _normalizeWeb3Args4$ = (0, _slicedToArray3.default)(_normalizeWeb3Args4[0], 5),
        netOutcomeTokensSold = _normalizeWeb3Args4$[0],
        funding = _normalizeWeb3Args4$[1],
        outcomeTokenIndex = _normalizeWeb3Args4$[2],
        outcomeTokenCount = _normalizeWeb3Args4$[3],
        feeFactor = _normalizeWeb3Args4$[4];

    if (funding == 0) {
        return new _utils.Decimal(0);
    }

    outcomeTokenCount = new _utils.Decimal(outcomeTokenCount.toString());
    var b = new _utils.Decimal(funding.toString()).dividedBy(new _utils.Decimal(netOutcomeTokensSold.length).ln());

    return b.times(netOutcomeTokensSold.reduce(function (acc, numShares) {
        return acc.plus(new _utils.Decimal(numShares.toString()).dividedBy(b).exp());
    }, new _utils.Decimal(0)).ln().minus(netOutcomeTokensSold.reduce(function (acc, numShares, i) {
        return acc.plus(new _utils.Decimal(numShares.toString()).minus(i === outcomeTokenIndex ? outcomeTokenCount : 0).dividedBy(b).exp());
    }, new _utils.Decimal(0)).ln())).times(new _utils.Decimal(1).minus(new _utils.Decimal(feeFactor).dividedBy(1e6))).dividedBy(1 + 1e-9).floor(); // TODO: Standardize this 1e-9 and 1e9 in isClose of tests
    //       This is necessary because of rounding errors due to
    //       series truncation in solidity implementation.
}

/**
 * Estimates the number of outcome tokens which can be purchased by specified amount of collateral.
 * @param {Number[]|string[]|BigNumber[]} opts.netOutcomeTokensSold - Amounts of net outcome tokens that have been sold. Negative amount means more have been bought than sold.
 * @param {number|string|BigNumber} opts.funding - The amount of funding market has
 * @param {number|string|BigNumber} opts.outcomeTokenIndex - The index of the outcome
 * @param {number|string|BigNumber} opts.cost - The amount of collateral for buying tokens
 * @returns {Decimal} The number of outcome tokens that can be bought
 * @alias Gnosis.calcLMSROutcomeTokenCount
 */
function calcLMSROutcomeTokenCount() {
    // decimal.js making this reaaally messy :/
    var _normalizeWeb3Args5 = (0, _utils.normalizeWeb3Args)((0, _from2.default)(arguments), {
        methodName: 'calcLMSROutcomeTokenCount',
        functionInputs: [{ name: 'netOutcomeTokensSold', type: 'int256[]' }, { name: 'funding', type: 'uint256' }, { name: 'outcomeTokenIndex', type: 'uint8' }, { name: 'cost', type: 'uint256' }, { name: 'feeFactor', type: 'uint24' }],
        defaults: {
            feeFactor: 0
        }
    }),
        _normalizeWeb3Args6 = (0, _slicedToArray3.default)(_normalizeWeb3Args5, 1),
        _normalizeWeb3Args6$ = (0, _slicedToArray3.default)(_normalizeWeb3Args6[0], 5),
        netOutcomeTokensSold = _normalizeWeb3Args6$[0],
        funding = _normalizeWeb3Args6$[1],
        outcomeTokenIndex = _normalizeWeb3Args6$[2],
        cost = _normalizeWeb3Args6$[3],
        feeFactor = _normalizeWeb3Args6$[4];

    cost = new _utils.Decimal(cost.toString());
    var b = new _utils.Decimal(funding.toString()).dividedBy(new _utils.Decimal(netOutcomeTokensSold.length).ln());

    return b.times(netOutcomeTokensSold.reduce(function (acc, numShares) {
        return acc.plus(new _utils.Decimal(numShares.toString()).plus(cost.dividedBy(new _utils.Decimal(1).plus(new _utils.Decimal(feeFactor).dividedBy(1e6)))).dividedBy(b).exp());
    }, new _utils.Decimal(0)).minus(netOutcomeTokensSold.reduce(function (acc, numShares, i) {
        return i === outcomeTokenIndex ? acc : acc.plus(new _utils.Decimal(numShares.toString()).dividedBy(b).exp());
    }, new _utils.Decimal(0))).ln()).minus(netOutcomeTokensSold[outcomeTokenIndex]).floor();
}

/**
 * Estimates the marginal price of outcome token. Unfunded markets with no outcome tokens sold will be handled as a special case, returning (1 / number of outcomes sold).
 * @param {Number[]|string[]|BigNumber[]} opts.netOutcomeTokensSold - Amounts of net outcome tokens that have been sold. Negative amount means more have been bought than sold.
 * @param {number|string|BigNumber} opts.funding - The amount of funding market has
 * @param {number|string|BigNumber} opts.outcomeTokenIndex - The index of the outcome
 * @returns {Decimal} The marginal price of outcome tokens. Will differ from actual price, which varies with quantity being moved.
 * @alias Gnosis.calcLMSRMarginalPrice
 */
function calcLMSRMarginalPrice() {
    var _normalizeWeb3Args7 = (0, _utils.normalizeWeb3Args)((0, _from2.default)(arguments), {
        methodName: 'calcLMSRMarginalPrice',
        functionInputs: [{ name: 'netOutcomeTokensSold', type: 'int256[]' }, { name: 'funding', type: 'uint256' }, { name: 'outcomeTokenIndex', type: 'uint8' }]
    }),
        _normalizeWeb3Args8 = (0, _slicedToArray3.default)(_normalizeWeb3Args7, 1),
        _normalizeWeb3Args8$ = (0, _slicedToArray3.default)(_normalizeWeb3Args8[0], 3),
        netOutcomeTokensSold = _normalizeWeb3Args8$[0],
        funding = _normalizeWeb3Args8$[1],
        outcomeTokenIndex = _normalizeWeb3Args8$[2];

    if (funding == 0 && netOutcomeTokensSold.every(function (quantity) {
        return quantity == 0;
    })) {
        return new _utils.Decimal(1).div(netOutcomeTokensSold.length);
    }

    var b = (0, _utils.Decimal)(funding.valueOf()).div(_utils.Decimal.ln(netOutcomeTokensSold.length));
    var expOffset = _utils.Decimal.max.apply(_utils.Decimal, (0, _toConsumableArray3.default)(netOutcomeTokensSold)).div(b);

    return (0, _utils.Decimal)(netOutcomeTokensSold[outcomeTokenIndex].valueOf()).div(b).sub(expOffset).exp().div(netOutcomeTokensSold.reduce(function (acc, tokensSold) {
        return acc.add((0, _utils.Decimal)(tokensSold.valueOf()).div(b).sub(expOffset).exp());
    }, (0, _utils.Decimal)(0)));
}
//# sourceMappingURL=lmsr.js.map