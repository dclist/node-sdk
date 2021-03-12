import { GraphqlError } from '../types'

export class ApiError extends Error {
    code: string

    constructor(error: GraphqlError) {
        super(`${error.extensions.code} -> ${error.message}`)
        this.name = `ApiError`
        this.code = error.extensions.code
    }
}

export class InvalidToken extends Error {
    constructor() {
        super(`Token you provided is invalid`)
        this.name = `InvalidToken`
    }
}

export class InvalidArgument extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = `InvalidArgument`
    }
}
