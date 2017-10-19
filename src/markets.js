import _ from 'lodash'
import {
    normalizeWeb3Args,
    wrapWeb3Function,
    requireEventFromTXResult,
} from './utils'

/**
 * Creates a market.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @function
 * @param {(Contract|string)} opts.event - The forwarded oracle contract or its address
 * @param {(Contract|string)} opts.marketMaker - The collateral token contract or its address
 * @param {(number|string|BigNumber)} opts.fee - The fee factor. Specifying 1,000,000 corresponds to 100%, 50,000 corresponds to 5%, etc.
 * @param {(Contract|string)} [opts.marketFactory={@link Gnosis#standardMarketFactory}] - The factory contract
 * @returns {Contract} The created market contract instance. If marketFactory is [StandardMarketFactory](https://gnosis.github.io/gnosis-contracts/docs/StandardMarketFactory/), this should be a [StandardMarket](https://gnosis.github.io/gnosis-contracts/docs/StandardMarket/)
 * @alias Gnosis#createMarket
 */
export const createMarket = wrapWeb3Function((self, opts) => ({
    callerContract: opts.marketFactory || self.standardMarketFactory,
    callerABI: self.contracts.StandardMarketFactory.abi,
    methodName: 'createMarket',
    eventName: 'StandardMarketCreation',
    eventArgName: 'market',
    resultContract: self.contracts.Market,
    argAliases: {
        event: 'eventContract',
    }
}))

/**
 * Buys outcome tokens. If you have ether and plan on transacting with a market on an event which
 * uses EtherToken as collateral, be sure to convert the ether into EtherToken by sending ether to
 * the deposit() method of the contract. For other ERC20 collateral tokens, follow the token's
 * acquisition process defined by the token's contract.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {(Contract|string)} opts.market - The market to buy tokens from
 * @param {(number|string|BigNumber)} opts.outcomeTokenIndex - The index of the outcome
 * @param {(number|string|BigNumber)} opts.outcomeTokenCount - Number of outcome tokens to buy
 * @param {(number|string|BigNumber)} [opts.approvalAmount] - Amount of collateral to allow market to spend. If unsupplied or null, allowance will be reset to the `approvalResetAmount` only if necessary. If set to 0, the approval transaction will be skipped.
 * @param {(number|string|BigNumber)} [opts.approvalResetAmount] - Set to this amount when resetting market collateral allowance. If unsupplied or null, will be the cost of this transaction.
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

    const txOpts = _.pick(opts, ['from', 'to', 'value', 'gas', 'gasPrice'])

    let { approvalAmount, approvalResetAmount } = opts || {}

    const market = this.contracts.Market.at(marketAddress)
    const collateralToken = this.contracts.Token.at(
        await this.contracts.Event.at(
            await market.eventContract(txOpts)
        ).collateralToken()
    )
    const baseCost = await this.lmsrMarketMaker.calcCost(marketAddress, outcomeTokenIndex, outcomeTokenCount, txOpts)
    const cost = baseCost.add(await market.calcMarketFee(baseCost, txOpts))

    if(approvalResetAmount == null) {
        approvalResetAmount = cost
    }

    if(approvalAmount == null) {
        const buyer = txOpts.from || this.defaultAccount
        const marketAllowance = await collateralToken.allowance(buyer, marketAddress, txOpts)

        if(marketAllowance.lt(cost)) {
            requireEventFromTXResult(await collateralToken.approve(marketAddress, approvalResetAmount, txOpts), 'Approval')
        }
    } else if(this.web3.toBigNumber(0).lt(approvalAmount)) {
        requireEventFromTXResult(await collateralToken.approve(marketAddress, approvalAmount, txOpts), 'Approval')
    }

    const purchaseEvent = requireEventFromTXResult(
        await market.buy(outcomeTokenIndex, outcomeTokenCount, cost, txOpts),
        'OutcomeTokenPurchase'
    )

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
 * @param {(Contract|string)} opts.market - The market to sell tokens to
 * @param {(number|string|BigNumber)} opts.outcomeTokenIndex - The index of the outcome
 * @param {(number|string|BigNumber)} opts.outcomeTokenCount - Number of outcome tokens to sell
 * @param {(number|string|BigNumber)} [opts.approvalAmount] - Amount of outcome tokens to allow market to handle. If unsupplied or null, allowance will be reset to the `approvalResetAmount` only if necessary. If set to 0, the approval transaction will be skipped.
 * @param {(number|string|BigNumber)} [opts.approvalResetAmount] - Set to this amount when resetting market outcome token allowance. If unsupplied or null, will be the sale amount specified by `outcomeTokenCount`.
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

    const txOpts = _.pick(opts, ['from', 'to', 'value', 'gas', 'gasPrice'])

    let { approvalAmount, approvalResetAmount } = opts || {}

    const market = this.contracts.Market.at(marketAddress)
    const outcomeToken = this.contracts.Token.at(
        await this.contracts.Event.at(
            await market.eventContract(txOpts)
        ).outcomeTokens(outcomeTokenIndex)
    )
    const baseProfit = await this.lmsrMarketMaker.calcProfit(marketAddress, outcomeTokenIndex, outcomeTokenCount, txOpts)
    const minProfit = baseProfit.sub(await market.calcMarketFee(baseProfit, txOpts))

    if(approvalResetAmount == null) {
        approvalResetAmount = outcomeTokenCount
    }

    if(approvalAmount == null) {
        const seller = txOpts.from || this.defaultAccount
        const marketAllowance = await outcomeToken.allowance(seller, marketAddress, txOpts)

        if(marketAllowance.lt(outcomeTokenCount)) {
            requireEventFromTXResult(await outcomeToken.approve(marketAddress, approvalResetAmount, txOpts), 'Approval')
        }
    } else if(this.web3.toBigNumber(0).lt(approvalAmount)) {
        requireEventFromTXResult(await outcomeToken.approve(marketAddress, approvalAmount, txOpts), 'Approval')
    }

    const saleEvent = requireEventFromTXResult(
        await market.sell(outcomeTokenIndex, outcomeTokenCount, minProfit, txOpts),
        'OutcomeTokenSale'
    )
    return saleEvent.args.outcomeTokenProfit.minus(saleEvent.args.marketFees)
}

sellOutcomeTokens.estimateGas = async function({ using }) {
    if(using === 'stats') {
        return this.contracts.Token.gasStats.approve.averageGasUsed +
            this.contracts.Market.gasStats.sell.averageGasUsed
    }
    throw new Error(`unsupported gas estimation source ${using}`)
}
