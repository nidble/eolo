import { Request } from 'express'
import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import { pipe } from 'fp-ts/lib/function'

import { time } from '@eolo/utils'
import { ErrorsResponse, SuccessResponse } from '@eolo-types/index'

import { Queue } from '@eolo/queue'
import { Model } from '@eolo/model'
import { File, Instant, JobQueue, UserAndGeo } from '@eolo/domain'
import { UserAndFileValidator, UserValidator } from '@eolo/domain/validators'
import { parseInstant } from '@eolo/domain/parsers'

function prepareJobQueuePayload({ user, file }: { user: UserAndGeo; file: File }): JobQueue {
  const { size: weight, ...image } = file
  return { ...user, ...image, weight, timestamp: time(), status: 'ACCEPTED' }
}

export function saveJob(queue: Queue) {
  return (req: Request): TE.TaskEither<ErrorsResponse, SuccessResponse<JobQueue>> =>
    pipe(
      UserAndFileValidator(req),
      E.map(prepareJobQueuePayload),
      TE.fromEither,
      TE.chainFirst(queue.enqueueT),
      TE.map((job) => ({ type: 'Success', data: job } as const)),
      TE.mapLeft((errors) => ({ type: 'Error', errors } as const)),
    )
}

export function getInstantsByDate(model: Model) {
  return (req: Request): TE.TaskEither<ErrorsResponse, SuccessResponse<ReadonlyArray<Instant>>> =>
    pipe(
      UserValidator(req),
      TE.fromEither,
      TE.chain(model.fetchByDateT),
      TE.map(E.traverseArray(parseInstant)),
      T.map(E.flatten),
      TE.map((instants) => ({ type: 'Success', data: instants } as const)),
      TE.mapLeft((errors) => ({ type: 'Error', errors } as const)),
    )
}
