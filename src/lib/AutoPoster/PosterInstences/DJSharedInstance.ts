import { IPosterInstance, PosterInstanceOptions } from '../index'
import { InvalidArgument } from '../../../helpers/Errors'
import { BotStats } from '../../../types'

export class DJSharedInstance implements IPosterInstance {
    isClientReady = false

    constructor(private _options: PosterInstanceOptions) {
        if (!this.checkLibraryType()) {
            throw new InvalidArgument(`Invalid option "client". Unsupported library`)
        }
        this.waitUntilReady().then(() => {
            this.isClientReady = true
            this._options.onReady()
        })
    }

    public getClientStats = async (): Promise<BotStats> => {
        const guildCount = (await this._options.client.fetchClientValues('guilds.cache.size')).reduce(
            (curr: number, acc: number) => curr + acc,
            0
        )
        const userCount = (await this._options.client.fetchClientValues('users.cache.size')).reduce(
            (curr: number, acc: number) => curr + acc,
            0
        )
        const shardCount = this._options.client.shards.array().length
        return {
            guildCount,
            userCount,
            shardCount,
        }
    }

    private checkLibraryType = (): boolean => {
        let isLibTypeTrue = false
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const Djs = require('discord.js')
            if (Djs.ShardingManager && this._options.client instanceof Djs.ShardingManager) {
                isLibTypeTrue = true
            }
        } catch {}
        return isLibTypeTrue
    }

    private waitUntilShardsReady = () =>
        new Promise<void>((resolve) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this._options.client.on('shardCreate', (shard: any) => {
                if (shard.id + 1 === this._options.client.totalShards) {
                    shard.once('ready', () => resolve())
                }
            })
        })

    private waitUntilReady = (): Promise<void> =>
        new Promise<void>(async (resolve) => {
            try {
                const uTimes: Array<number | null> = await this._options.client.fetchClientValues('uptime')
                if (uTimes.every((uT) => uT && uT > 0)) resolve()
            } catch {}
            this.waitUntilShardsReady().then(() => {
                resolve()
            })
        })
}
