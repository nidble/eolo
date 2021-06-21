import * as D from 'io-ts/lib/Decoder'
import { flow, pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as J from 'fp-ts/lib/Json'

import { Request } from 'express'
import { ErrorLine, Instant } from '../../../types'
import { formatter } from '../formatters'
import { FileValidator, File } from './file'

interface NoEmptyBrand {
  readonly NoEmpty: unique symbol
}
type NoEmpty = string & NoEmptyBrand

const NoEmpty: D.Decoder<unknown, NoEmpty> = pipe(
  D.string,
  D.refine((s: string): s is NoEmpty => s.trim() !== '', 'not empty'),
)

const OptionalNumber: D.Decoder<unknown, number | null> = {
  decode: (u?) => (typeof u === 'number' ? D.success(u) : D.success(Number(u) || null)),
}

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

export const UserGeoValidator = (req: Request): E.Either<ErrorLine[], UserAndGeo> =>
  pipe(
    UserAndGeoDecoder.decode(req.body),
    E.mapLeft((errors) => formatter(errors).map((e) => ({ message: e, scope: 'username' }))),
  )

export const UserValidator = (req: Request): E.Either<ErrorLine[], User> =>
  pipe(
    UserDecoder.decode(req.params),
    E.mapLeft((errors) => formatter(errors).map((e) => ({ message: e, scope: 'username' }))),
  )

// type Instant = D.TypeOf<typeof InstantDecoder>

export const parseInstant: (e: E.Either<unknown, J.Json>) => E.Either<D.DecodeError, Instant> = flow(
  E.mapLeft((e) => D.error(e, 'J.Json.parse')),
  E.chain(InstantDecoder.decode),
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
