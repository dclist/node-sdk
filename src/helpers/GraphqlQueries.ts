import { Bot, Comment, User } from '../types'
import { FieldSelector } from './FieldSelector'

export const GraphqlQueries = {
    getBotById: {
        query: `query getBotById($botId: String!) { getBot(botId: $botId) { $FIELDS$ } }`,
        queryName: 'getBot',
        defaultFieldSelector: new FieldSelector<Bot>({
            id: 1,
            username: 1,
            discriminator: 1,
            avatar: 1,
            stats: {
                userCount: 1,
                guildCount: 1,
                voteCount: 1,
            },
            prefix: 1,
            prefixType: 1,
            website: 1,
            github: 1,
            tags: 1,
        }),
    },
    getUserComment: {
        query: `query getUserComment($userId: String!) { getUserComment(userId: $userId) { $FIELDS$ } }`,
        queryName: 'getUserComment',
        defaultFieldSelector: new FieldSelector<Comment>({
            subject: {
                id: 1,
                username: 1,
                discriminator: 1,
                avatar: 1,
            },
            author: {
                id: 1,
                username: 1,
                discriminator: 1,
                avatar: 1,
            },
            type: 1,
            like: 1,
            content: 1,
        }),
    },
    getUserById: {
        query: `query getUser($userId: String!) { getUser(userId: $userId) { $FIELDS$ } }`,
        queryName: 'getUser',
        defaultFieldSelector: new FieldSelector<User>({
            id: 1,
            username: 1,
            discriminator: 1,
            avatar: 1,
            website: 1,
            github: 1,
        }),
    },
    isUserVoted: {
        query: `query isUserVoted($userId: String!) { isUserVoted(userId: $userId) }`,
        queryName: 'isUserVoted',
    },
    postBotStats: {
        query: `mutation postBotStats($stats: BotStatsInput!) { postBotStats(stats: $stats) }`,
        queryName: 'postBotStats',
    },
    subscribeToTopics: {
        query: `subscription SDKUpdateSubcription($topics: [SDKUpdateTypeEnum!]!) { sdkUpdates(topics: $topics) { type payload { ... on NewVoteSDKUpdatePayload { user { $FIELDS:VOTE:USER$ } } ... on NewCommentSDKUpdatePayload { comment { $FIELDS:VOTE:COMMENT$ } } } } }`,
        queryName: 'sdkUpdates',
    },
}
