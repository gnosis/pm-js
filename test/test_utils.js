import assert from 'assert'
import { Decimal } from '../src/utils'

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
