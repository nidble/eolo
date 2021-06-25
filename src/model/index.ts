import { Redis } from 'ioredis'
import * as TE from 'fp-ts/lib/TaskEither'
import { ErrorLine, Errors } from '../../types'
import { Instant, User } from '../validators/image'
import { errorFactory, key } from '../utils'

function zrangeTask(redis: Redis) {
  return (user: User): TE.TaskEither<Array<ErrorLine>, string[]> =>
    TE.tryCatch(() => redis.zrange(key(user.username), 0, 100), errorFactory('zrange'))
}

function zaddTask(redis: Redis) {
  return (instant: Instant, scope: string): TE.TaskEither<Errors, number | string> =>
    TE.tryCatch(
      () => redis.zadd(key(instant.username), instant.timestamp, JSON.stringify(instant)), // <---
      errorFactory(scope),
    )
}

const model = (redis: Redis) =>
  ({
    fetchByDateTask: zrangeTask(redis),
    insertByDateTask: zaddTask(redis),
  } as const)

export type Model = ReturnType<typeof model>

export default model
