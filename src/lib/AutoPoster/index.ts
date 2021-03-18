import * as logger from 'loglevel'
import { BotStats } from '../../types'
import { InvalidArgument } from '../../helpers/Errors'
import { DJSInstance } from './PosterInstences/DJSInstance'
import { DJSharedInstance } from './PosterInstences/DJSharedInstance'

export type AutoPosterOptions = {
    posterMethod: (stats: BotStats) => Promise<unknown>
    // eslint-disable-next-line
    client: any
}

export type PosterInstanceOptions = AutoPosterOptions & {
    onReady: () => unknown
}

export interface IPosterInstance {
    isClientReady: boolean

    getClientStats: () => Promise<BotStats>
}

export class AutoPoster {
    private interval: NodeJS.Timeout | undefined
    private posterInstance: IPosterInstance

    constructor(private _options: AutoPosterOptions) {
        if (!_options.posterMethod || typeof _options.posterMethod !== 'function') {
            throw new InvalidArgument('Invalid option "posterMethod". Invalid function')
        }
        if (!_options.client) {
            throw new InvalidArgument('Invalid option "client". Required field cannot be undefined/null')
        }
        this.posterInstance = this.determineLibraryType()
    }

    private determineLibraryType = (): IPosterInstance => {
        const instanceOptions: PosterInstanceOptions = {
            ...this._options,
            onReady: this.setupInterval,
        }
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const Djs = require('discord.js')
            if (Djs.Client && this._options.client instanceof Djs.Client) {
                return new DJSInstance(instanceOptions)
            }
        } catch {}
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const Djs = require('discord.js')
            if (Djs.ShardingManager && this._options.client instanceof Djs.ShardingManager) {
                return new DJSharedInstance(instanceOptions)
            }
        } catch {}
        throw new InvalidArgument(`Invalid option "client". Unsupported library`)
    }

    private onTick = () => {
        this.posterInstance.getClientStats().then(async (stats) => {
            this._options
                .posterMethod(stats)
                .then(() => {
                    logger.info('[DCLIST] Bot stats successfully posted.')
                })
                .catch((err) => {
                    logger.warn(`[DCLIST] Couldn't able to post stats. ${err.code}`)
                })
        })
    }

    private setupInterval = () => {
        if (this.interval) return
        this.onTick()
        this.interval = setInterval(() => {
            this.onTick()
        }, 35 * 60 * 1000) // 35 minutes
    }
}
