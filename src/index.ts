import { setDefaultLevel } from 'loglevel'
import { GatewayClient } from './lib/GatewayClient'
import { FieldSelector } from './helpers/FieldSelector'
import { SubscriptionsTopicsEnum } from './types'

setDefaultLevel('INFO')
export { setDefaultLevel, GatewayClient, FieldSelector, SubscriptionsTopicsEnum }
export * from './types'
