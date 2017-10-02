import {
    normalizeWeb3Args, wrapWeb3Function,
    requireEventFromTXResult, sendTransactionAndGetResult
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
 * @returns {Contract} The created market contract instance
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
 * @param {(number|string|BigNumber)} [opts.approvalAmount] - Amount of collateral to allow market to spend. If unsupplied or null, allowance will be set to the cost of this transaction only if necessary. If set to 0, the approval transaction will be skipped.
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

    const approvalAmount = opts && opts.approvalAmount

    const market = this.contracts.Market.at(marketAddress)
    const collateralToken = this.contracts.Token.at(
        await this.contracts.Event.at(
            await market.eventContract()
        ).collateralToken()
    )
    const baseCost = await this.lmsrMarketMaker.calcCost(marketAddress, outcomeTokenIndex, outcomeTokenCount)
    const cost = baseCost.add(await market.calcMarketFee(baseCost))

    if(approvalAmount == null) {
        const buyer = opts.from || this.defaultAccount
        const marketAllowance = await collateralToken.allowance(buyer, marketAddress)

        if(marketAllowance.lt(cost)) {
            requireEventFromTXResult(await collateralToken.approve(marketAddress, cost), 'Approval')
        }
    } else if(this.web3.toBigNumber(0).lt(approvalAmount)) {
        requireEventFromTXResult(await collateralToken.approve(marketAddress, approvalAmount), 'Approval')
    }

    const purchaseEvent = requireEventFromTXResult(
        await market.buy(outcomeTokenIndex, outcomeTokenCount, cost),
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
 * @param {(number|string|BigNumber)} [opts.approvalAmount] - Amount of outcome tokens to allow market to handle. If unsupplied or null, allowance will be set to the sale amount only if necessary. If set to 0, the approval transaction will be skipped.
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

    const approvalAmount = opts && opts.approvalAmount

    const market = this.contracts.Market.at(marketAddress)
    const outcomeToken = this.contracts.Token.at(
        await this.contracts.Event.at(
            await market.eventContract()
        ).outcomeTokens(outcomeTokenIndex)
    )
    const baseProfit = await this.lmsrMarketMaker.calcProfit(marketAddress, outcomeTokenIndex, outcomeTokenCount)
    const minProfit = baseProfit.sub(await market.calcMarketFee(baseProfit))

    if(approvalAmount == null) {
        const seller = opts.from || this.defaultAccount
        const marketAllowance = await outcomeToken.allowance(seller, marketAddress)

        if(marketAllowance.lt(outcomeTokenCount)) {
            requireEventFromTXResult(await outcomeToken.approve(marketAddress, outcomeTokenCount), 'Approval')
        }
    } else if(this.web3.toBigNumber(0).lt(approvalAmount)) {
        requireEventFromTXResult(await outcomeToken.approve(marketAddress, approvalAmount), 'Approval')
    }

    const saleEvent = requireEventFromTXResult(
        await market.sell(outcomeTokenIndex, outcomeTokenCount, minProfit),
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
