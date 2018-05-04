# pm-js Library

[![Logo](https://raw.githubusercontent.com/gnosis/pm-js/master/assets/logo.png)](https://gnosis.pm/)

[![Build Status](https://travis-ci.org/gnosis/pm-js.svg?branch=master)](https://travis-ci.org/gnosis/pm-js)

[![Slack Status](https://slack.gnosis.pm/badge.svg)](https://slack.gnosis.pm)

## Getting Started

See the [documentation](https://pm-js.readthedocs.io/en/latest/).

## Really quick start

1. Get [Ganache-cli](https://github.com/trufflesuite/ganache-cli)
   ```
   npm install -g ganache-cli
   ```
2. Run this:
   ```
   ganache-cli -d -i 437894314312
   ```
3. Clone [pm-contracts](https://github.com/gnosis/pm-contracts), cd in there, and migrate the contracts onto the Ganache-cli instance with:
   ```
   cd path/to/pm-contracts
   npm install
   npm run migrate
   ```
4. Download [`pm.js`](https://raw.githubusercontent.com/gnosis/pm-js/master/dist/pm.js) and put it in an HTML file:
   ```
   <script src=pm.js></script>
   ```
5. Follow some tutorials:
   * [API Overview](https://pm-js.readthedocs.io/en/latest/api-overview.html)
   * [Events, Oracles, and Markets](https://pm-js.readthedocs.io/en/latest/events-oracles-and-markets.html)
