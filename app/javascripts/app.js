// Import the page's CSS. Webpack will know what to do with it.
import '../stylesheets/app.css'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import MathArtifacts from '../../build/contracts/Math.json'
import MetacoinArtifacts from '../../build/contracts/MetaCoin.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
let Math = contract(MathArtifacts)
let MetaCoin = contract(MetacoinArtifacts)

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
let accounts
let account

window.App = {
  start: function () {
    var self = this

    // Bootstrap the MetaCoin abstraction for Use.
    MetaCoin.setProvider(web3.currentProvider)
    Math.setProvider(web3.currentProvider)

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        alert('There was an error fetching your accounts.')
        return
      }

      if (accs.length === 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.")
        return
      }

      accounts = accs
      account = accounts[0]

      self.refreshBalance()
    })
  },

  setStatus: function (message) {
    var status = document.getElementById('status')
    status.innerHTML = message
  },

  refreshBalance: async function () {
    try {
      let meta = await MetaCoin.deployed()
      let math = await Math.deployed()
      let value = await meta.getBalance.call(account, { from: account })
      let balanceElement = document.getElementById('balance')
      balanceElement.innerHTML = value.valueOf()
    } catch (e) {
      console.log(e)
      this.setStatus('Error getting balance; see log.')
    };
  },

  sendCoin: async function () {
    let amount = parseInt(document.getElementById('amount').value)
    let receiver = document.getElementById('receiver').value

    this.setStatus('Initiating transaction... (please wait)')

    try {
      let meta = await MetaCoin.deployed()
      await meta.sendCoin(receiver, amount, { from: account })

      this.setStatus('Transaction complete!')
      this.refreshBalance()
    } catch (e) {
      console.log(e)
      this.setStatus('Error sending coin; see log.')
    }
  }
}

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // eslint-disable-next-line max-len
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider)
  } else {
    // eslint-disable-next-line max-len
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
  }

  window.App.start()
})

