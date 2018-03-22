import assert from 'assert'
import multidep from 'multidep'
import Gnosis from '../src/index'
import { Decimal } from '../src/utils'
import { versions as multidepVersions } from './multidep.json'

const multidepRequire = multidep('test/multidep.json')
const versionWeb3Pairs = multidepVersions.web3.map(v => [v, multidepRequire('web3', v)])

export const options = process.env.GNOSIS_OPTIONS ? JSON.parse(process.env.GNOSIS_OPTIONS) : {}

export const description = {
    title: 'Will Bitcoin Hardfork before 2018',
    description: 'Hello world',
    resolutionDate: new Date().toISOString(),
    outcomes: ['Yes', 'No']
}

export function isClose(a, b, relTol=2e-9, absTol=1e-18) {
    return Decimal(a.valueOf()).sub(b).abs().lte(
        Decimal.max(
            Decimal.max(
                Decimal.abs(a.valueOf()),
                Decimal.abs(b.valueOf())
            ).mul(relTol),
            absTol))
}

export function assertIsClose(a, b) {
    assert(isClose(a, b), `${a} !~ ${b} by ${Decimal(a.valueOf()).sub(b).abs().div(Decimal.max(
                Decimal.abs(a.valueOf()),
                Decimal.abs(b.valueOf())
            ))}`)
}

export async function requireRejection(q, msg) {
    try {
        await q
    } catch(e) {
        return e
    }
    throw new Error(msg || 'promise did not reject')
}

export function multiWeb3It(description, testFn) {
    for(const [version, Web3] of versionWeb3Pairs) {
        it(`[web3-${ version }] ${ description }`, () => testFn(Web3))
    }
}

export function multiWeb3GnosisDescribe(description, testCases) {
    for(const [version, Web3] of versionWeb3Pairs) {
        describe(`[web3-${ version }] ${ description }`, () => testCases({
            gnosisQ: Gnosis.create(Object.assign({}, options, {
                ethereum: new Web3.providers.HttpProvider('http://localhost:8545'),
            }))
        }))
    }
}
