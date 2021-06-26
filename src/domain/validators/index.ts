import { Request } from 'express'

import { pipe, flow } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as NEA from 'fp-ts/lib/NonEmptyArray'
import { DecodeError } from 'io-ts/lib/Decoder'

import { Errors } from '../../../types'
import { decodeErrorFormatter } from '../helper'
import * as _ from '..'

const fromDecodeError = (s: string): ((es: DecodeError) => Errors) => {
  const scope = () => NEA.of(s)
  return flow(decodeErrorFormatter, NEA.bindTo('message'), NEA.bind('scope', scope))
}

export const FileValidator = (req: Request): E.Either<Errors, _.File> =>
  pipe(_.FileDecoder.decode(req.file), E.mapLeft(fromDecodeError('image')))

export const UserGeoValidator = (req: Request): E.Either<Errors, _.UserAndGeo> =>
  pipe(_.UserAndGeoDecoder.decode(req.body), E.mapLeft(fromDecodeError('username')))

export const UserValidator = (req: Request): E.Either<Errors, _.User> =>
  pipe(_.UserDecoder.decode(req.params), E.mapLeft(fromDecodeError('username')))

export const UserAndFileValidator = (req: Request): E.Either<Errors, { user: _.UserAndGeo; file: _.File }> =>
  pipe(UserGeoValidator(req), E.bindTo('user'), E.apS('file', FileValidator(req)))

// export const UserAndImageValidator = (req: Request): E.Either<Errors, _.UserAndGeo & _.File> =>
//   pipe(
//     UserGeoValidator(req),
//     E.chain((body) =>
//       pipe(
//         FileValidator(req),
//         E.map((file) => ({ ...body, ...file })),
//       ),
//     ),
//   )
