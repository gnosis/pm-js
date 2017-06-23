module.exports = {
    "parser": "babel-eslint",
    "extends": [
        "eslint:recommended"
    ],
    "plugins": [
        "babel"
    ],
    "env": {
        "browser": true,
        "node": true,
        "mocha": true,
        "es6": true,
    },
    "globals": {
        "web3": true
    }
}
