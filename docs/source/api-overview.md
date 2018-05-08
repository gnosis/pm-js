# API Overview

The pm-js library is encapsulated inside of the [Gnosis](api-reference.html#Gnosis) class. In order for it to function, it must be connected to an Ethereum network through a [Web3.js](https://github.com/ethereum/wiki/wiki/JavaScript-API) interface. It also uses [IPFS](https://ipfs.io/) for publishing and retrieving event data, and so it will also have to be connected to an IPFS node. Configuration of these connections can be done with a call to the asynchronous factory function [Gnosis.create](api-reference.html#Gnosis.create). For example, the following code will store an instance of the pm-js library into the variable `gnosis`:

```javascript
let gnosis

Gnosis.create().then(result => {
    gnosis = result
    // gnosis is available here and may be used
})

// note that gnosis is NOT guaranteed to be initialized outside the callback scope here
```

### Note about Promises

Because of the library's dependence on remote service providers and the necessity to wait for transactions to complete on the blockchain, the majority of the methods in the API are asynchronous and return thenables in the form of [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises).

## Truffle contract abstractions

pm-js also relies on [Truffle contract abstractions](https://github.com/trufflesuite/truffle-contract). In fact, much of the underlying core contract functionality can be accessed in pm-js as one of these abstractions. Since the Truffle contract wrapper has to perform asynchronous actions such as wait on the result of a remote request to an Ethereum RPC node, it also uses thenables. For example, here is how to use the on-chain Gnosis [Math](https://gnosis-pm-contracts.readthedocs.io/en/latest/Math.html) library exposed at [Gnosis.contracts](api-reference.html#Gnosis.contracts) to print the approximate natural log of a number:

```javascript
const ONE = Math.pow(2, 64)
Gnosis.create()
    .then(gnosis => gnosis.contracts.Math.deployed())
    .then(math => math.ln(3 * ONE))
    .then(result => console.log('Math.ln(3) =', result.valueOf() / ONE))
```

### Note about `async` and `await`

Although it is not strictly necessary, usage of [`async/await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) syntax is encouraged for simplifying the use of thenable programming, especially in complex flow scenarios. To increase the readability of code examples from this point forward, this guide will assume `async/await` is available and snippets execute in the context of an [`async function`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). With those assumptions, the previous example can be expressed in an `async` context like so:

```javascript
const ONE = Math.pow(2, 64)
const gnosis = await Gnosis.create()
const math = await gnosis.contracts.Math.deployed()
console.log('Math.ln(3) =', (await math.ln(3 * ONE)).valueOf() / ONE)
```

## Wrapping common operations

pm-js also exposes a number of convenience methods wrapping contract operations such as [Gnosis.createCentralizedOracle](api-reference.html#createCentralizedOracle) and [Gnosis.createScalarEvent](api-reference.html#createScalarEvent).

### Web3 options

The methods on the API can be provided with `from`, `to`, `value`, `gas`, and `gasPrice` options which get passed down to the `web3.js` layer. For example:

```javascript
await gnosis.createCentralizedOracle({
    ipfsHash: 'Qm...',
    gasPrice: 20e9, // 20 GWei
})
```

### Gas estimations

Many of the methods on the gnosis API also have an asynchronous `estimateGas` property which you can use, while allowing you to specify the gas estimation source. For example:

```javascript
// using the estimateGas RPC
await gnosis.createCentralizedOracle.estimateGas(ipfsHash, { using: 'rpc' }))

// using stats derived from pm-contracts
await gnosis.createCentralizedOracle.estimateGas({ using: 'stats' }))
```

The gas stats derived from `pm-contracts` and used by the `estimateGas` functions when using stats are also added to the contract abstractions in the following property:

```javascript
// examples of objects with gas stats for each function derived from pm-contracts test suite
gnosis.contracts.CentralizedOracle.gasStats
gnosis.contracts.ScalarEvent.gasStats
```

## (Advanced) Notes for developers who use `web3`

If you would like to continue using `web3` directly, one option is to skip this repo and use the [core contracts](https://github.com/gnosis/pm-contracts) directly. The NPM package `@gnosis.pm/pm-contracts` contains Truffle build artifacts as `build/contracts/*.json`, and those in turn contain contract ABIs, as well as existing deployment locations for various networks. The usage at this level looks something like this:

```javascript
const Web3 = require('web3')
const CategoricalEventArtifact = require('@gnosis.pm/pm-contracts/build/contracts/CategoricalEvent.json')

const web3 = new Web3(/* whatever your web3 setup is here... */)

const eventWeb3Contract = web3.eth.contract(CategoricalEventArtifact.abi, '0x0bf128753dB586f742eaAda502301ea86a7561e6')
```

Truffle build artifacts are compatible with [`truffle-contract`](https://github.com/trufflesuite/truffle-contract), which wraps [`web3.eth.contract`](https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethcontract) functionality and provides additional features. If you'd like to take advantage of these features without pm-js, you may use `truffle-contract` in the following way:

```javascript
const Web3 = require('web3')
const contract = require('truffle-contract')

// unlike the last setup, we don't need web3, just 
const provider = new Web3.providers.HttpProvider('https://ropsten.infura.io') // or whatever provider you'd like

const CategoricalEventArtifact = require('@gnosis.pm/pm-contracts/build/contracts/CategoricalEvent.json')
const CategoricalEvent = contract(CategoricalEventArtifact) // pass in the artifact directly here instead
const CategoricalEvent.setProvider(provider)

// this is asynchronous because this is how truffle-contract recommends you use .at
// since in the asynchronous version, truffle-contract will actually check to make sure that
// the bytecode at the address matches the bytecode specified in the artifact
const eventTruffleContract = await CategoricalEvent.at('0x0bf128753dB586f742eaAda502301ea86a7561e6')
```

With pm-js, you may accomplish the above with:

```javascript
const gnosis = await Gnosis.create({ ethereum: web3.currentProvider })
const event = await gnosis.contracts.CategoricalEvent.at('0x0bf128753dB586f742eaAda502301ea86a7561e6')
// and then for example
console.log(await event.isOutcomeSet())
```
