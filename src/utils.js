import _ from 'lodash'
import DecimalJS from 'decimal.js'

function makeWeb3Compatible(value, type, argName) {
    if(type == null) {
        throw new Error(`type must be specified for argument ${argName}`)
    }

    let match = /^(.*)\[(\d*)\]$/.exec(type)
    if(match != null) {
        if(!_.isArray(value)) {
            throw new Error(`expected ${value} to be convertable to ${type} ${argName}`)
        }

        if(match[2] !== '' && value.length !== Number(match[2])) {
            throw new Error(`${value} has ${value.length} items but should be ${type} ${argName}`)
        }

        return value.map((v) => makeWeb3Compatible(v, match[1], argName))
    }

    if(type === 'address') {
        // if it quacks like a TruffleContract
        if (_.has(value, 'address')) {
            value = value.address
        }

        if(!_.isString(value)) {
            throw new Error(`${value} must be string for ${type} ${argName}`)
        }

        if(!/^(0x)?[0-9a-f]{40}$/i.test(value)) {
            throw new Error(`${value} has wrong format for ${type} ${argName}`)
        }

        return value
    }

    if(type === 'bool') {
        if(!_.isBoolean(value)) {
            throw new Error(`expected ${value} to be a bool for ${type} ${argName}`)
        }

        return value
    }

    if(type === 'bytes' || type === 'string') {
        if(_.isString(value)) {
            return value
        }

        throw new Error(`could not format ${value} for ${type} ${argName}`)
    }

    match = /^bytes(\d+)$/.exec(type)
    if(match != null) {
        let bytesLength = Number(match[1])
        if(bytesLength > 32 || bytesLength === 0 || match[1].startsWith('0')) {
            throw new Error(`invalid type ${type} specified for ${argName}`)
        }

        if(_.isString(value)) {
            // TODO: refine this check to account for things like '\uACDC'.length
            if(value.length > bytesLength) {
                throw new Error(`value ${value} too long for ${type} ${argName}`)
            }
            return value
        }

        throw new Error(`could not format ${value} for ${type} ${argName}`)
    }

    match = /^(u?)int(\d+)$/.exec(type)
    if(match != null) {
        let signed = match[1] === ''
        let numBits = Number(match[2])
        if(numBits % 8 !== 0) {
            throw new Error(`number of bits for ${type} ${argName} not divisible by 8`)
        }

        if(numBits > 256) {
            throw new Error(`number of bits for ${type} ${argName} is too large`)
        }

        value = value.valueOf()

        if(_.isString(value) && /^-?(0x[\da-f]+|\d+)$/i.test(value) || _.isNumber(value)) {
            if(
                _.isString(value) && value.startsWith('0x') &&
                value.slice(2) === Number(value).toString(16) ||
                value == Number(value).toString()
            ) {
                value = Number(value)
            }

            if(!signed && value.toString().startsWith('-')) {
                throw new Error(`cannot pass negative value ${value} for ${type} ${argName}`)
            }

            return value
        }

        throw new Error(`could not normalize ${value} for ${type} ${argName}`)
    }

    throw new Error(`unsupported type ${type} for ${argName}`)
}

function getOptsFromArgs(args) {
    return typeof args[args.length - 1] === 'object' ? args[args.length - 1] : {}
}

function getTruffleArgsWhileMutatingOptions (argInfo, opts, argAliases) {
    opts = opts == null ? {} : opts

    if(argAliases != null) {
        _.forOwn(argAliases, (name, alias) => {
            if(_.has(opts, alias)) {
                if(_.has(opts, name)) {
                    throw new Error(`both name ${name} and its alias ${alias} specified in ${opts}`)
                }
                opts[name] = opts[alias]
                delete opts[alias]
            }
        })
    }

    return argInfo.map(({ name, type }) => {
        if (!_.has(opts, name)) {
            throw new Error(`missing argument ${name}`)
        }
        const ret = makeWeb3Compatible(opts[name], type, name)
        delete opts[name]
        return ret
    })
}

export let Decimal = DecimalJS.clone({ precision: 80 })

