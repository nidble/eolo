import { Redis } from 'ioredis'
import * as TE from 'fp-ts/lib/TaskEither'
import { Errors } from '@eolo-types/index'
import { errorFactory, key } from '@eolo/utils'
import { Instant, User } from '@eolo/domain'

function zrangeT(redis: Redis) {
  return (user: User): TE.TaskEither<Errors, string[]> =>
    TE.tryCatch(() => redis.zrange(key(user.username), 0, 100), errorFactory('zrange'))
}

function zaddT(redis: Redis) {
  return (instant: Instant, scope: string): TE.TaskEither<Errors, number | string> =>
    TE.tryCatch(
      () => redis.zadd(key(instant.username), instant.timestamp, JSON.stringify(instant)), // <---
      errorFactory(scope),
    )
}

const model = (redis: Redis) =>
  ({
    fetchByDateT: zrangeT(redis),
    insertByDateT: zaddT(redis),
  } as const)

export type Model = ReturnType<typeof model>

export default model
