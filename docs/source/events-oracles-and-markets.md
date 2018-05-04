### Events, Oracles and Markets

#### Questions About the Future, Oracles, and Trust

A prediction predicts the outcome of a future event. For example, the event might be "the U.S. presidential election of 2016." There may be predictions associated with each of the possible outcomes, but this event only had one of these outcome. Events like these with a discrete set of outcomes are considered to be categorical events. They may be phrased as a question with a choice of answers, e.g.:

Who will win the U.S. presidential election of 2016?
* Clinton
* Trump
* Other

To ask this question with a prediction market on Gnosis, you must first upload the event description onto IPFS via [Gnosis.publishEventDescription](api-reference.html#publishEventDescription). This will asynchronously provide you with a hash value which can be used to locate the file on IPFS:

```js
let gnosis, ipfsHash
async function createDescription () {
    gnosis = await Gnosis.create()
    ipfsHash = await gnosis.publishEventDescription({
        title: 'Who will win the U.S. presidential election of 2016?',
        description: 'Every four years, the citizens of the United States vote for their next president...',
        resolutionDate: '2016-11-08T23:00:00-05:00',
        outcomes: ['Clinton', 'Trump', 'Other'],
    })
    // now the event description has been uploaded to ipfsHash and can be used
    console.assert(
        (await gnosis.loadEventDescription(ipfsHash)).title ===
        'Who will win the U.S. presidential election of 2016?',
    )
    console.info(`Ipfs hash: https://ipfs.infura.io/api/v0/cat?stream-channels=true&arg=${ipfsHash}`)
}
createDescription()
```

Of course, future events will come to pass, and once they do, the outcome should be determinable. Oracles report on the outcome of events. The simplest oracle contract provided by Gnosis is a [`CentralizedOracle`](https://pm-contracts.readthedocs.io/en/latest/CentralizedOracle.html), and it is controlled by a single entity: the `owner` of the contract, which is a single Ethereum address, and which will from this point forward in this guide be referred to as the centralized oracle itself.

To create a centralized oracle, use [Gnosis.createCentralizedOracle](api-reference.html#createCentralizedOracle):

```js
// After obtaining an instance of Gnosis (api-reference.html#Gnosis) as "gnosis" and "ipfsHash" from Gnosis.publishEventDescription (api-reference.html#publishEventDescription)
let oracle
async function createOracle() {
    oracle = await gnosis.createCentralizedOracle(ipfsHash)
    console.info(`Oracle created with address ${oracle.address}`)
}
createOracle()
```

After `createCentralizedOracle` finishes, the owner of the CentralizedOracle contract instance created will be the message sender, or the default account for all transactions in the Gnosis instance (which is normally set to the first account exposed by the Web3 provider).

By no means is the CentralizedOracle the only possible oracle design which can be used with Gnosis. Any oracle which implements the [`Oracle`](https://github.com/gnosis/pm-contracts/blob/master/contracts/Oracles/Oracle.sol) contract interface may be used.

#### Events and Collateral

Once an oracle is created, an event contract may defer to the oracle's judgment. The [`CategoricalEvent`](https://pm-contracts.readthedocs.io/en/latest/CategoricalEvent.html) and [`ScalarEvent`](https://pm-contracts.readthedocs.io/en/latest/ScalarEvent.html) contracts represent an event. They also mint sets of outcome tokens corresponding to a collateral of an [ERC20](https://theethereum.wiki/w/index.php/ERC20_Token_Standard)-compliant token. Once the relied-on oracle reports an outcome to the event, the outcome token corresponding to the reported outcome may be exchanged for the original collateral token.

Note that ether is *not* an ERC20-compliant token at the moment of this writing. It may be converted into an ERC20-compliant variant with an adaptor contract like [EtherToken](https://pm-contracts.readthedocs.io/en/latest/EtherToken.html) though. There is a deployed instance of EtherToken available in the API as [Gnosis.etherToken](api-reference.html#Gnosis.etherToken).

In order to create a categorical event contract instance backed by an specific `oracle`, use [Gnosis.createCategoricalEvent](api-reference.html#createCategoricalEvent). For example, a categorical event with three outcomes like the earlier example can be made like this:

```js
let event
async function createCategoricalEvent() {
    event = await gnosis.createCategoricalEvent({
        collateralToken: gnosis.etherToken,
        oracle,
        // Note the outcomeCount must match the length of the outcomes array published on IPFS
        outcomeCount: 3,
    })
    console.info(`Categorical event created with address ${event.address}`)
}
createCategoricalEvent()
```

Note that EtherToken is traded with this particular event instance.

> If you are using the Rinkeby network, you can check that your event has been indexed by [pm-trading-db](https://github.com/gnosis/pm-trading-db) with the following URL:
> ```
> https://pm-trading-db.rinkeby.gnosis.pm/api/events/EVENT_ADDRESS
> ```
> Be sure to substitute in the actual event address for `EVENT_ADDRESS`

When an event has been created, users can convert their collateral into sets of outcome tokens. For example, suppose a user buys 4 ETH worth of outcome tokens from `event`:

```js
async function buyAllOutcomes() {
    const depositValue = 4e18 // 4 ether
    const txResults = await Promise.all([
        [gnosis.etherToken.constructor, await gnosis.etherToken.deposit.sendTransaction({ value: depositValue })],
        [gnosis.etherToken.constructor, await gnosis.etherToken.approve.sendTransaction(event.address, depositValue)],
        [event.constructor, await event.buyAllOutcomes.sendTransaction(depositValue)],
    ].map(([contract, txHash]) => contract.syncTransaction(txHash)))

    // Make sure everything worked
    const expectedEvents = [
        'Deposit',
        'Approval',
        'OutcomeTokenSetIssuance',
    ]
    txResults.forEach((txResult, i) => {
        Gnosis.requireEventFromTXResult(txResult, expectedEvents[i])
    })
}
buyAllOutcomes()
```

> The computation of `txResults` may appear to be fairly complex in the previous example, so here is a breakdown of that computation and why it was done that way.
>
> At first, you may think of the following code:
>
> ```js
> const txResults = [
>     await gnosis.etherToken.deposit({ value: depositValue }),
>     await gnosis.etherToken.approve(event.address, depositValue),
>     await event.buyAllOutcomes(depositValue),
> ]
> ```
>
> This code would actually be just fine, and would work in place of the above, but would provide a flawed user experience. Users would have to wait for the `deposit` and `approve` transactions to *mine* before the next transaction is even sent, and on the Ethereum mainnet, this could take 15-30s between each transaction!
>
> Then, you may propose:
>
> ```js
> const txResults = await Promise.all([
>     gnosis.etherToken.deposit({ value: depositValue }),
>     gnosis.etherToken.approve(event.address, depositValue),
>     event.buyAllOutcomes(depositValue),
> ])
> ```
>
> Indeed, all the transactions are sent to the provider and mined simultaneously, but there is no order to them. In practice, this usually means it is up to the user to sign the transactions in order: this is also a flawed user experience, as there is only one order here which makes any sense.
>
> This is why we send in the transactions like so:
>
> ```js
> const txHash = await gnosis.etherToken.deposit.sendTransaction({ value: depositValue })
> ```
>
> The `sendTransaction` variant of these Truffle methods only wait until the transaction hash is determined. Since the transaction hash is partially derived from the user's account nonce, we can ensure that the transactions are processed in order. Then, we can wait for all of the transactions we sent in to mine:
>
> ```js
> const txResults = await Promise.all([gnosis.etherToken.constructor.syncTransaction(depositTransactionHash), ...])
> ```
>
> You may notice that the constructor of the contract instance was used to call a method `syncTransaction`. That constructor is the same as the contract type abstraction, that is: `gnosis.etherToken.constructor === gnosis.contracts.EtherToken`. This is not an official method of `truffle-contract` yet! For more information, see [this pull request](https://github.com/trufflesuite/truffle-contract/pull/73).

After executing a `buyAllOutcomes` transaction as above, the user would then have `4e18` units of each [`OutcomeToken`](https://pm-contracts.readthedocs.io/en/latest/OutcomeToken.html):

```js
async function checkBalances() {
    const { Token } = gnosis.contracts
    const outcomeCount = (await event.getOutcomeCount()).valueOf()

    for(let i = 0; i < outcomeCount; i++) {
        const outcomeToken = await Token.at(await event.outcomeTokens(i))
        console.log('Have', (await outcomeToken.balanceOf(gnosis.defaultAccount)).valueOf(), 'units of outcome', i)
    }
}
checkBalances()
```

Finally, if you are the centralized oracle for an `event` contract which refers to the 2016 U.S. presidential election as set up above, you can report the outcome of the event as "Trump" and allow stakeholders to settle their claims with [Gnosis.resolveEvent](api-reference.html#resolveEvent):

```js
async function resolve() {
    await gnosis.resolveEvent({ event, outcome: 1 })
}
resolve()
```

Note that you must pass in the 0-based index of the outcome corresponding to the event description published on IPFS ("Trump" has index 1 in the example `['Clinton', 'Trump', 'Other']`),

If you are a stakeholder in this `event` contract instance, you can redeem your winnings with [`CategoricalEvent.redeemWinnings`](https://pm-contracts.readthedocs.io/en/latest/CategoricalEvent.html):

```js
async function redeem() {
    Gnosis.requireEventFromTXResult(await event.redeemWinnings(), 'WinningsRedemption')
}
redeem()
```

#### Markets and Automated Market Makers

Suppose that Alice believed Clinton would win the 2016 U.S. election, but Bob believed Trump would win that election. With the machinery we've developed thus far, both Alice and Bob would have to buy outcome tokens and then trade each other based on their beliefs. Alice would give Trump tokens to Bob in exchange for Clinton tokens. When the oracle reports that the outcome of the election was Trump, the Trump tokens held by Bob can be exchanged for the collateral used to back those tokens.

However, it may be difficult to coordinate the trade. In order to create liquidity, an automated market maker may be used to operate an on-chain market. These markets also aggregate information from participants about their beliefs about the likeliness of outcomes.

Gnosis contracts contain market and market maker contract interfaces, a [standard market implementation](https://pm-contracts.readthedocs.io/en/latest/StandardMarket.html), and an [implementation](https://pm-contracts.readthedocs.io/en/latest/LMSRMarketMaker.html) of the [logarithmic market scoring rule (LMSR)](https://mason.gmu.edu/~rhanson/mktscore.pdf), an automated market maker. This can be leveraged with the [Gnosis.createMarket](api-reference.html#createMarket) method. For example, given an `event`, you can create a [`StandardMarket`](https://pm-contracts.readthedocs.io/en/latest/StandardMarket.html) operated by the LMSR market maker with the following:

```js
let market
async function createMarket() {
    market = await gnosis.createMarket({
        event,
        marketMaker: gnosis.lmsrMarketMaker,
        fee: 50000 // signifies a 5% fee on transactions
            // see docs at Gnosis.createMarket (api-reference.html#createMarket) for more info
    })
    console.info(`Market created with address ${market.address}`)
}
createMarket()
```

Once a `market` has been created, it needs to be funded with the collateral token in order for it to provide liquidity. The market creator funds the market according to the maximum loss acceptable to them, which is possible since LMSR guarantees a bounded loss:

```js
async function fund() {
    // Fund the market with 4 ETH
    const txResults = await Promise.all([
        [gnosis.etherToken.constructor, await gnosis.etherToken.deposit.sendTransaction({ value: 4e18 })],
        [gnosis.etherToken.constructor, await gnosis.etherToken.approve.sendTransaction(market.address, 4e18)],
        [market.constructor, await market.fund.sendTransaction(4e18)],
    ].map(([contract, txHash]) => contract.syncTransaction(txHash)))

    const expectedEvents = [
        'Deposit',
        'Approval',
        'MarketFunding',
    ]
    txResults.forEach((txResult, i) => {
        Gnosis.requireEventFromTXResult(txResult, expectedEvents[i])
    })
}
fund()
```

Furthermore, the outcome tokens sold by the market are guaranteed to be backed by collateral because the ultimate source of these outcome tokens are from the event contract, which only allow buying collateral-backed sets of outcome tokens.

Let's suppose there is a `market` on the 2016 presidential election as indicated above, and that you are wondering if "Other" outcome tokens (which have index 2) are worth it at its price point. You can estimate how much it would cost to buy `1e18` units of those outcome tokens with [`LMSRMarketMaker.calcCost`](https://pm-contracts.readthedocs.io/en/latest/LMSRMarketMaker.html):

```js
async function calcCost() {
    const cost = await gnosis.lmsrMarketMaker.calcCost(market2.address, 2, 1e18)
    console.info(`Buy 1 Outcome Token with index 2 costs ${cost.valueOf()/1e18} ETH tokens`)
}
calcCost()
```

Let's say now that you've decided that these outcome tokens are worth it. pm-js contains convenience functions for buying and selling outcome tokens from a market backed by an LMSR market maker. They are [Gnosis.buyOutcomeTokens](api-reference.html#buyOutcomeTokens) and [Gnosis.sellOutcomeTokens](api-reference.html#sellOutcomeTokens). To buy these outcome tokens, you can use the following code:

```js
async function buyOutcomeTokens() {
    await gnosis.buyOutcomeTokens({
        market,
        outcomeTokenIndex: 2,
        outcomeTokenCount: 1e18,
    })
    console.info('Bought 1 Outcome Token of Outcome with index 2')
}
buyOutcomeTokens()
```

Similarly, you can see how much these outcome tokens are worth to the `market` with [`LMSRMarketMaker.calcProfit`](https://pm-contracts.readthedocs.io/en/latest/LMSRMarketMaker.html):

```js
async function calcProfit() {
    const profit = await gnosis.lmsrMarketMaker.calcProfit(market.address, 2, 1e18)
    console.info(`Sell 1 Outcome Token with index 2 gives ${profit.valueOf()/1e18} ETH tokens of profit`)
}
calcProfit()
```

If you want to sell the outcome tokens you have bought, you can do the following:

```js
async function sellOutcomeTokens() {
    await gnosis.sellOutcomeTokens({
        market,
        outcomeTokenIndex: 2,
        outcomeTokenCount: 1e18,
    })
}
sellOutcomeTokens()
```

Oftentimes prediction markets aggregate predictions into more accurate predictions. Because of this, without a fee, the investor can expect to take a loss on their investments. However, too high of a fee would discourage participation in the market. Discerning the best fee factor for markets is outside the scope of this document.

Finally, if you are the creator of a [`StandardMarket`](https://pm-contracts.readthedocs.io/en/latest/StandardMarket.html), you can close the market and obtain all of its outcome token holdings with `StandardMarket.close` and/or withdraw the trading fees paid with `StandardMarket.withdrawFees`:

```js
async function closeAndWithdraw() {
    Gnosis.requireEventFromTXResult(await market.close(), 'MarketClose')
    Gnosis.requireEventFromTXResult(await market.withdrawFees(), 'MarketFeeWithdrawal')
}
closeAndWithdraw()
```

#### Events with Scalar Outcomes

The discussion up to this point has been about an instance of an event with categorical outcomes. However, some events may be better expressed as an event with a scalar outcome. For example, you can ask the following question using [Gnosis.createScalarEvent](api-reference.html#createScalarEvent):

```js
const lowerBound = '80'
const upperBound = '100'

