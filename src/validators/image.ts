import * as D from 'io-ts/lib/Decoder'
import { flow, pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as J from 'fp-ts/lib/Json'

import { Request } from 'express'
import { ErrorLine, Instant } from '../../types'
import { decodeErrorFormatter, OptionalNumber } from './helper'
import { FileValidator, File } from './file'
import { NoEmpty } from './helper'
import { errorFactory } from '../utils'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'

const UserDecoder = D.struct({ username: NoEmpty })
const GeoDecoder = D.struct({ latitude: OptionalNumber, longitude: OptionalNumber })
const UserAndGeoDecoder = pipe(UserDecoder, D.intersect(GeoDecoder))
const InstantDecoder = D.struct({
  name: D.string,
  username: D.string,
  weight: D.number,
  latitude: OptionalNumber,
  longitude: OptionalNumber,
  timestamp: D.number,
})

export type UserAndGeo = D.TypeOf<typeof UserAndGeoDecoder>
export type User = D.TypeOf<typeof UserDecoder>
// type Instant = D.TypeOf<typeof InstantDecoder>

export const UserGeoValidator = (req: Request): E.Either<ErrorLine[], UserAndGeo> =>
  pipe(
    UserAndGeoDecoder.decode(req.body),
    E.mapLeft((errors) => decodeErrorFormatter(errors).map((e) => ({ message: e, scope: 'username' }))),
  )

export const UserValidator = (req: Request): E.Either<ErrorLine[], User> =>
  pipe(
    UserDecoder.decode(req.params),
    E.mapLeft((errors) => decodeErrorFormatter(errors).map((e) => ({ message: e, scope: 'username' }))),
  )

export const parseInstant: (s: string) => E.Either<NonEmptyArray<ErrorLine>, Instant> = flow(
  J.parse,
  E.mapLeft((e) => D.error(e, 'J.Json.parse')), // E.Either<unknown, J.Json> => E.Either<D.DecodeError,  J.Json>
  E.chain(InstantDecoder.decode), // E.Either<D.DecodeError,  J.Json> => E.Either<D.DecodeError, Instant>
  E.mapLeft(decodeErrorFormatter),
  E.mapLeft(errorFactory('json.parse')),
)

export const imagePostValidator = (req: Request): E.Either<ErrorLine[], UserAndGeo & File> =>
  pipe(
    UserGeoValidator(req),
    E.chain((body) =>
      pipe(
        FileValidator(req),
        E.map((file) => ({ ...body, ...file })),
      ),
    ),
  )
