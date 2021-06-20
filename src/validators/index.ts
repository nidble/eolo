import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import { Request } from 'express'

import { BodyValidator } from './body'
import { FileValidator } from './file'
import { ErrorResponse, Job } from '../../types'
import { time } from '../utils'

export const postValidator = (req: Request): E.Either<ErrorResponse[], Job> =>
  pipe(
    BodyValidator(req),
    E.chain((body) =>
      pipe(
        FileValidator(req),
        E.map((file) => ({ ...body, ...file })),
      ),
    ),
    E.map(({ size, ...parsedReq }) => ({ ...parsedReq, weight: size, timestamp: time(), status: 'ACCEPTED' })),
  )
