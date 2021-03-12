import { InvalidArgument } from './Errors'

export const Validator = {
    validateSnowflake: (input: string): void => {
        const isValid = /\d{18}/.test(input)
        if (!isValid) throw new InvalidArgument(`Invalid Snowflake`)
    },
}

export const dedupeArray = <I extends string>(arr: I[]): I[] =>
    Object.values(
        arr.reduce((acc: Record<string, I>, curr) => {
            if (!acc[curr.toUpperCase()]) acc[curr.toUpperCase()] = curr
            return acc
        }, {})
    )
