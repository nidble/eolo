import { Redis } from 'ioredis'
import * as TE from 'fp-ts/lib/TaskEither'
import { ErrorLine } from '../../types'
import { User } from '../api/v1/image/validation'
import { errorFactory, key } from '../utils'

function zrangeTask(redis: Redis) {
  return (user: User): TE.TaskEither<Array<ErrorLine>, string[]> =>
    TE.tryCatch(() => redis.zrange(key(user.username), 0, 100), errorFactory('zrange'))
}

const model = (redis: Redis) =>
  ({
    fetchByDateTask: zrangeTask(redis),
  } as const)

export type Model = ReturnType<typeof model>

export default model
