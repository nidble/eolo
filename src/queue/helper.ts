import RedisSMQ from 'rsmq'
import { Redis } from 'ioredis'

import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import { pipe } from 'fp-ts/lib/function'
import { parseJob } from '../validators/image'
import * as NEA from 'fp-ts/lib/NonEmptyArray'

import { getImageName, key, logger, resize } from '../utils'
import { ErrorLine, Instant, Job } from '../../types'

type Errors = NEA.NonEmptyArray<ErrorLine>

const buildInstant = ({ originalname, username, weight, latitude, longitude, timestamp }: Job): Instant => ({
  name: getImageName(originalname),
  username,
  weight,
  latitude,
  longitude,
  timestamp,
})

// popMessage return also empty object as valid :(, so:
const isValidQueueMessage = (m: Record<string, never> | RedisSMQ.QueueMessage): m is RedisSMQ.QueueMessage =>
  m && Object.keys(m).length !== 0

const zaddTask = (instant: Instant, redis: Redis, scope: string): TE.TaskEither<Errors, number | string> =>
  TE.tryCatch(
    () => redis.zadd(key(instant.username), instant.timestamp, JSON.stringify(instant)), // <---
    (u: unknown) => NEA.of({ message: E.toError(u).message, scope }),
  )

const popMessageTask = (
  rsmq: RedisSMQ,
  qname: string,
  scope: string,
): TE.TaskEither<NEA.NonEmptyArray<ErrorLine>, Record<string, never> | RedisSMQ.QueueMessage> =>
  TE.tryCatch(
    () => rsmq.popMessageAsync({ qname }),
    (u: unknown) => NEA.of({ message: E.toError(u).message, scope }),
  )

export const processMessage = (redis: Redis, rsmq: RedisSMQ, qname: string) =>
  pipe(
    popMessageTask(rsmq, qname, 'processMessage'),
    TE.chain(
      TE.fromPredicate(isValidQueueMessage, () =>
        NEA.of({ message: '[processMessage]: no available message in queue..', scope: 'processMessage' }),
      ),
    ),
    TE.chain((queueMessage) => TE.fromEither(parseJob(queueMessage))),
    TE.chainFirst((job) => TE.fromTask(() => resize(job))),
    TE.map(buildInstant),
    TE.chainFirst((instant) => zaddTask(instant, redis, '[processMessage-zaddTask]: failed')),
    TE.fold(
      (errors) => T.of(logger.warn(errors)),
      (job) => T.of(logger.info(job, '[processMessage]: job successfully processed, ready to start new one..')),
    ),
  )
