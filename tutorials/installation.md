### Setting up a project using npm

1. Create a project directory, open a terminal or command line, and change directory into the project directory.

2. Use `npm init` to set up your project.

3. Install `gnosis.js` into your project as a dependency using:
   
       npm install --save @gnosis.pm/gnosisjs
   
   Be sure to issue this command with this exact spelling.

   This command installs the Gnosis JavaScript library and its dependencies into the `node_modules` directory. The [`@gnosis.pm/gnosisjs`](https://www.npmjs.com/package/@gnosis.pm/gnosisjs) package contains the following:

   * ES6 source of the library in `src` which can also be found on the [repository](https://github.com/gnosis/gnosis.js)
   * Compiled versions of the modules which can be run on Node.js in the `dist` directory
   * Webpacked standalone `gnosis[.min].js` files ready for use by web clients in the `dist` directory
   * API documentation in the `docs` directory

### Node "server-side" setup

Notice that the library refers to the `dist/index` module as the `package.json` main. This is because even though Node.js does support many new JavaScript features, it natively does not support the use of ES6 imports yet (see [this issue](https://github.com/nodejs/help/issues/53)), so the modules are transpiled with [Babel](https://babeljs.io/) for Node interoperability.

In the project directory, you can experiment with the Gnosis API by opening up a `node` shell and importing the library like so:

```js
const Gnosis = require('@gnosis.pm/gnosisjs')
```

This will import the transpiled library through the `dist/index` entry point, which exports the {@link Gnosis} class.

### Browser use

The `gnosis.js` file and its minified version `gnosis.min.js` are self-contained and can be used directly in a webpage. For example, you may copy `gnosis.min.js` into a folder or onto your server, and in an HTML page, use the following code to import the library:

```html
<script src="gnosis.min.js"></script>
<script>
// Gnosis should be available as a global after the above script import, so this subsequent script tag can make use of the API.
</script>
```

After opening the page, the browser console can also be used to experiment with the API.

### Integration with webpack projects (advanced)

The ES6 source can also be used directly with webpack projects. Please refer to the Babel transpilation settings in [`.babelrc`](https://github.com/gnosis/gnosis.js/blob/master/.babelrc) and the webpack configuration in [`webpack.config.js`](https://github.com/gnosis/gnosis.js/blob/master/webpack.config.js) to see what may be involved.
