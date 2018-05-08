# Installation

## Setting up a project using npm

1. Create a project directory, open a terminal or command line, and change directory into the project directory.

2. Use `npm init` to set up your project.

3. Install [`pm-contracts`](https://github.com/gnosis/pm-contracts) and `pm-js` into your project as a dependency using:
   
       npm install --save '@gnosis.pm/pm-contracts' '@gnosis.pm/pm-js'
   
   Be sure to issue this command with this exact spelling. The quotes are there in case you use [Powershell](https://stackoverflow.com/a/5571703/1796894).

   This command installs the Gnosis core contracts and the Gnosis JavaScript library, and their dependencies into the `node_modules` directory. The [`@gnosis.pm/pm-js`](https://www.npmjs.com/package/@gnosis.pm/pm-js) package contains the following:

   * ES6 source of the library in `src` which can also be found on the [repository](https://github.com/gnosis/pm-js)
   * Compiled versions of the modules which can be run on Node.js in the `dist` directory
   * Webpacked standalone `gnosis-pm[.min].js` files ready for use by web clients in the `dist` directory
   * API documentation in the `docs` directory


Notice that the library refers to the `dist/index` module as the `package.json` main. This is because even though Node.js does support many new JavaScript features, ES6 import support is still very much in development yet (watch [this page](https://nodejs.org/api/esm.html#esm_ecmascript_modules)), so the modules are transpiled with [Babel](https://babeljs.io/) for Node interoperability.

In the project directory, you can experiment with the Gnosis API by opening up a `node` shell and importing the library like so:

```js
const Gnosis = require('@gnosis.pm/pm-js')
```

This will import the transpiled library through the `dist/index` entry point, which exports the [Gnosis](api-reference.html#Gnosis) class.

If you are playing around with pm-js directly in its project folder, you can import it from dist

```js
const Gnosis = require('.')
```

## Browser use

The `gnosis-pm.js` file and its minified version `gnosis-pm.min.js` are self-contained and can be used directly in a webpage. For example, you may copy `gnosis-pm.min.js` into a folder or onto your server, and in an HTML page, use the following code to import the library:

```html
<script src="gnosis-pm.min.js"></script>
<script>
// Gnosis should be available as a global after the above script import, so this subsequent script tag can make use of the API.
</script>
```

After opening the page, the browser console can also be used to experiment with the API.

## Integration with webpack projects (advanced)

The ES6 source can also be used directly with webpack projects. Please refer to the Babel transpilation settings in [`.babelrc`](https://github.com/gnosis/pm-js/blob/master/.babelrc) and the webpack configuration in [`webpack.config.js`](https://github.com/gnosis/pm-js/blob/master/webpack.config.js) to see what may be involved.

## Setting up an Ethereum JSON RPC

After setting up the pm-js library, you will still need a connection to an [Ethereum JSON RPC](https://github.com/ethereum/wiki/wiki/JSON-RPC) provider. Without this connection, the following error occurs when trying to use the API to perform actions with the smart contracts:

```
Error: Invalid JSON RPC response: ""
```

pm-js refers to Truffle contract build artifacts found in `node_modules/@gnosis.pm/pm-contracts/build/contracts/`, which contain a registry of where key contracts are deployed given a network ID. By default Gnosis contract suite is already deployed on the Ropsten, Kovan, and Rinkeby testnets.

### Ganache-cli and private chain providers

[Ganache-cli](https://github.com/trufflesuite/ganache-cli) is a JSON RPC provider which is designed to ease developing Ethereum dapps. It can be used in tandem with pm-js as well, but its use requires some setup. Since Ganache-cli randomly generates a network ID and begins the Ethereum VM in a blank state, the contract suite would need to be deployed, and the deployed contract addresses recorded in the build artifacts before use with Ganache-cli. This can be done by running the migration script in the core contracts package directory.

```sh
(cd node_modules/\@gnosis.pm/pm-contracts/ && truffle migrate)
```

This will deploy the contracts onto the chain and will record the deployed addresses in the contract build artifacts. This will make the API available to pm-js applications which use the transpiled *modules* in `dist` (typically Node.js apps), as these modules refer directly to the build artifacts in the `@gnosis.pm/pm-contracts` package. However, for browser applications which use the standalone library file `gnosis-pm[.min].js`, that file has to be rebuilt to incorporate the new deployment addresses info.

### MetaMask

[MetaMask](https://metamask.io/) is a Chrome browser plugin which injects an instrumented instance of Web3.js into the page. It comes preloaded with connections to the Ethereum mainnet as well as the Ropsten, Kovan, and Rinkeby testnets through [Infura](https://infura.io/). pm-js works out-of-the-box with MetaMask configured to connect to these testnets. Make sure your web page is being [served over HTTP/HTTPS](https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md) and uses the standalone library file.
