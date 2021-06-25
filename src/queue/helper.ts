import RedisSMQ from 'rsmq'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import { Instant, JobQueue, parseJobQueue } from '../validators/image'
import * as NEA from 'fp-ts/lib/NonEmptyArray'

import { errorFactory, getImageName, resize } from '../utils'
import { ErrorLine, Errors } from '../../types'
import { Model } from '../model'

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
): TE.TaskEither<NEA.NonEmptyArray<ErrorLine>, Record<string, never> | RedisSMQ.QueueMessage> =>
  TE.tryCatch(() => rsmq.popMessageAsync({ qname }), errorFactory(scope))

export const processQueueMessage = (model: Model, rsmq: RedisSMQ, qname: string): TE.TaskEither<Errors, Instant> =>
  pipe(
    popMessageTask(rsmq, qname, 'processMessage'),
    TE.chain(extractQueueMessage),
    TE.chain(({ message }) => TE.fromEither(parseJobQueue(message))),
    TE.chainFirst((job) => TE.fromTask(() => resize(job))),
    TE.map(buildInstant),
    TE.chainFirst((instant) => model.insertByDateTask(instant, '[processMessage]: insertByDate failed')),
  )