let ipfsHash, oracle, event

async function createScalarEvent() {
    ipfsHash = await gnosis.publishEventDescription({
        title: 'What will be the annual global land and ocean temperature anomaly for 2017?',
        description: 'The anomaly is with respect to the average temperature for the 20th century and is as reported by the National Centers for Environmental Services...',
        resolutionDate: '2017-01-01T00:00:00+00:00',
        lowerBound,
        upperBound,
        decimals: 2,
        unit: '°C',
    })

    console.info(`Ipfs hash: https://ipfs.infura.io/api/v0/cat?stream-channels=true&arg=${ipfsHash}`)

    oracle = await gnosis.createCentralizedOracle(ipfsHash)

    console.info(`Oracle created with address ${oracle.address}`)

    event = await gnosis.createScalarEvent({
        collateralToken: gnosis.etherToken,
        oracle,
        // Note that these bounds should match the values published on IPFS
        lowerBound,
        upperBound,
    })

    console.info(`Event created with address ${event.address}`)
}
createScalarEvent()
```

This sets up an event with a lower bound of 0.80°C and an upper bound of 1.00°C. Note that the values are passed in as whole integers and adjusted to the right order of magnitude according to the `decimals` property of the event description.

There are two outcome tokens associated with this event: a short token for the lower bound and a long token for the upper bound. The short tokens associated with the lower bound have index 0, as opposed to the long tokens associated with the upper bound which have index 1. In other words, other than their value at resolution, they have the same mechanics as a categorical event with two outcomes. For example, a `market` may be created for this event in the same way, and outcome tokens traded on that market may also be traded in the same way.

Now let's say that the NCES reports that the average global temperature anomaly for 2017 is 0.89°C. If you are the centralized oracle for this event as above, you can report this result to the chain like so:

```js
async function resolve() {
    await gnosis.resolveEvent({ event, outcome: '89' })
}
```

This will value each unit of the short outcome at \\(1 - {0.89 - 0.80 \over 1.00 - 0.80} = 0.55\\) units of the collateral, and the long outcome at \\(0.45\\) units of the collateral. Thus, if you held 50 units of the short outcome and 100 units of the long outcome, [`ScalarEvent.redeemWinnings`](https://pm-contracts.readthedocs.io/en/latest/ScalarEvent.html) would net you \\(\lfloor 50 \times 0.55 + 100 \times 0.45 \rfloor = 72\\) units of collateral. Hopefully you'll have paid less than that for those outcomes.
