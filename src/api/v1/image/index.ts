import { Request, Response } from 'express'
import send from '@polka/send-type'
import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import { pipe } from 'fp-ts/lib/function'

import { time } from '../../../utils'
import { ResponsePayload } from '../../../../types'

import { Queue } from '../../../queue'
import { Model } from '../../../model'
import { File, JobQueue, UserAndGeo } from '../../../domain'
import { ImagePostValidator, UserValidator } from '../../../domain/validators'
import { parseInstant } from '../../../domain/parsers'

const response = <T>(res: Response, payload: ResponsePayload<T>, httpStatus = 200, headers = {}) =>
  T.of(send(res, httpStatus, payload, headers))

function prepareJobQueuePayload({ size, ...parsedReq }: UserAndGeo & File): JobQueue {
  return { ...parsedReq, weight: size, timestamp: time(), status: 'ACCEPTED' }
}

export const post = (queue: Queue) => (req: Request, res: Response) =>
  pipe(
    ImagePostValidator(req),
    E.map(prepareJobQueuePayload),
    TE.fromEither,
    TE.chainFirst(queue.enqueueTask),
    TE.fold(
      (errors) => response(res, { type: 'Error', errors }, 422),
      (job) => response(res, { type: 'Success', data: job }, 202),
    ),
  )

export const index = (model: Model) => (req: Request, res: Response) =>
  pipe(
    UserValidator(req),
    TE.fromEither,
    TE.chain(model.fetchByDateTask),
    TE.map(E.traverseArray(parseInstant)),
    T.map(E.flatten),
    TE.fold(
      (errors) => response(res, { type: 'Error', errors }, 422),
      (instants) => response(res, { type: 'Success', data: instants }, 200),
    ),
  )
