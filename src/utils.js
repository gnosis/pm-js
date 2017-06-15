import _ from 'lodash'

export function getTruffleArgsFromOptions(argNames, opts) {
    opts = opts || {}

    return argNames.map((argName) => {
        if(!_.has(opts, argName)) {
            throw new Error(`missing argument ${argName}`)
        }
        let arg = opts[argName]
        if(_.has(arg, 'address')) {
            arg = arg.address
        }
        return arg
    })
}

export async function sendTransactionAndGetResult(opts) {
    opts = opts || {}
    let factory = await opts.factoryContract.deployed()
    let result = await factory[opts.methodName](...opts.methodArgs)

    let matchingLog = _.filter(result.logs, (l) => l.event === opts.eventName)
    if(matchingLog.length < 1) {
        throw new Error(`could not find any logs in result ${result} corresponding to event ${opts.eventName}`)
    } else if(matchingLog.length > 1) {
        throw new Error(`found too many logs in result ${result} corresponding to event ${opts.eventName}`)
    }

    return await opts.resultContract.at(matchingLog[0].args[opts.eventArgName])

}