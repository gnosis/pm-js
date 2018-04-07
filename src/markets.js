import _ from 'lodash'
import {
    normalizeWeb3Args,
    wrapWeb3Function,
    requireEventFromTXResult,
    formatCallSignature,
    TransactionError,
} from './utils'

/**
 * Creates a market.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {Contract|string} opts.event - The forwarded oracle contract or its address
 * @param {Contract|string} opts.marketMaker - The collateral token contract or its address
 * @param {number|string|BigNumber} opts.fee - The fee factor. Specifying 1,000,000 corresponds to 100%, 50,000 corresponds to 5%, etc.
 * @param {Contract|string} [opts.marketFactory=Gnosis.standardMarketFactory] - The factory contract
 * @returns {Contract} The created market contract instance. If marketFactory is `StandardMarketFactory <https://gnosis-contracts.readthedocs.io/en/latest/StandardMarketFactory.html>`_, this should be a `StandardMarket <https://gnosis-contracts.readthedocs.io/en/latest/StandardMarket.html>`_
 * @alias Gnosis#createMarket
 */
export const createMarket = wrapWeb3Function((self, opts) => {
    const callerContract = opts.marketFactory || self.standardMarketFactory
    delete opts.marketFactory

    return {
        callerContract,
        callerABI: self.contracts.StandardMarketFactory.abi,
        methodName: 'createMarket',
        eventName: 'StandardMarketCreation',
        eventArgName: 'market',
        resultContract: self.contracts.Market,
        argAliases: {
            event: 'eventContract',
        }
    }
})

const pushDescribedTransaction = async (txInfo, log, opts) => {
    const { caller, methodName, methodArgs } = opts
    let txHash
    try {
        txHash = await caller[methodName].sendTransaction(...methodArgs)
        log(`got tx hash ${txHash} for call ${
            formatCallSignature(opts)
        }`)
        txInfo.push(Object.assign({ txHash }, opts))
    } catch(subError) {
        throw new TransactionError(Object.assign({ txHash, subError }, opts))
    }
}

const syncDescribedTransactions = async (txInfo, log) =>
    (await Promise.all(
        txInfo.map(opts => opts.caller.constructor
            .syncTransaction(opts.txHash)
            .then(res => {
                log(`tx ${opts.txHash} synced`)
                return res
            })
            .catch(err =>
                new TransactionError(Object.assign({ subError: err }, opts))
            )
        )
    )).map((res, i) => requireEventFromTXResult(res, txInfo[i].requiredEventName))

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
export async function buyOutcomeTokens() {
    const [[marketAddress, outcomeTokenIndex, outcomeTokenCount], opts] =
        normalizeWeb3Args(Array.from(arguments), {
            methodName: 'buyOutcomeTokens',
            functionInputs: [
                { name: 'market', type: 'address' },
                { name: 'outcomeTokenIndex', type: 'uint8'},
                { name: 'outcomeTokenCount', type: 'uint256'},
            ]
        })

    let { approvalAmount, approvalResetAmount, limitMargin, cost, approveTxOpts, buyTxOpts } = opts || {};
    ['approvalAmount', 'approvalResetAmount', 'limitMargin', 'cost', 'approveTxOpts', 'buyTxOpts'].forEach(prop => { delete opts[prop] })
    approveTxOpts = Object.assign({}, opts, approveTxOpts)
    buyTxOpts = Object.assign({}, opts, buyTxOpts)

    const market = await this.contracts.Market.at(marketAddress)
    const collateralToken = await this.contracts.Token.at(
        await this.contracts.Event.at(
            await market.eventContract(opts)
        ).collateralToken()
    )

    if(cost == null) {
        if(limitMargin == null) {
            limitMargin = 0
        }

        const baseCost = await this.lmsrMarketMaker.calcCost(marketAddress, outcomeTokenIndex, outcomeTokenCount, opts)
        const baseCostWithFee = baseCost.add(await market.calcMarketFee(baseCost, opts))
        cost = baseCostWithFee.mul(this.web3.toBigNumber(1).add(limitMargin)).round()
    }

    if(approvalResetAmount == null) {
        approvalResetAmount = cost
    }

    const txInfo = []

    if(approvalAmount == null) {
        const buyer = opts.from || this.defaultAccount
        const marketAllowance = await collateralToken.allowance(buyer, marketAddress, opts)

        if(marketAllowance.lt(cost)) {
            await pushDescribedTransaction(txInfo, this.log, {
                caller: collateralToken,
                methodName: 'approve',
                methodArgs: [marketAddress, approvalResetAmount, approveTxOpts],
                requiredEventName: 'Approval',
            })
        }
    } else if(this.web3.toBigNumber(0).lt(approvalAmount)) {
        await pushDescribedTransaction(txInfo, this.log, {
            caller: collateralToken,
            methodName: 'approve',
            methodArgs: [marketAddress, approvalAmount, approveTxOpts],
            requiredEventName: 'Approval',
        })
    }

    await pushDescribedTransaction(txInfo, this.log, {
        caller: market,
        methodName: 'buy',
        methodArgs: [outcomeTokenIndex, outcomeTokenCount, cost, buyTxOpts],
        requiredEventName: 'OutcomeTokenPurchase',
    })

    const txRequiredEvents = await syncDescribedTransactions(txInfo, this.log)
    const purchaseEvent = txRequiredEvents[txRequiredEvents.length - 1]

    return purchaseEvent.args.outcomeTokenCost.plus(purchaseEvent.args.marketFees)
}