export function normalizeWeb3Args(args, opts) {
    let {
        functionInputs, methodName, argAliases, defaults
    } = opts

    // Format arguments in a way that web3 likes
    let methodArgs, methodOpts
    if(functionInputs.length === 1 && args.length === 1) {
        // if there is one input, user could have supplied either the argument with no options
        // or the argument inside of an options object
        if(typeof args[0] === 'object' && _.has(args[0], functionInputs[0].name)) {
            // we consider argument to be an options object if it has the parameter name as a key on it
            methodOpts = _.defaults(_.clone(args[0]), defaults)
            methodArgs = getTruffleArgsWhileMutatingOptions(functionInputs, methodOpts, argAliases)
        } else {
            methodOpts = null
            methodArgs = functionInputs.map(({ name, type }, i) => makeWeb3Compatible(args[i], type, name))
        }
    } else if(functionInputs.length === args.length) {
        methodOpts = null
        methodArgs = functionInputs.map(({ name, type }, i) => makeWeb3Compatible(args[i], type, name))
    } else if(functionInputs.length + 1 === args.length && typeof args[functionInputs.length] === 'object') {
        methodOpts = args[args.length - 1]
        // this map should not hit the last element of args
        methodArgs = functionInputs.map(({ name, type }, i) => makeWeb3Compatible(args[i], type, name))
    } else if(args.length === 1 && typeof args[0] === 'object') {
        methodOpts = _.defaults(_.clone(args[0]), defaults)
        methodArgs = getTruffleArgsWhileMutatingOptions(functionInputs, methodOpts, argAliases)
    } else {
        throw new Error(`${methodName}(${
            functionInputs.map(({ name, type }) => `${type} ${name}`).join(', ')
        }) can't be called with args (${args.join(', ')})`)
    }

    return [methodArgs, methodOpts]
}

function getWeb3CallMetadata(args, opts, speccedOpts) {
    let {
        callerContract, callerABI, methodName,
        eventName, eventArgName, resultContract,
        argAliases, validators
    } = speccedOpts

    if(callerABI == null) {
        callerABI = callerContract.abi
    }

    const functionCandidates = callerABI.filter(({ name }) => name === methodName)

    if(functionCandidates.length === 0) {
        throw new Error(`could not find function ${methodName} in abi ${callerABI}`)
    } else if(functionCandidates.length > 1) {
        // eslint-disable-next-line no-console
        console.warn(`function ${methodName} has multiple candidates in abi ${callerABI} -- using last candidate`)
    }

    const functionInputs = functionCandidates.pop().inputs

    let [methodArgs, methodOpts] = normalizeWeb3Args(args, { functionInputs, methodName, argAliases })

    if(validators != null) {
        validators.forEach((validator) => { validator(methodArgs) })
    }

    // Pass extra options down to the web3 layer
    if(methodOpts != null) {
        methodArgs.push(methodOpts)
    }

    return {
        callerContract, methodName, methodArgs,
        eventName, eventArgName, resultContract,
    }
}

export function wrapWeb3Function(spec) {
    const wrappedFn = async function() {
        const opts = getOptsFromArgs(arguments)
        const speccedOpts = spec(this, opts)

        return await sendTransactionAndGetResult(
            getWeb3CallMetadata(arguments, opts, speccedOpts)
        )
    }

    wrappedFn.estimateGas = async function() {
        const opts = getOptsFromArgs(arguments)
        const speccedOpts = spec(this, opts)
        const { callerContract, methodName } = speccedOpts

        if(opts.using === 'stats') {
            return callerContract.gasStats[methodName].averageGasUsed
        }

        if(opts.using === 'rpc') {
            const { methodArgs } = getWeb3CallMetadata(arguments, opts, speccedOpts)

            let caller = callerContract
            if (_.has(caller, 'deployed')) {
                caller = await caller.deployed()
            }

            return await caller[methodName].estimateGas(...methodArgs)
        }

        throw new Error(`unsupported gas estimation source ${opts.using}`)
    }

    return wrappedFn
}

/**
 * Looks for a single event in the logs of a transaction result. If no such events or multiple matching events are found, throws an error. Otherwise returns the matching event log.
 *
 * @param {Transaction} result Result of sending a transaction
 * @param {string} eventName Name of the event
 * @return {Object} The matching event log found
 * @alias Gnosis.requireEventFromTXResult
 */
export function requireEventFromTXResult (result, eventName) {
    let matchingLogs = _.filter(result.logs, (l) => l.event === eventName)

    if (matchingLogs.length < 1) {
        throw new Error(`could not find any logs in transaction ${result.tx} corresponding to event ${eventName}`)
    } else if (matchingLogs.length > 1) {
        throw new Error(`found too many logs in transaction ${result.tx} corresponding to event ${eventName}`)
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
// Also, as of Node v8.5.0, `util.promisify` doesn't call the function with the same `this`
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
