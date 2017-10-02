The Gnosis.js library is encapsulated inside of the {@link Gnosis} class. In order for it to function, it must be connected to an Ethereum network through a [Web3.js](https://github.com/ethereum/wiki/wiki/JavaScript-API) interface. It also uses [IPFS](https://ipfs.io/) for publishing and retrieving event data, and so it will also have to be connected to an IPFS node. Configuration of these connections can be done with a call to the asynchronous factory function {@link Gnosis.create}. For example, the following code will store an instance of the Gnosis.js library into the variable `gnosis`:

```js
let gnosis

Gnosis.create().then(result => {
    gnosis = result
    // gnosis is available here and may be used
})

// note that gnosis is NOT guaranteed to be initialized outside the callback scope here
```

Because of the library's dependence on remote service providers and the necessity to wait for transactions to complete on the blockchain, the majority of the methods in the API are asynchronous and return thenables in the form of [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises).

Gnosis.js also relies on [Truffle contract abstractions](https://github.com/trufflesuite/truffle-contract). In fact, much of the underlying core contract functionality can be accessed in Gnosis.js as one of these abstractions. Since the Truffle contract wrapper has to perform asynchronous actions such as wait on the result of a remote request to an Ethereum RPC node, it also uses thenables. For example, here is how to use the on-chain Gnosis [Math](https://gnosis.github.io/gnosis-contracts/docs/Math/) library exposed at {@link Gnosis#contracts} to print the approximate natural log of a number:

```js
const ONE = Math.pow(2, 64)
Gnosis.create()
    .then(gnosis => gnosis.contracts.Math.deployed())
    .then(math => math.ln(3 * ONE))
    .then(result => console.log('Math.ln(3) =', result.valueOf() / ONE))
```

Although it is not strictly necessary, usage of [`async/await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) syntax is encouraged for simplifying the use of thenable programming, especially in complex flow scenarios. To increase the readability of code examples from this point forward, this guide will assume `async/await` is available and snippets execute in the context of an [`async function`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). With those assumptions, the previous example can be expressed like so:

```js
const ONE = Math.pow(2, 64)
const gnosis = await Gnosis.create()
const math = await gnosis.contracts.Math.deployed()
console.log('Math.ln(3) =', (await math.ln(3 * ONE)).valueOf() / ONE)
```

Gnosis.js also exposes a number of convenience methods wrapping contract operations such as {@link Gnosis#createCentralizedOracle} and {@link Gnosis#createScalarEvent}.

### Questions About the Future, Oracles, and Trust

A prediction predicts the outcome of a future event. For example, the event might be "the U.S. presidential election of 2016." There may be predictions associated with each of the possible outcomes, but this event only had one of these outcome. Events like these with a discrete set of outcomes are considered to be categorical events. They may be phrased as a question with a choice of answers, e.g.:

Who will win the U.S. presidential election of 2016?
* Clinton
* Trump
* Other

To ask this question with a prediction market on Gnosis, you must first upload the event description onto IPFS via {@link Gnosis#publishEventDescription}. This will asynchronously provide you with a hash value which can be used to locate the file on IPFS:

```js
const gnosis = await Gnosis.create()
const ipfsHash = await gnosis.publishEventDescription({
    title: 'Who will win the U.S. presidential election of 2016?',
    description: 'Every four years, the citizens of the United States vote for their next president...',
    resolutionDate: '2016-11-08T23:00:00-05:00',
    outcomes: ['Clinton', 'Trump', 'Other'],
})
// now the event description has been uploaded to ipfsHash and can be used
assert.equal(
    (await gnosis.loadEventDescription(ipfsHash)).title,
    'Who will win the U.S. presidential election of 2016?'
)
```

Of course, future events will come to pass, and once they do, the outcome should be determinable. Oracles report on the outcome of events. The simplest oracle contract provided by Gnosis is a [`CentralizedOracle`](https://gnosis.github.io/gnosis-contracts/docs/CentralizedOracle/), and it is controlled by a single entity: the `owner` of the contract, which is a single Ethereum address, and which will from this point forward in this guide be referred to as the centralized oracle itself.

To create a centralized oracle, use {@link Gnosis#createCentralizedOracle}:

```js
// After obtaining an instance of {@link Gnosis} as "gnosis" and "ipfsHash" from {@link Gnosis#publishEventDescription}
const oracle = await gnosis.createCentralizedOracle(ipfsHash)
```

After `createCentralizedOracle` finishes, the owner of the CentralizedOracle contract instance created will be the message sender, or the default account for all transactions in the Gnosis instance (which is normally set to the first account exposed by the Web3 provider).

By no means is the CentralizedOracle the only possible oracle design which can be used with Gnosis. Any oracle which implements the [`Oracle`](https://github.com/gnosis/gnosis-contracts/blob/master/contracts/Oracles/Oracle.sol) contract interface may be used.

### Events and Collateral

Once an oracle is created, an event contract may defer to the oracle's judgment. The [`CategoricalEvent`](https://gnosis.github.io/gnosis-contracts/docs/CategoricalEvent/) and [`ScalarEvent`](https://gnosis.github.io/gnosis-contracts/docs/ScalarEvent/) contracts represent an event. They also mint sets of outcome tokens corresponding to a collateral of an [ERC20](https://theethereum.wiki/w/index.php/ERC20_Token_Standard)-compliant token. Once the relied-on oracle reports an outcome to the event, the outcome token corresponding to the reported outcome may be exchanged for the original collateral token.

Note that ether is *not* an ERC20-compliant token at the moment of this writing. It may be converted into an ERC20-compliant variant with an adaptor contract like [EtherToken](https://gnosis.github.io/gnosis-contracts/docs/EtherToken/) though. There is a deployed instance of EtherToken available in the API as {@link Gnosis#etherToken}.

In order to create a categorical event contract instance backed by an specific `oracle`, use {@link Gnosis#createCategoricalEvent}. For example, a categorical event with three outcomes like the earlier example can be made like this:

```js
const event = await gnosis.createCategoricalEvent({
    collateralToken: gnosis.etherToken,
    oracle,
    outcomeCount: 3,
})
```

Note that EtherToken is traded with this particular event instance.

When an event has been created, users can convert their collateral into sets of outcome tokens. For example, suppose a user buys 4 ETH worth of outcome tokens from `event`:

```js
await Promise.all([
    gnosis.etherToken.deposit({ value: 4e18 }),
    gnosis.etherToken.approve(event.address, 4e18),
    event.buyAllOutcomes(4e18),
])
```

That user would then have `4e18` units of each [`OutcomeToken`](https://gnosis.github.io/gnosis-contracts/docs/OutcomeToken/):

```js
const { Token } = gnosis.contracts
const outcomeCount = (await event.getOutcomeCount()).valueOf()

for(let i = 0; i < outcomeCount; i++) {
    const outcomeToken = Token.at(await event.outcomeTokens(i))
    console.log('Have', (await outcomeToken.balanceOf(gnosis.defaultAccount)).valueOf(), 'units of outcome', i)
}
```

Finally, if you are the centralized oracle for an `event` contract which refers to the 2016 U.S. presidential election as set up above, you can report the outcome of the event as "Trump" and allow stakeholders to settle their claims with {@link Gnosis#resolveEvent}:

```js
await gnosis.resolveEvent({ event, outcome: 1 })
```

Note that you must pass in the 0-based index of the outcome corresponding to the event description published on IPFS ("Trump" has index 1 in the example `['Clinton', 'Trump', 'Other']`),

If you are a stakeholder in this `event` contract instance, you can redeem your winnings with [`CategoricalEvent.redeemWinnings`](https://gnosis.github.io/gnosis-contracts/docs/CategoricalEvent/):

```js
await event.redeemWinnings()
```

### Markets and Automated Market Makers

Suppose that Alice believed Clinton would win the 2016 U.S. election, but Bob believed Trump would win that election. With the machinery we've developed thus far, both Alice and Bob would have to buy outcome tokens and then trade each other based on their beliefs. Alice would give Trump tokens to Bob in exchange for Clinton tokens. When the oracle reports that the outcome of the election was Trump, the Trump tokens held by Bob can be exchanged for the collateral used to back those tokens.

However, it may be difficult to coordinate the trade. In order to create liquidity, an automated market maker may be used to operate an on-chain market. These markets also aggregate information from participants about their beliefs about the likeliness of outcomes.

Gnosis contracts contain market and market maker contract interfaces, a [standard market implementation](https://gnosis.github.io/gnosis-contracts/docs/StandardMarket/), and an [implementation](https://gnosis.github.io/gnosis-contracts/docs/LMSRMarketMaker/) of the [logarithmic market scoring rule (LMSR)](http://mason.gmu.edu/~rhanson/mktscore.pdf), an automated market maker. This can be leveraged with the {@link Gnosis#createMarket} method. For example, given an `event`, you can create a `StandardMarket` which uses the LMSR market maker with the following:

```js
await gnosis.createMarket({
    event,
    marketMaker: gnosis.lmsrMarketMaker,
    50000, // signifies a 5% fee on transactions
           // see docs for {@link Gnosis#createMarket} for more info
})
```
