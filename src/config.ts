import { Level } from 'pino'

export const PORT = process.env.NODE_PORT || 3030
export const LOG_LEVEL: Level = (process.env.LOG_LEVEL as Level) || 'silent'

export const REDIS_PREFIX = process.env.REDIS_PREFIX || 'prefix'
export const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379
export const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'
export const REDIS_FAMILY = Number(process.env.REDIS_FAMILY) || 4
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || 'CHANGEME'
export const REDIS_DB = Number(process.env.REDIS_DB) || 0
