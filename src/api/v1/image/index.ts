import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import { flow, pipe } from 'fp-ts/lib/function'
import * as J from 'fp-ts/lib/Json'

import send from '@polka/send-type'
import { key, time } from '../../../utils'
import { Request, Response } from 'express'
import { ErrorLine, Job, Queue, ResponsePayload } from '../../../../types'
import { Redis } from 'ioredis'
import { imagePostValidator, fromJsonToInstant, User, UserAndGeo, UserValidator } from '../../../validators/image'
import { File } from '../../../validators/image/file'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { formatter } from '../../../validators/formatters'

const response = <T>(res: Response, payload: ResponsePayload<T>, httpStatus = 200, headers = {}) =>
  T.of(send(res, httpStatus, payload, headers))

function errorFactory(scope: string) {
  return (cause: unknown): NonEmptyArray<ErrorLine> => [{ message: String(cause), scope }]
}

function enqueueTask(queue: Queue) {
  return (job: Job): TE.TaskEither<Array<ErrorLine>, string> =>
    TE.tryCatch(() => queue.enqueue(job), errorFactory('enqueue'))
}
function zrangeTask(redis: Redis) {
  return (user: User): TE.TaskEither<Array<ErrorLine>, string[]> =>
    TE.tryCatch(() => redis.zrange(key(user.username), 0, 100), errorFactory('zrange'))
}

function prepareJobPayload({ size, ...parsedReq }: UserAndGeo & File): Job {
  return { ...parsedReq, weight: size, timestamp: time(), status: 'ACCEPTED' }
}

export const post = (queue: Queue) => (req: Request, res: Response) =>
  pipe(
    imagePostValidator(req),
    E.map(prepareJobPayload),
    TE.fromEither,
    TE.chainFirst(enqueueTask(queue)),
    TE.fold(
      (errors) => response(res, { type: 'Error', errors }, 422),
      (job) => response(res, { type: 'Success', data: job }, 202),
    ),
  )

const parseInstant = flow(J.parse, fromJsonToInstant, E.mapLeft(formatter), E.mapLeft(errorFactory('json.parse')))

export const index = (redis: Redis) => (req: Request, res: Response) =>
  pipe(
    UserValidator(req),
    TE.fromEither,
    TE.chain(zrangeTask(redis)),
    TE.map(E.traverseArray(parseInstant)),
    T.map(E.flatten),
    TE.fold(
      (errors) => response(res, { type: 'Error', errors }, 422),
      (instants) => response(res, { type: 'Success', data: instants }, 200),
    ),
  )
