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

### Events, Oracles, and Trust

A prediction predicts the outcome of a future event. For example, the event might be "the U.S. presidential election of 2016." There may be predictions associated with each of the possible outcomes, but this event only had one of these outcome. Events like these with a discrete set of outcomes are considered to be "categorical events." They may be phrased as a question with a choice of answers, e.g.:

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

After calling that, the owner of the CentralizedOracle contract instance created will be the message sender, or the default account for all transactions in the Gnosis instance (which is normally set to the first account exposed by the Web3 provider).
