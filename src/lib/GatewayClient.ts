import { EventEmitter } from 'events'
import { FieldSelector } from '../helpers/FieldSelector'
import { ApiError, InvalidArgument, InvalidToken } from '../helpers/Errors'
import {
    Bot,
    BotStats,
    Comment,
    GraphqlError,
    GraphqlResponse,
    SDKUpdate,
    SubscriptionsTopicsEnum,
    User,
} from '../types'
import { GraphqlQueries } from '../helpers/GraphqlQueries'
import { dedupeArray, Validator } from '../helpers/Utils'
import { createClient, Client, SubscribePayload } from 'graphql-ws'
import ws, { CloseEvent } from 'ws'
import { AutoPoster } from './AutoPoster'
import { v4 } from 'uuid'

type CustomFieldSelectors = Record<SubscriptionsTopicsEnum, FieldSelector>

interface EmitterEvents {
    [SubscriptionsTopicsEnum.NEW_VOTE]: [SDKUpdate<SubscriptionsTopicsEnum.NEW_VOTE>]
    [SubscriptionsTopicsEnum.NEW_COMMENT]: [SDKUpdate<SubscriptionsTopicsEnum.NEW_COMMENT>]

    subscribed: []
    error: [GraphqlError]
}

type GatewayClientOptions = {
    /**
     * Token Generated Via dclist.net
     */
    token?: string
    /**
     * Discord client
     */
    client?: any // eslint-disable-line
    enablePoster?: boolean
}

export declare interface GatewayClient {
    on<U extends keyof EmitterEvents>(event: U, listener: (...args: EmitterEvents[U]) => void): this

    once<U extends keyof EmitterEvents>(event: U, listener: (...args: EmitterEvents[U]) => void): this

    off<U extends keyof EmitterEvents>(event: U, listener: (...args: EmitterEvents[U]) => void): this
}

