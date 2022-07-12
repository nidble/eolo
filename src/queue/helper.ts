import RedisSMQ from 'rsmq'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import * as NEA from 'fp-ts/lib/NonEmptyArray'

import { errorFactory, getImageName, resize } from '@eolo/utils'
import { Errors } from '@eolo-types/index'
import { Model } from '@eolo/model'
import { Instant, JobQueue } from '@eolo/domain'
import { parseJobQueue } from '@eolo/domain/parsers'

const buildInstant = ({ originalname, username, weight, latitude, longitude, timestamp }: JobQueue): Instant => ({
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

const extractQueueMessage = TE.fromPredicate(isValidQueueMessage, () =>
  NEA.of({ message: '[processMessage]: no available message in queue..', scope: 'processMessage' }),
)

const popMessageTask = (
  rsmq: RedisSMQ,
  qname: string,
  scope: string,
): TE.TaskEither<Errors, Record<string, never> | RedisSMQ.QueueMessage> =>
  TE.tryCatch(() => rsmq.popMessageAsync({ qname }), errorFactory(scope))

export const processQueueMessage = (model: Model, rsmq: RedisSMQ, qname: string): TE.TaskEither<Errors, Instant> =>
  pipe(
    popMessageTask(rsmq, qname, 'processMessage'),
    TE.chain(extractQueueMessage),
    TE.chain(({ message }) => TE.fromEither(parseJobQueue(message))),
    TE.chainFirst((job) => TE.fromTask(() => resize(job))),
    TE.map(buildInstant),
    TE.chainFirst((instant) => model.insertByDateT(instant, '[processMessage]: insertByDate failed')),
  )
