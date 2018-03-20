import assert from 'assert'
import ganache from 'ganache-cli'
import Gnosis from '../src/index'
import {
    description,
    options,
    requireRejection,
} from './test_utils'

const { requireEventFromTXResult } = Gnosis

describe('Gnosis', function () {
    this.timeout(120000)

    it('exists', () => {
        assert(Gnosis)
    })

    it('initializes with defaults', async () => {
        let gnosis = await Gnosis.create()
        assert(gnosis)
    })

    it('initializes with options', async () => {
        let gnosis = await Gnosis.create({
            ethereum: 'http://localhost:8545',
            ipfs: '',
            gnosisdb: 'https:/db.gnosis.pm',
            defaultAccount: '0x61315aec47febe497554a2a0f3a3e7ef287d052f',
        })
        assert(gnosis)
        assert.equal(gnosis.defaultAccount, '0x61315aec47febe497554a2a0f3a3e7ef287d052f')
    })

    it('initializes with a provider', async () => {
        let gnosis = await Gnosis.create({
            ethereum: ganache.provider(),
        })
        assert(gnosis)
    })

    it('initializes with a provider that has a mangled name', async () => {
        class Mangled extends ganache.provider().constructor {}

        const provider = new Mangled()
        assert(provider.constructor.name === 'Mangled')

        let gnosis = await Gnosis.create({
            ethereum: provider,
        })
        assert(gnosis)
    })

    it('initializes with contracts containing gas stats', async () => {
        let gnosis = await Gnosis.create()
        assert(gnosis.contracts)
        assert(gnosis.contracts.CentralizedOracle.gasStats)
        assert(Object.keys(gnosis.contracts.CentralizedOracle.gasStats)
            .every((k) => gnosis.contracts.CentralizedOracle.abi
                .find(({ type, name }) => type === 'function' && name === k)))
        assert(gnosis.standardMarketFactory.gasStats)
    })

    it('initializes on the mainnet with an etherToken instance that points to the maker WETH', async () => {
        let gnosis = await Gnosis.create({
            ethereum: ganache.provider({ network_id: 1 }),
        })
        assert(gnosis.etherToken)
        assert.equal(gnosis.etherToken.address, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
    })

    it('initializes on Rinkeby with Olympia related contracts', async () => {
        let gnosis = await Gnosis.create({
            ethereum: ganache.provider({ network_id: 4 }),
        })
        assert.equal(gnosis.olympiaToken.address, '0xa0c107db0e9194c18359d3265289239453b56cf2')
        assert.equal(gnosis.olympiaAddressRegistry.address, '0x79da1c9ef6bf6bc64e66f8abffddc1a093e50f13')
    })

    it('reports more informative error messages and logs messages', async () => {
        const logs = []

        const gnosis = await Gnosis.create({
            logger: (s) => { logs.push(s) },
        })

        const netOutcomeTokensSold = [0, 0]
        const feeFactor = 5000 // 0.5%
        const participants = gnosis.web3.eth.accounts.slice(0, 4)

        const ipfsHash = await gnosis.publishEventDescription(description)

        assert.equal(logs.length, 1)
        assert(/\b\w{46}\b/.test(logs[0]), 'no IPFS hash found in log message ' + logs[0])

        const oracle = await gnosis.createCentralizedOracle(ipfsHash)

        assert.equal(logs.length, 3)
        assert(/\b0x[a-f0-9]{64}\b/i.test(logs[1]), 'no transaction hash found in log message ' + logs[1])
        assert(logs[2].indexOf(oracle.address) !== -1, 'oracle address not found in log message ' + logs[2])

        let errorString = (await requireRejection(gnosis.createCategoricalEvent({
            collateralToken: gnosis.etherToken,
            oracle,
            outcomeCount: 1, // < wrong outcomeCount
        }))).toString()

        assert(
            errorString.indexOf('EventFactory') !== -1 &&
            errorString.indexOf('createCategoricalEvent') !== -1 &&
            errorString.indexOf(gnosis.etherToken.address) !== -1 &&
            errorString.indexOf(oracle.address) !== -1 &&
            /\b1\b/.test(errorString),
            'could not find call info in error message'
        )

        // ^ depending on whether we're running geth or ganache, the above might have generated 0 or 1 logs
        assert(logs.length === 3 || logs.length === 4)
        logs.length = 3

        const event = await gnosis.createCategoricalEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: netOutcomeTokensSold.length
        })

        assert.equal(logs.length, 5)
        assert(/\b0x[a-f0-9]{64}\b/i.test(logs[3]), 'no transaction hash found in log message ' + logs[3])
        assert(logs[4].indexOf(event.address) !== -1, 'event address not found in log message ' + logs[4])

        const market = await gnosis.createMarket({
            event: event,
            marketMaker: gnosis.lmsrMarketMaker,
            fee: feeFactor, // 0%
        })

        assert.equal(logs.length, 7)
        assert(/\b0x[a-f0-9]{64}\b/i.test(logs[5]), 'no transaction hash found in log message ' + logs[5])
        assert(logs[6].indexOf(market.address) !== -1, 'market address not found in log message ' + logs[6])

        requireEventFromTXResult(await gnosis.etherToken.deposit({ value: 8e18 }), 'Deposit')

        const funding = 1e18
        requireEventFromTXResult(await gnosis.etherToken.approve(market.address, funding), 'Approval')
        requireEventFromTXResult(await market.fund(funding), 'MarketFunding')

        errorString = (await requireRejection(gnosis.buyOutcomeTokens({
            market, outcomeTokenIndex: 0, outcomeTokenCount: 1e18, cost: 1
        }))).toString()

        assert(
            errorString.indexOf('Market') !== -1 &&
            errorString.indexOf('buy') !== -1 &&
            /\b0\b/.test(errorString),
            `could not find call info in error message ${errorString}`
        )

        // ^ depending on whether we're running geth or ganache, the above might have generated 1 to 3 logs
        // the approve should go through, but a transaction hash may or may not be generated for the buy
        // also there is a race condition on the all promise which may or may not let a log through for the approve
        assert(logs.length >= 8 || logs.length <= 10)
        logs.length = 7

        await gnosis.buyOutcomeTokens({
            market, outcomeTokenIndex: 0, outcomeTokenCount: 1e18
        })

        assert.equal(logs.length, 11)
        for(let i = 7; i < 11; ++i)
            assert(/\b0x[a-f0-9]{64}\b/i.test(logs[i]), 'no transaction hash found in log message ' + logs[i])

        // same deal for selling

        errorString = (await requireRejection(gnosis.sellOutcomeTokens({
            market, outcomeTokenIndex: 0, outcomeTokenCount: 1, minProfit: gnosis.web3.toBigNumber(2).pow(256).sub(1)
        }))).toString()

        assert(
            errorString.indexOf('Market') !== -1 &&
            errorString.indexOf('sell') !== -1 &&
            /\b0\b/.test(errorString),
            `could not find call info in error message ${errorString}`
        )

        // ^ depending on whether we're running geth or ganache, the above might have generated 1 to 3 logs
        assert(logs.length >= 12 && logs.length <= 14)
        logs.length = 11

        await gnosis.sellOutcomeTokens({
            market, outcomeTokenIndex: 0, outcomeTokenCount: 1e18
        })

        assert.equal(logs.length, 15)
        for(let i = 11; i < 15; ++i)
            assert(/\b0x[a-f0-9]{64}\b/i.test(logs[i]), 'no transaction hash found in log message ' + logs[i])
    })

    it('supports custom options to be passed to provider', async () => {
        let gnosis = await Gnosis.create(options)

        const txParamObjects = []
        const _sendAsync = gnosis.web3.currentProvider.sendAsync
        gnosis.web3.currentProvider.sendAsync = function() {
            const rpcMessage = arguments[0]
            if(rpcMessage.method === 'eth_sendTransaction') {
                txParamObjects.push(rpcMessage.params[0])
            }
            return _sendAsync.apply(this, arguments)
        }

        let ipfsHash = await gnosis.publishEventDescription(description)

        let centralizedOracleFactory = await gnosis.contracts.CentralizedOracleFactory.deployed()
        let oracle = await gnosis.createCentralizedOracle(ipfsHash)
        let event = await gnosis.createCategoricalEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: 2,
        })
        let market = await gnosis.createMarket({
            event,
            marketMaker: gnosis.lmsrMarketMaker,
            marketFactory: gnosis.standardMarketFactory,
            fee: 5000,
        })
        assert.equal(txParamObjects[txParamObjects.length - 1].event, undefined)
        assert.equal(txParamObjects[txParamObjects.length - 1].marketFactory, undefined)

        requireEventFromTXResult(await gnosis.etherToken.deposit({ value: 2e18 }), 'Deposit')

        requireEventFromTXResult(await gnosis.etherToken.approve(market.address, 1e18), 'Approval')
        requireEventFromTXResult(await market.fund(1e18), 'MarketFunding')

        const numOutcomeTokens = await gnosis.buyOutcomeTokens({
            market,
            outcomeTokenIndex: 0,
            outcomeTokenCount: 1e18,
            custom: 'foo',
            customApproveOverloaded: 'bar',
            customBuyOverloaded: 'baz',
            approveTxOpts: {
                customApproveOverloaded: 'overbarred'
            },
            buyTxOpts: {
                customBuyOverloaded: 'overbazzed'
            },
        })

        let approveTxParamObj = txParamObjects[txParamObjects.length - 2]
        const buyTxParamObj = txParamObjects[txParamObjects.length - 1]

        assert.equal(approveTxParamObj.custom, 'foo')
        assert.equal(approveTxParamObj.approveTxOpts, undefined)
        assert.equal(approveTxParamObj.buyTxOpts, undefined)
        assert.equal(approveTxParamObj.customApproveOverloaded, 'overbarred')
        assert.equal(buyTxParamObj.custom, 'foo')
        assert.equal(buyTxParamObj.approveTxOpts, undefined)
        assert.equal(buyTxParamObj.buyTxOpts, undefined)
        assert.equal(buyTxParamObj.customBuyOverloaded, 'overbazzed')

        await gnosis.sellOutcomeTokens({
            market,
            outcomeTokenIndex: 0,
            outcomeTokenCount: numOutcomeTokens,
            custom2: 'foo',
            custom2ApproveOverloaded: 'bar',
            custom2BuyOverloaded: 'baz',
            approveTxOpts: {
                custom2ApproveOverloaded: 'overbarred'
            },
            sellTxOpts: {
                custom2BuyOverloaded: 'overbazzed'
            },
        })

        approveTxParamObj = txParamObjects[txParamObjects.length - 2]
        const sellTxParamObj = txParamObjects[txParamObjects.length - 1]

        assert.equal(approveTxParamObj.custom2, 'foo')
        assert.equal(approveTxParamObj.approveTxOpts, undefined)
        assert.equal(approveTxParamObj.sellTxOpts, undefined)
        assert.equal(approveTxParamObj.custom2ApproveOverloaded, 'overbarred')
        assert.equal(sellTxParamObj.custom2, 'foo')
        assert.equal(sellTxParamObj.approveTxOpts, undefined)
        assert.equal(sellTxParamObj.sellTxOpts, undefined)
        assert.equal(sellTxParamObj.custom2BuyOverloaded, 'overbazzed')
    })
})