buyOutcomeTokens.estimateGas = async function({ using }) {
    if(using === 'stats') {
        return this.contracts.Token.gasStats.approve.averageGasUsed +
            this.contracts.Market.gasStats.buy.averageGasUsed
    }
    throw new Error(`unsupported gas estimation source ${using}`)
}


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
export async function sellOutcomeTokens() {
    const [[marketAddress, outcomeTokenIndex, outcomeTokenCount], opts] =
        normalizeWeb3Args(Array.from(arguments), {
            methodName: 'sellOutcomeTokens',
            functionInputs: [
                { name: 'market', type: 'address' },
                { name: 'outcomeTokenIndex', type: 'uint8'},
                { name: 'outcomeTokenCount', type: 'uint256'},
            ]
        })

    let { approvalAmount, approvalResetAmount, limitMargin, minProfit, approveTxOpts, sellTxOpts } = opts || {};
    ['approvalAmount', 'approvalResetAmount', 'limitMargin', 'minProfit', 'approveTxOpts', 'sellTxOpts'].forEach(prop => { delete opts[prop] })
    approveTxOpts = Object.assign({}, opts, approveTxOpts)
    sellTxOpts = Object.assign({}, opts, sellTxOpts)

    const market = await this.contracts.Market.at(marketAddress)
    const outcomeToken = await this.contracts.Token.at(
        await this.contracts.Event.at(
            await market.eventContract(opts)
        ).outcomeTokens(outcomeTokenIndex)
    )

    if(minProfit == null) {
        if(limitMargin == null) {
            limitMargin = 0
        }

        const baseProfit = await this.lmsrMarketMaker.calcProfit(marketAddress, outcomeTokenIndex, outcomeTokenCount, opts)
        const baseProfitWithFee = baseProfit.sub(await market.calcMarketFee(baseProfit, opts))
        minProfit = baseProfitWithFee.mul(this.web3.toBigNumber(1).sub(limitMargin)).round()
    }

    if(approvalResetAmount == null) {
        approvalResetAmount = outcomeTokenCount
    }

    const txInfo = []

    if(approvalAmount == null) {
        const seller = opts.from || this.defaultAccount
        const marketAllowance = await outcomeToken.allowance(seller, marketAddress, opts)

        if(marketAllowance.lt(outcomeTokenCount)) {
            await pushDescribedTransaction(txInfo, this.log, {
                caller: outcomeToken,
                methodName: 'approve',
                methodArgs: [marketAddress, approvalResetAmount, approveTxOpts],
                requiredEventName: 'Approval',
            })
        }
    } else if(this.web3.toBigNumber(0).lt(approvalAmount)) {
        await pushDescribedTransaction(txInfo, this.log, {
            caller: outcomeToken,
            methodName: 'approve',
            methodArgs: [marketAddress, approvalAmount, approveTxOpts],
            requiredEventName: 'Approval',
        })
    }

    await pushDescribedTransaction(txInfo, this.log, {
        caller: market,
        methodName: 'sell',
        methodArgs: [outcomeTokenIndex, outcomeTokenCount, minProfit, sellTxOpts],
        requiredEventName: 'OutcomeTokenSale',
    })

    const txRequiredEvents = await syncDescribedTransactions(txInfo, this.log)
    const saleEvent = txRequiredEvents[txRequiredEvents.length - 1]

    return saleEvent.args.outcomeTokenProfit.minus(saleEvent.args.marketFees)
}

sellOutcomeTokens.estimateGas = async function({ using }) {
    if(using === 'stats') {
        return this.contracts.Token.gasStats.approve.averageGasUsed +
            this.contracts.Market.gasStats.sell.averageGasUsed
    }
    throw new Error(`unsupported gas estimation source ${using}`)
}
