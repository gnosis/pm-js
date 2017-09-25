# Developer Guide

## Getting Started

### Prerequisites

In order to follow this guide, you will need to be comfortable working in your OS's shell, writing JavaScript, and working with [npm](https://www.npmjs.com/). A working knowledge of [Ethereum](https://www.ethereum.org/), [Solidity](https://github.com/ethereum/solidity), and [Truffle](http://truffleframework.com/) would greatly ease the use of this library, but is not strictly necessary for getting started. The usage of a VCS such as [Git](https://git-scm.com/) is also encouraged, but is not explained here.

### Setting up a project using npm

1. Create a project directory, open a terminal or command line, and change directory into the project directory.

2. Use `npm init` to set up your project.

3. Install `gnosis.js` into your project as a dependency using:
   
       npm install --save @gnosis.pm/gnosisjs
   
   Be sure to issue this command with the exact spelling.

   This command installs the Gnosis JavaScript library and its dependencies into the `node_modules` directory. The `@gnosis.pm/gnosisjs` package contains the ES6 source of the library in `src` which can also be found on the [repository](https://github.com/gnosis/gnosis.js), compiled versions of the modules which can be run on Node.js as well as webpacked standalone `gnosis[.min].js` files ready for use by web clients in the `dist` directory, and API documentation in `docs` directory.

### Node "server-side" setup

Notice that the library refers to the `dist/index` module as the `package.json` main. This is because Node.js natively does not support the use of ES6 imports yet (see [this issue](https://github.com/nodejs/help/issues/53)), so the modules are transpiled with [Babel](https://babeljs.io/).

In the project directory, you can experiment with the Gnosis API by opening up a `node` shell and importing the library like so:

```js
const Gnosis = require('@gnosis.pm/gnosisjs')
```

