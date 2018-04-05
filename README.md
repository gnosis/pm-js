# Gnosis.js Library

[![Logo](https://raw.githubusercontent.com/gnosis/gnosis.js/master/assets/logo.png)](https://gnosis.pm/)

[![Build Status](https://travis-ci.org/gnosis/gnosis.js.svg?branch=master)](https://travis-ci.org/gnosis/gnosis.js)

[![Slack Status](https://slack.gnosis.pm/badge.svg)](https://slack.gnosis.pm)

## Getting Started

See the [documentation](https://gnosisjs.readthedocs.io/en/latest/).

## Really quick start

1. Get [Ganache-cli](https://github.com/trufflesuite/ganache-cli)
   ```
   npm install -g ganache-cli
   ```
2. Run this:
   ```
   ganache-cli -d -i 437894314312
   ```
3. Clone [Gnosis contracts](https://github.com/gnosis/gnosis-contracts), cd in there, and migrate the contracts onto the Ganache-cli instance with:
   ```
   cd path/to/gnosis-contracts
   npm install
   npm run migrate
   ```
4. Download [`gnosis.js`](https://raw.githubusercontent.com/gnosis/gnosis.js/master/dist/gnosis.js) and put it in an HTML file:
   ```
   <script src=gnosis.js></script>
   ```
5. Follow some tutorials:
   * [API Overview](https://gnosisjs.readthedocs.io/en/latest/api-overview.html)
   * [Events, Oracles, and Markets](https://gnosisjs.readthedocs.io/en/latest/events-oracles-and-markets.html)
