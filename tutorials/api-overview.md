The Gnosis.js library is encapsulated inside of the {@link Gnosis} class. In order for it to function, it must be connected to an Ethereum network through a [Web3.js](https://github.com/ethereum/wiki/wiki/JavaScript-API) interface. It also uses [IPFS](https://ipfs.io/) for publishing and retrieving event data, and so it will also have to be connected to an IPFS node. Configuration of these connections can be done with a call to the asynchronous factory function {@link Gnosis.create}. For example, the following code will store an instance of the Gnosis.js library into the variable `gnosis`:

```js
let gnosis

Gnosis.create().then((result) => {
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
    .then(result => console.log('Math.ln(3) returned', result.valueOf() / ONE))
```

Although it is not strictly necessary, usage of [`async/await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) syntax is encouraged for simplifying the use of thenable programming, especially in complex flow scenarios.
