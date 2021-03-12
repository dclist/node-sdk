//<edit-fold desc="Enums">

export enum PrefixTypeEnum {
    STATIC = 'STATIC',
    DYNAMIC = 'DYNAMIC',
}

export enum CommentTypeEnum {
    PARENT = 'PARENT',
    REPLY = 'REPLY',
}

export enum RolesEnum {
    USER = 'USER',
    CONTROLLER = 'CONTROLLER',
    MOD = 'MOD',
    ADMIN = 'ADMIN',
    ROOT = 'ROOT',
}

export enum SubscriptionsTopicsEnum {
    NEW_VOTE = 'SDK_NEW_VOTE',
    NEW_COMMENT = 'SDK_NEW_COMMENT',
}

//</edit-fold>

//<edit-fold desc="Types">

export type Snowflake = string

export type Stats = {
    /**
     * Guild count of bot
     */
    guildCount: number
    /**
     * Total user count of bot
     */
    userCount: number
    /**
     * Shard count of bot
     */
    shardCount: number
    /**
     * Estimated vote count of bot
     */
    voteCount: number
    /**
     * Estimated comment count of bot
     */
    commentCount: number
}

export type BotStats = {
    guildCount: number
    userCount: number
    shardCount: number
}

export type GraphqlResponse<T> = {
    data: null | T
    errors?: GraphqlError[]
}

export type SDKUpdatePayload = {
    [SubscriptionsTopicsEnum.NEW_COMMENT]: {
        comment: Comment
    }
    [SubscriptionsTopicsEnum.NEW_VOTE]: {
        user: User
    }
}

//</edit-fold>

//<edit-fold desc="Interfaces">

export interface DiscordUser {
    /**
     * Discord User Snowflake ID
     */
    id: Snowflake

    /**
     * Discord User Username
     */
    username: string

    /**
     * Discord User Avatar Hash
     */
    avatar: string

    /**
     * Discord User Discriminator
     */
    discriminator: string

    /**
     * Discord User Public Flags
     */
    public_flags: number

    /**
     * Discord User Bot
     */
    bot: boolean
}

export interface Bot extends DiscordUser {
    /**
     * Bot Owner Object
     * @see User
     */
    owner: User

    /**
     * Bot Prefix
     */
    prefix: string

    /**
     * Bot Prefix Type
     * @enum PrefixTypeEnum
     */
    prefixType: PrefixTypeEnum

    /**
     * Bot Short Summary
     */
    summary: string

    /**
     * Bot Long Description
     */
    description: string

    /**
     * Bot Tags List
     */
    tags: string[]

    /**
     * Bot Github Repository Link
     */
    github?: string

    /**
     * Bot Website Link
     */
    website?: string

    /**
     * Bot Support Server Link
     */
    support?: string

    /**
     * Bot Invite Link
     */
    invite?: string

    /**
     * Bot Stats
     * @link Stats
     */
    stats: Stats
}

export interface User extends DiscordUser {
    /**
     * User Short Biography
     */
    biography?: string

    /**
     * User Github Profile Link
     */
    github?: string

    /**
     * User Website Link
     */
    website?: string

    /**
     * User Liked Comments Id List
     */
    likedComments: string[]

    /**
     * All User Bots List
     */
    bots: Bot[]

    /**
     * User Role
     * @enum RolesEnum
     */
    role: RolesEnum
}

export interface Comment {
    author: User

    subject: Bot

    reply: Comment | undefined

    type: CommentTypeEnum

    content: string

    like: number
}

export interface SDKUpdate<T extends SubscriptionsTopicsEnum = never> {
    type: T

    payload: SDKUpdatePayload[T]
}

export interface GraphqlError {
    /**
     * Error Message Returned From Request
     */
    message: string
    extensions: {
        /**
         * Error Code Returned From Request
         */
        code: string
    }
}

//</edit-fold>
