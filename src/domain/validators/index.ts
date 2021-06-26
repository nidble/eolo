import { Request } from 'express'

import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'

import { Errors } from '../../../types'
import { decodeErrorFormatter } from '../helper'
import * as _ from '..'

export const FileValidator = (req: Request): E.Either<Errors, _.File> =>
  pipe(
    _.FileDecoder.decode(req.file),
    E.mapLeft((errors) => decodeErrorFormatter(errors).map((e) => ({ message: e, scope: 'image' }))),
  )

export const UserGeoValidator = (req: Request): E.Either<Errors, _.UserAndGeo> =>
  pipe(
    _.UserAndGeoDecoder.decode(req.body),
    E.mapLeft((errors) => decodeErrorFormatter(errors).map((e) => ({ message: e, scope: 'username' }))),
  )

export const UserValidator = (req: Request): E.Either<Errors, _.User> =>
  pipe(
    _.UserDecoder.decode(req.params),
    E.mapLeft((errors) => decodeErrorFormatter(errors).map((e) => ({ message: e, scope: 'username' }))),
  )

export const ImagePostValidator = (req: Request): E.Either<Errors, _.UserAndGeo & _.File> =>
  pipe(
    UserGeoValidator(req),
    E.chain((body) =>
      pipe(
        FileValidator(req),
        E.map((file) => ({ ...body, ...file })),
      ),
    ),
  )
