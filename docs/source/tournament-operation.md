# Tournament Operation

Towards the end of 2017, Gnosis hosted a prediction market tournament called [Olympia](https://blog.gnosis.pm/announcing-gnosis-olympia-5fb7e16dd259). It combined [GnosisDB](https://github.com/gnosis/gnosisdb), the [core smart contracts](https://github.com/gnosis/gnosis-contracts), and the Gnosis JS library in the context of a [user interface](https://github.com/gnosis/gnosis-management) we've been developing (we've also created a [separate repository](https://github.com/gnosis/olympia-interface) for the interface used in the original tournament run, but the work done there is slated to be refactored into a feature flag for the generic interface).

This tutorial will detail the configuration and operation of such a tournament. In addition to the requirements listed in the introduction of the developer guide, you will also probably want to use [Git](https://git-scm.com/), and you will need to have [Docker](https://docs.docker.com/install/) and [Docker Compose](https://docs.docker.com/compose/install/) installed for [GnosisDB](https://github.com/gnosis/gnosisdb).

## Smart Contracts

First, you will want to deploy contracts necessary for the tournament. These contracts can be found in the [`olympia-token`](https://github.com/gnosis/olympia-token) repository. It will likely be the case that you will want to fork this repository in order to tweak it for your own purposes, so hit that fork button. After forking it, clone your fork and open the folder in a terminal:

```sh
# this is the SSH version; feel free to use HTTPS if you prefer
git clone git@github.com:your-github-handle/olympia-token.git
cd olympia-token
```

You may choose instead to not fork the directory and just clone the original repo, or to forgo Git and just download the repository as a ZIP or tarball; the rest of this guide should still work regardless.

Have NPM install the dependencies for the repository:

```sh
npm i
```

### Token Contracts

After the dependencies have been installed, take a look at the [OlympiaToken contract](https://github.com/gnosis/olympia-token/blob/master/contracts/OlympiaToken.sol). You will see that this contract is more or less functionally equivalent to the [PlayToken contract](https://github.com/gnosis/olympia-token/blob/master/contracts/PlayToken.sol), except that the optional [ERC20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) fields `name`, `symbol`, and `decimals` have also been specified.

Let's turn our attention now to the [PlayToken contract](https://github.com/gnosis/olympia-token/blob/master/contracts/PlayToken.sol). Beyond the bare minimum necessary to implement the ERC20 interface sanely, this contract also implements two other mechanics: issuing new tokens to addresses, and determining a whitelist for token transfers.

The ability to issue new tokens to addresses, or minting tokens, is restricted to the creator of the contract instance. This action can be performed with a call to the `issue` function, which takes an array of recipient addresses and credits them a newly minted amount of token. The token issuance may, for example, be tied into a registration process for the tournament.

The creator of the contract instance is also required to set up a whitelist for token transfers. This prevents arbitrary transfers of token value from one account to another. PlayTokens can be transferred only to or from the whitelisted addresses. You may use this mechanic to ensure that users can only trade on authorized markets in the tournament.

Due to the mechanics above, it is crucial for the integrity of the tournament that the private key used to deploy the token contract is guarded carefully, and that actions taken by the contract creator do not undermine the faith of the tournament players.

You may implement other token mechanics as you see fit, but that is beyond the scope of this document. 

If you do not wish to change the token mechanics, but you do wish to change the name and symbol of the token used by your tournament, then you may do so by renaming and modifying the [OlympiaToken contract](https://github.com/gnosis/olympia-token/blob/master/contracts/OlympiaToken.sol) accordingly. For example:

```sol
pragma solidity 0.4.15;

import "./PlayToken.sol";

contract BigToken is PlayToken {
    /*
     *  Constants
     */
    string public constant name = "Big Token";
    string public constant symbol = "BIG";
    uint8 public constant decimals = 18;
}
```

Make sure that everything compiles fine by running `npm run compile`.

After changing the name, you will also want to change the deployment script `migrations/2_deploy_contracts.js` to reflect the new token which is being deployed:

```js
const Math = artifacts.require('Math')
const BigToken = artifacts.require('BigToken')

module.exports = function(deployer) {
    deployer.deploy(Math)
    deployer.link(Math, BigToken)
    deployer.deploy(BigToken)
}
```

You may also consider changing the test suite in `test/olympia.js` so the test suite continues to pass:

```diff
diff --git a/test/olympia.js b/test/olympia.js
index 7ae4d15..2c33ff4 100644
--- a/test/olympia.js
+++ b/test/olympia.js
@@ -6,7 +6,7 @@ const _ = require('lodash')
 const { wait } = require('@digix/tempo')(web3);
 
 const MathLib = artifacts.require('Math')
-const OlympiaToken = artifacts.require('OlympiaToken')
+const BigToken = artifacts.require('BigToken')
 const PlayToken = artifacts.require('PlayToken')
 PlayToken.link(MathLib)
 const AddressRegistry = artifacts.require('AddressRegistry')
@@ -26,17 +26,17 @@ async function throwUnlessRejects(q) {
 
 const getBlock = util.promisify(web3.eth.getBlock.bind(web3.eth))
 
-contract('OlympiaToken', function(accounts) {
-    let olympiaToken
+contract('BigToken', function(accounts) {
+    let bigToken
 
     before(async () => {
-        olympiaToken = await OlympiaToken.deployed()
+        bigToken = await BigToken.deployed()
     })
 
     it('should have the right name, symbol, and decimals', async () => {
-        assert.equal(await olympiaToken.name(), 'Olympia Token')
-        assert.equal(await olympiaToken.symbol(), 'OLY')
-        assert.equal(await olympiaToken.decimals(), 18)
+        assert.equal(await bigToken.name(), 'Big Token')
+        assert.equal(await bigToken.symbol(), 'BIG')
+        assert.equal(await bigToken.decimals(), 18)
     })
 })
 
```

Run the test suite with `npm t`.

### Deployment to a Public Network

The original Olympia was conducted primarily on the [Rinkeby test network](https://www.rinkeby.io/), but the Gnosis core contracts are deployed on the other major testnets such as the Kovan and Ropsten networks. Since the other components of the stack are network-agnostic, we can deploy to any testnet we choose. For the purpose of this guide, we will be using Rinkeby, but the following discussion applies to any other network.

In the root directory of the `olympia-token` repository, create a new file called `truffle-local.js`. Note that this file is listed in `.gitignore` and `.npmignore`, meaning that this file will not be published by NPM, and this file will not be included in source control. Confirm that Git does not see this file:

```
$ git status
On branch master
Your branch is up to date with 'origin/master'.

nothing to commit, working tree clean
```

Recall the previous discussion about how the private key used to deploy the token contract should be guarded carefully and keep this requirement in mind for the next few steps.

[`truffle-hdwallet-provider`](https://github.com/trufflesuite/truffle-hdwallet-provider) should be installed locally in this repository as a result of the previous invocation of `npm i`. This allows one to use a 12-word BIP39 mnemonic to derive a keypair and its associated Ethereum address for use on the network.

Need one on the fly? One trick to get one is to run Ganache CLI for a moment and quit it with Ctrl+C:

```
$ ./node_modules/.bin/ganache-cli # I am running the local copy here, but you can use a global instance if you have one
Ganache CLI v6.0.3 (ganache-core: 2.0.2)

Available Accounts
==================
(0) 0xae2e104a271b96bee7fe31a7b687ddf48d120356
(1) 0x0e9d59b93a926c69e27c1077922c5e7209ad394b
(2) 0xf7f92f008fc87904187848f974bf0098c12c47fe
(3) 0x3214ad4c80c811b70bc1b353629db600af9fb2d4
(4) 0xb88c372207ee6c9327172af708ab39a9245a8039
(5) 0xbb647223aeca95fe1136fc9f48d49f71362fe448
(6) 0xe4052566e33bdbc4ec064849c7f0e0261256af9f
(7) 0x8c21c0d69a6abfcea2622808fc531cdba35055cc
(8) 0xd37b370fd6d587e8e55291b3ad10356e0e65a68e
(9) 0x16bb5d6be20591cd195aa8f2a095ec0487097dcc

Private Keys
==================
(0) 9aa38d11d23c7b940a7b2e0c58062a523790544b7cfb9263dff29afa019b92cd
(1) 6e88319718d77b2f68bfd5f1c188e46376b570b183c38e6768404b92d8b996eb
(2) 93b082f3270e81f135b8e61a8a38d0a6169e3a03131ebe01f4f81ef65b3a2aa7
(3) deae1e8979887b63695e859314512b6ce5860fe6711ea336f0fe5d78daa2e6be
(4) df86e8b58835d5cf89c63b0a9a53b2daa2a7935b40aacaddf460741e62214948
(5) 1ee2d31adad0e339897fe8d7cd4a40114897d23695e9ad9bd524f7838bc79318
(6) eb354ca869dcbc18bfffe07a2ed2ed0729037f1fd6f70e13e5d304b499fe9215
(7) 462d24f7e3bba9bd0359de079d520acd60e292b3d79003294b90dc7322b82157
(8) f9bac61df108a401dc43962c2b4bc57cfab78967e75715f1730662c425c9f08d
(9) 1e46ba6f2a2f59a588546de65372c9de89771934ec20927b26d47027c6089e4f

HD Wallet
==================
Mnemonic:      romance spirit scissors guard buddy rough cabin paddle cricket cactus clock buddy
Base HD Path:  m/44'/60'/0'/0/{account_index}

Listening on localhost:8545
```

Take note of the list of addresses and the mnemonic, which in this instance is `romance spirit scissors guard buddy rough cabin paddle cricket cactus clock buddy`.

Go ahead and put the following in `truffle-local.js`:

```js
const HDWalletProvider = require('truffle-hdwallet-provider')

const mnemonic = 'romance spirit scissors guard buddy rough cabin paddle cricket cactus clock buddy'
const infuraAccessKey = ''
const accountIndex = 7

module.exports = {
    networks: {
        rinkeby: {
            provider: new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/${ infuraAccessKey }`, accountIndex)
        }
    }
}
```

The account used for the deployment will be associated with the `mnemonic` and the `accountIndex` specified above (note that this index is 7 in this example). Therefore, the address which does the deployment will be `0x8c21c0d69a6abfcea2622808fc531cdba35055cc`.

Also note that we will, for the purposes of this tutorial, be relying on the infrastructure provided by [INFURA](https://infura.io). You may sign up and get an INFURA access key for free if you'd like.

Run `npm run compile` to check that there aren't any basic scripting errors that have been introduced while writing `truffle-local.js`. Then run `npm run migrate -- --network rinkeby` to deploy the contracts using the scripts in the `migrations` folder.

Assuming you haven't funded your account with test ether yet, you will probably get an error like the following:

```text
> truffle migrate "--network" "rinkeby"

Using network 'rinkeby'.

Running migration: 1_initial_migration.js
  Deploying Migrations...
Error encountered, bailing. Network state unknown. Review successful transactions manually.
insufficient funds for gas * price + value
```

If you're following along with this guide, go ahead and [get some Rinkeby test ether](https://www.rinkeby.io/#faucet) for your account. Then try running `npm run migrate -- --network rinkeby` again. This will take a couple of minutes.

If you see something like the following in your terminal:

```text
> truffle migrate "--network" "rinkeby"

Using network 'rinkeby'.

Running migration: 1_initial_migration.js
  Deploying Migrations...
  ... 0x039e0454560f81b6373233e84e5dc5a4e6351277a85cc8767ddfb5f88cd5c3d8
  Migrations: 0x4822ea9c767071bab1f89cbeaf82d667d6bbc0c4
Saving successful migration to network...
  ... 0x1f7e4d2dbf3eed09d3a177f58dd17c5d08f0a069ab94428e0105191231f50958
Saving artifacts...
Running migration: 2_deploy_contracts.js
  Deploying Math...
  ... 0xe7c54c4f717b9af2c55ab776c2c39ba8ec330802a63156986f4a52add272f02f
  Math: 0x42384e04beb1d2946c416f96bbd2e9f4fb4684b2
  Linking Math to BigToken
  Deploying BigToken...
  ... 0x06230721f6f061c1c08ab35aa111c4a87a5a47f3d40ca957f87b570abf400d96
  BigToken: 0xff730e9a89f39fe662c63086c986edae696f61b9
Saving successful migration to network...
  ... 0xf04ef84a08ad3f5e2c4b32c9789a61fc3ec68309f264df77d340b8472be1fcf5
Saving artifacts...
Running migration: 3_deploy_address_registry.js
  Deploying AddressRegistry...
  ... 0x2971a6e9f611b5cae5b7c0687402156b044993af8f1be58789b05999a5ade910
  AddressRegistry: 0xb36e4d8b39c2bf89ba4b76bf2a952656c40fdf1f
Saving successful migration to network...
  ... 0xbc552bee40c0db8ff0cd81008180a91e9138742c0ce1caa4ee5ba37da1b511b5
Saving artifacts...
```

then everything went well, and your contracts are now deployed on Rinkeby!

### Preserving Deployment Information in Published Packages

After running the migration, Truffle places the deployed addresses inside of the build artifacts located in `build/contracts`. These build artifacts are JSON files which, when converted to a plain JS object and passed as an argument to [`truffle-contract`](https://github.com/trufflesuite/truffle-contract), yields a Truffle contract abstraction which may be used in decentralized application clients.

The deployment execution in the last section resulted in a unique set of addresses which must be distributed to clients, so how do we preserve this deployment information? For example, you may have noticed that `BigToken` was deployed onto Rinkeby at the address [`0xff7...`](https://rinkeby.etherscan.io/address/0xff730e9a89f39fe662c63086c986edae696f61b9). You may run `npm run networks` to see a list of the most recent deployment locations:

```text
> truffle networks


Network: rinkeby (id: 4)
  AddressRegistry: 0xb36e4d8b39c2bf89ba4b76bf2a952656c40fdf1f
  BigToken: 0xff730e9a89f39fe662c63086c986edae696f61b9
  Math: 0x42384e04beb1d2946c416f96bbd2e9f4fb4684b2
  Migrations: 0x4822ea9c767071bab1f89cbeaf82d667d6bbc0c4
```

You may also verify that the `networks` key in the build artifacts contains (and in fact is the source of) this information. In fact, if Rinkeby is the only network displayed as a result of your running the migration, you're ready to publish your contract deployment information. However, for the sake of completeness, let's migrate the contracts onto a different chain.

In a different terminal tab, run `./node_modules/.bin/ganache-cli` (or `ganache-cli` if you have it globally, `testrpc`, or full [`ganache`](http://truffleframework.com/ganache/) would probably work too). Then, switch back and run `npm run migrate`. Note that this runs on the default chain, which is just whatever is on `localhost:8545`. After the migration completes, check `npm run networks` again:

```text
> truffle networks


The following networks are configured to match any network id ('*'):

    development

Closely inspect the deployed networks below, and use `truffle networks --clean` to remove any networks that don't match your configuration. You should not use the wildcard configuration ('*') for staging and production networks for which you intend to deploy your application.

Network: UNKNOWN (id: 1521428953603)
  AddressRegistry: 0xf25881f8491edc65b276d0584d34a28574fe0873
  BigToken: 0x8da9a75d1ff8bcd3940579e5aed39825967ab0ff
  Math: 0xd87d9ae40266066934e136036869512e393a507b
  Migrations: 0xbcc888cd0ec7ce6947e13d6a587090580186de5c

Network: rinkeby (id: 4)
  AddressRegistry: 0xb36e4d8b39c2bf89ba4b76bf2a952656c40fdf1f
  BigToken: 0xff730e9a89f39fe662c63086c986edae696f61b9
  Math: 0x42384e04beb1d2946c416f96bbd2e9f4fb4684b2
  Migrations: 0x4822ea9c767071bab1f89cbeaf82d667d6bbc0c4
```

Your build artifacts have grown to contain deployment info for the migration done against the test chain. Of course, in the context of package publication, this is unnecessary bloat. In order to follow the advice displayed, we can use `npm run networks -- --clean`. The extra `--` allows us to pass the `--clean` option down to the underlying `truffle networks` call.

After running the networks script with the clean option, `npm run networks` reports that we only have Rinkeby information in the build artifacts again.

You may notice that the `build` folder is also ignored by Git since it is listed in the `.gitignore` file. However, this folder is *not* ignored by NPM because of an `.npmignore` file which does not list the `build` folder. This means that distributions of this repo on NPM will also contain the `build` folder, but the `build` folder will not be checked into source control.

However, while compilation results may not belong in source control, this information about deployment addresses *should* be checked in. In order to achieve this, we can use a script included with `olympia-token` to extract this information from the build artifacts into a file which sits outside of the Git ignore list:

```sh
npm run extractnetinfo
```

Running this command will create or overwrite `networks.json` with all of the network information contained in the build artifacts. This is the file which should be checked into version control. Once we have this, build artifacts containing the deployment information for the Rinkeby network can be restored from plain build artifacts:

```sh
npm run injectnetinfo
```

Furthermore, if there are future deployments which clutter or overwrite existing deployment information, the build artifacts can still be reset to this point:

```sh
npm run resetnetinfo
```

Note that `resetnetinfo` is invoked as part of `prepublishOnly` to ensure that build artifacts published on NPM contain just the deployment information required for dapp clients.

### Tying a Bow and Shipping It

First, let's make sure that the package is, well, a complete package. Open up a Node shell and try to import this package by `require`-ing the directory:

```sh
$ node
> require('.')
Error: Cannot find module './build/contracts/OlympiaToken.json'
    at Function.Module._resolveFilename (module.js:555:15)
    at Function.Module._load (module.js:482:25)
    at Module.require (module.js:604:17)
    at require (internal/module.js:11:18)
    at module.exports.reduce (/path/to/olympia-token/index.js:6:28)
    at Array.reduce (<anonymous>)
> 
```

You may get an error as shown above if you renamed `OlympiaToken`. Note that `package.json` refers the `index.js` file as the `main` entry point for this package, which is why the file showed up in the stack trace. It seems that the source file expects to find the `OlympiaToken.json` build artifact, but since `OlympiaToken` was renamed to `BigToken`, it really should be trying to grab `BigToken.json`. Let's change `index.js` to do that now:

```js
module.exports = [
    'AddressRegistry',
    'BigToken',
    'PlayToken',
    'RewardClaimHandler'
].reduce((o, n) => (o[n] = require(`./build/contracts/${ n }.json`), o), {})
```

With that out of the way (or if you originally left things named the way they were), you should see something like the following:

```sh
$ node
> require('.')
{ AddressRegistry: 
   { contract_name: 'AddressRegistry',
     abi: [ [Object], [Object], [Object] ],
     unlinked_binary: '0x6060...',
     ...,
   }, ... }
```

Basically, what you get from importing the package is an object containing build artifacts for the four contracts listed in `index.js`. Those build artifacts may be, for example, used with `truffle-contract` to furnish a client with the ability to interact with the contracts you've deployed onto the blockchain.

Go ahead, edit the `package.json` to your liking, give it a test spin with `npm i`, and then ship it:

```text
$ npm publish

> big-token@1.2.1 prepublishOnly .
> truffle compile && truffle networks --clean && node scripts/inject_network_info.js

+ big-token@1.2.1
```

(By the way, `big-token` is taken, so find your own name ;)

## GnosisDB

Ethereum blockchain providers expose a common interface for querying, but to query blockchain providers directly for tournament-related info would be much too slow. That's why we've developed [GnosisDB](https://github.com/gnosis/gnosisdb), which syncs up with and queries a blockchain provider directly, filtering related data into an indexed database which provides great boosts in speed when querying the database.

Let's follow along with the GnosisDB setup instructions. First, ensure that [Docker](https://docs.docker.com/install/) and [Docker Compose](https://docs.docker.com/compose/install/) are installed.

Then, make sure you're not inside of a repository directory, clone GnosisDB, and `cd` into the newly cloned repo:

```sh
cd .. # assuming you're still in the olympia-token directory you created previously
git clone git@github.com:gnosis/gnosisdb.git
cd gnosisdb
```

Then, have Docker build the container images.

```sh
docker-compose build --force-rm
```

You may see the following error:

```text
$ docker-compose build --force-rm
Building ipfs
ERROR: Couldn't connect to Docker daemon at http+docker://localunixsocket - is it running?

If it's at a non-standard location, specify the URL with the DOCKER_HOST environment variable.
```

If so, it may be that your current user does not have permission to connect to the Docker daemon. If that's the case, consider [this answer](https://askubuntu.com/questions/477551/how-can-i-use-docker-without-sudo#477554), or run `docker-compose` with `sudo`.

If the build succeeds, we next want to configure the web container instance by adding a superuser so that we have admin access to the database:

```sh
docker-compose run web bash
```

This makes us the root user of a shell inside of the web container:

```text
root@e7f35cc2dc18:/gnosisdb# 
```

Using that shell, we migrate the database schema and create a superuser:

```sh
python manage.py migrate
python manage.py createsuperuser
```

Now, `exit` the web container shell and spin up all the GnosisDB Docker images:

```sh
docker-compose up
```

## Setting Up the Interface

WIP
