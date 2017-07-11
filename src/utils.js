import _ from 'lodash'
import DecimalJS from 'decimal.js'

export let Decimal = DecimalJS.clone({ precision: 80 })

export function getTruffleArgsFromOptions (argNames, opts) {
    opts = opts || {}

    return argNames.map((argName) => {
        if (!_.has(opts, argName)) {
            throw new Error(`missing argument ${argName}`)
        }
        let arg = opts[argName]
        if (_.has(arg, 'address')) {
            arg = arg.address
        }
        return arg
    })
}

export function requireEventFromTXResult (result, eventName) {
    let matchingLogs = _.filter(result.logs, (l) => l.event === eventName)

    if (matchingLogs.length < 1) {
        throw new Error(`could not find any logs in result ${result} corresponding to event ${eventName}`)
    } else if (matchingLogs.length > 1) {
        throw new Error(`found too many logs in result ${result} corresponding to event ${eventName}`)
    }

    return matchingLogs[0]
}

export async function sendTransactionAndGetResult (opts) {
    opts = opts || {}

    let caller = opts.callerContract
    if (_.has(caller, 'deployed')) {
        caller = await caller.deployed()
    }

    let result = await caller[opts.methodName](...opts.methodArgs)
    let matchingLog = requireEventFromTXResult(result, opts.eventName)

    if(opts.resultContract == null)
        return matchingLog.args[opts.eventArgName]
    else
        return await opts.resultContract.at(matchingLog.args[opts.eventArgName])
}

// I know bluebird does this, but it's heavy
export function promisify (fn) {
    return new Proxy(fn, {
        apply: (target, thisArg, args) => {
            return new Promise((resolve, reject) => {
                let newArgs = Array.from(args)
                newArgs.push((err, result) => {
                    if (err != null) {
                        reject(new Error(`${err}${result == null ? '' : ` (${result})`}`))
                    } else {
                        resolve(result)
                    }
                })
                target.apply(thisArg, newArgs)
            })
        }
    })
}

export function promisifyAll (obj) {
    _.functionsIn(obj).forEach((fnName) => {
        let asyncFnName = fnName + 'Async'
        if (!_.has(obj, asyncFnName)) {
            obj[asyncFnName] = promisify(obj[fnName])
        }
    })
    return obj
}
