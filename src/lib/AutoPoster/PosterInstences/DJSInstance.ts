import { IPosterInstance, PosterInstanceOptions } from '../index'
import { InvalidArgument } from '../../../helpers/Errors'
import { BotStats } from '../../../types'

export class DJSInstance implements IPosterInstance {
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
        const guildCount = this._options.client.guilds.cache.size
        const userCount = this._options.client.users.cache.size
        return {
            guildCount,
            userCount,
            shardCount: 1,
        }
    }

    private checkLibraryType = (): boolean => {
        let isLibTypeTrue = false
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const Djs = require('discord.js')
            if (Djs.Client && this._options.client instanceof Djs.Client) {
                isLibTypeTrue = true
            }
        } catch {}
        return isLibTypeTrue
    }

    private waitUntilReady = (): Promise<void> =>
        new Promise<void>((resolve) => {
            const uTime = this._options.client.uptime
            if (uTime && uTime > 0) resolve()
            else this._options.client.once('ready', () => resolve())
        })
}
