import _ from 'lodash'

export async function createCentralizedOracle() {
    let newHash = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
    let factory = await this.contracts.CentralizedOracleFactory.deployed()
    let result = await factory.createCentralizedOracle(newHash)
    return await this.contracts.CentralizedOracle.at(result.logs[0].args.centralizedOracle)
}

export async function createUltimateOracle(opts) {
    const argNames = [
        'forwardedOracle',
        'collateralToken',
        'spreadMultiplier',
        'challengePeriod',
        'challengeAmount',
        'frontRunnerPeriod'
    ]

    opts = opts || {}

    let args = argNames.map((argName) => {
        if(!_.has(opts, argName)) {
            throw new Error(`missing argument ${argName}`)
        }
        let arg = opts[argName]
        if(_.has(arg, 'address')) {
            arg = arg.address
        }
        return arg
    })

    let factory = await this.contracts.UltimateOracleFactory.deployed()
    let result = await factory.createUltimateOracle(...args)
    return await this.contracts.UltimateOracle.at(result.logs[0].args.ultimateOracle)
}
