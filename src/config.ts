import { Level } from 'pino'

export const REDIS_PREFIX = 'captcha.'
export const PORT = process.env.PORT || 3000
export const LOG_LEVEL: Level = (process.env.LOG_LEVEL as Level) || 'silent'