export class GatewayClient extends EventEmitter {
    #options: GatewayClientOptions
    #apiUrl = 'wss://api.dclist.net/subscribe'
    #topicList: readonly SubscriptionsTopicsEnum[] = [
        SubscriptionsTopicsEnum.NEW_VOTE,
        SubscriptionsTopicsEnum.NEW_COMMENT,
    ]
    #client: Client
    #poster: AutoPoster | undefined

    constructor(_options: GatewayClientOptions = {}) {
        super()
        const envToken = process.env.DCLIST_TOKEN
        this.#options = {
            ..._options,
            token: _options.token ?? envToken,
            enablePoster: _options.enablePoster ?? false,
        }
        if (!this.#options.token) {
            throw new InvalidToken()
        }
        if (!envToken) process.env.DCLIST_TOKEN = this.#options.token
        if (this.#options.enablePoster) {
            this.#poster = new AutoPoster({
                client: this.#options.client,
                posterMethod: this.postStats,
            })
        }
        this.#client = createClient({
            url: this.#apiUrl,
            connectionParams: {
                headers: {
                    Authorization: `Sdk ${this.#options.token}`,
                },
            },
            lazy: false,
            generateID: () => v4(),
            webSocketImpl: ws,
        })
    }

    private generateSubscriptionQuery = (_selectors: Partial<CustomFieldSelectors>): string => {
        const fieldSelectors: CustomFieldSelectors = {
            [SubscriptionsTopicsEnum.NEW_VOTE]:
                _selectors[SubscriptionsTopicsEnum.NEW_VOTE] ??
                new FieldSelector<User>({
                    id: 1,
                    username: 1,
                    discriminator: 1,
                    avatar: 1,
                    website: 1,
                    github: 1,
                }),
            [SubscriptionsTopicsEnum.NEW_COMMENT]:
                _selectors[SubscriptionsTopicsEnum.NEW_COMMENT] ??
                new FieldSelector<Comment>({
                    subject: {
                        id: 1,
                        username: 1,
                        discriminator: 1,
                        avatar: 1,
                        website: 1,
                        github: 1,
                    },
                    author: {
                        id: 1,
                        username: 1,
                        discriminator: 1,
                        avatar: 1,
                        website: 1,
                        github: 1,
                    },
                    type: 1,
                    like: 1,
                    content: 1,
                }),
        }
        const rawQuery = GraphqlQueries.subscribeToTopics
        return rawQuery.query
            .replace('$FIELDS:VOTE:USER$', fieldSelectors[SubscriptionsTopicsEnum.NEW_VOTE].parsedFields)
            .replace('$FIELDS:VOTE:COMMENT$', fieldSelectors[SubscriptionsTopicsEnum.NEW_COMMENT].parsedFields)
    }

    private wsRequest = async <T>(payload: SubscribePayload) => {
        return new Promise<T>((resolve, reject) => {
            let result: T
            this.#client.subscribe<T>(payload, {
                next: (data) => (result = data),
                error: reject,
                complete: () => resolve(result),
            })
        })
    }

    private _apiRequest = async <T>(
        query: string,
        queryName: string,
        fields?: FieldSelector,
        variables?: Record<string, unknown>
    ): Promise<T | undefined> => {
        if (fields && !(fields instanceof FieldSelector))
            throw new InvalidArgument(`Field Selection must be created by FieldSelector class`)
        const bodyObject = {
            query: fields ? query.replace('$FIELDS$', fields.parsedFields) : query,
            variables,
        }

        const request = await this.wsRequest<
            GraphqlResponse<{
                [x: string]: T
            }>
        >(bodyObject)

        if (request.errors) {
            const error = request.errors[0]
            throw new ApiError(error)
        } else if (request.data && request.data[queryName]) {
            return request.data[queryName]
        } else return undefined
    }

    /**
     * Subscribe to bot changes
     * @param {topics} topics Topics you want to subscribe
     * @param {CustomFieldSelectors} selectors Fields you want to receive
     * @return SubscriptionsTopicsEnum[] Array of subscribed topics
     */
    public subscribeTo = (
        topics: Array<SubscriptionsTopicsEnum>,
        selectors?: Partial<CustomFieldSelectors>
    ): Array<SubscriptionsTopicsEnum> => {
        if (!Array.isArray(topics)) {
            throw new InvalidArgument(`You need to pass topics as an array`)
        }
        // Check provided topics
        const pureTopics = dedupeArray<SubscriptionsTopicsEnum>(topics)
        for (const pureTopic of pureTopics) {
            if (!this.#topicList.includes(pureTopic)) {
                throw new InvalidArgument(`Topic "${pureTopic}" is invalid`)
            }
        }
        // Check provided field selectors
        if (selectors) {
            for (const key in selectors) {
                const selectorKey = key as SubscriptionsTopicsEnum
                const selector = selectors[selectorKey]
                if (selector) {
                    if (!this.#topicList.includes(selectorKey)) {
                        throw new InvalidArgument(`Invalid topic "${key}" for custom field selector`)
                    }
                    if (!(selector instanceof FieldSelector)) {
                        throw new InvalidArgument(`Invalid field selector for "${key}" topic`)
                    }
                }
            }
        }
        const query = this.generateSubscriptionQuery(selectors ?? {})
        if (this.#options.token === 'test') return pureTopics
        this.#client.subscribe(
            {
                query,
                variables: {
                    topics: pureTopics,
                },
            },
            {
                complete: () => void 0,
                next: (value: GraphqlResponse) => {
                    if (value.errors) {
                        throw new ApiError((value.errors[0] as unknown) as GraphqlError)
                    }
                    const sdkUpdate: SDKUpdate | undefined = value.data?.sdkUpdates
                    if (sdkUpdate) {
                        this.emit(sdkUpdate.type, sdkUpdate)
                    } else {
                        throw new ApiError({
                            message: 'Cannot receive data from API',
                            extensions: {
                                code: 'CLIENT_ERROR',
                            },
                        })
                    }
                },
                error: (err: CloseEvent) => {
                    throw new ApiError({
                        message: err.reason,
                        extensions: {
                            code: 'WEBSOCKET_ERROR',
                        },
                    })
                },
            }
        )
        return pureTopics
    }

    /**
     * Gets Bot By Snowflake ID
     * @param {string} botId Bot Snowflake ID
     * @param {FieldSelector} fields Fields to be returned
     * @return Promise<Bot | undefined>
     */
    public getBotById = async (botId: string, fields?: FieldSelector<Bot>): Promise<Bot | undefined> => {
        const queryObj = GraphqlQueries.getBotById
        Validator.validateSnowflake(botId)
        return await this._apiRequest<Bot>(
            queryObj.query,
            queryObj.queryName,
            fields ?? queryObj.defaultFieldSelector,
            {
                botId,
            }
        )
    }

    /**
     * Gets User By Snowflake ID
     * @param {string} userId User Snowflake ID
     * @param {FieldSelector} fields Fields to be returned
     * @return Promise<User | undefined>
     */
    public getUserById = async (userId: string, fields?: FieldSelector<User>): Promise<User | undefined> => {
        const queryObj = GraphqlQueries.getUserById
        Validator.validateSnowflake(userId)
        return await this._apiRequest<User>(
            queryObj.query,
            queryObj.queryName,
            fields ?? queryObj.defaultFieldSelector,
            {
                userId,
            }
        )
    }

    /**
     * Checks if user voted recent to bot.
     * @param {string} userId User Snowflake ID
     * @return Promise<boolean>
     */
    public isUserVoted = async (userId: string): Promise<boolean> => {
        const queryObj = GraphqlQueries.isUserVoted
        Validator.validateSnowflake(userId)
        return (
            (await this._apiRequest<boolean>(queryObj.query, queryObj.queryName, undefined, {
                userId,
            })) ?? false
        )
    }

    /**
     * Finds user comment in bot's comments. If user didn't comment it will return undefined.
     * @param {string} userId User Snowflake ID
     * @param {FieldSelector} fields Fields to be returned
     * @return Promise<Comment>
     */
    public getUserComment = async (userId: string, fields?: FieldSelector<Comment>): Promise<Comment | undefined> => {
        const queryObj = GraphqlQueries.getUserComment
        Validator.validateSnowflake(userId)
        return await this._apiRequest<Comment>(
            queryObj.query,
            queryObj.queryName,
            fields ?? queryObj.defaultFieldSelector,
            {
                userId,
            }
        )
    }

    private postStats = async (stats: BotStats): Promise<boolean> => {
        const queryObj = GraphqlQueries.postBotStats
        return (
            (await this._apiRequest<boolean>(queryObj.query, queryObj.queryName, undefined, {
                stats,
            })) ?? false
        )
    }
}
