import send from '@polka/send-type'
import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import { pipe } from 'fp-ts/lib/function'

import { time } from '../../../utils'
import { Request, Response } from 'express'
import { Job, ResponsePayload } from '../../../../types'

import { imagePostValidator, UserAndGeo, UserValidator, parseInstant } from './validation'
import { File } from '../../../validators/file'
import { Queue } from '../../../queue'
import { Model } from '../../../model'

const response = <T>(res: Response, payload: ResponsePayload<T>, httpStatus = 200, headers = {}) =>
  T.of(send(res, httpStatus, payload, headers))

function prepareJobPayload({ size, ...parsedReq }: UserAndGeo & File): Job {
  return { ...parsedReq, weight: size, timestamp: time(), status: 'ACCEPTED' }
}

export const post = (queue: Queue) => (req: Request, res: Response) =>
  pipe(
    imagePostValidator(req),
    E.map(prepareJobPayload),
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
