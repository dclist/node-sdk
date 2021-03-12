import { GatewayClient } from '../lib/GatewayClient'
import { InvalidArgument, InvalidToken } from '../helpers/Errors'
import { SubscriptionsTopicsEnum } from '../types'
import { FieldSelector } from '../helpers/FieldSelector'

describe('BotUpdatesClient', () => {
    it('should throw on invalid token', () => {
        const genError = () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore Simulate pure javascript
            new GatewayClient({})
        }
        expect(genError).toThrowError(InvalidToken)
    })

    it('should throw on invalid topics', () => {
        const client = new GatewayClient({ token: 'test' })
        const genError = () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore Simulate pure javascript
            client.subscribeTo(['INVALID_TOPIC'])
        }
        expect(genError).toThrowError(InvalidArgument)
    })

    it('should dedupe topics array', () => {
        const client = new GatewayClient({ token: 'test' })
        const topics = client.subscribeTo([
            SubscriptionsTopicsEnum.NEW_VOTE,
            SubscriptionsTopicsEnum.NEW_COMMENT,
            SubscriptionsTopicsEnum.NEW_VOTE,
            SubscriptionsTopicsEnum.NEW_COMMENT,
            SubscriptionsTopicsEnum.NEW_COMMENT,
        ])

        expect(topics).toEqual<SubscriptionsTopicsEnum[]>([
            SubscriptionsTopicsEnum.NEW_VOTE,
            SubscriptionsTopicsEnum.NEW_COMMENT,
        ])
    })

    it('should throw on invalid custom field selector key', () => {
        const client = new GatewayClient({ token: 'test' })
        const genError = () => {
            client.subscribeTo([], {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore Simulate pure javascript
                INVALID_KEY: new FieldSelector({}),
            })
        }

        expect(genError).toThrowError(InvalidArgument)
    })

    it('should throw on invalid custom field selector value', () => {
        const client = new GatewayClient({ token: 'test' })
        const genError = () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore Simulate pure javascript
            client.subscribeTo([], {
                SDK_NEW_COMMENT: 'INVALID_FIELD_SELECTOR',
            })
        }

        expect(genError).toThrowError(InvalidArgument)
    })
})
