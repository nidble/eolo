import { Request } from 'express'

import * as D from 'io-ts/lib/Decoder'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { flow, pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as J from 'fp-ts/lib/Json'

import { ErrorLine } from '../../types'
import { decodeErrorFormatter, OptionalNumber } from './helper'
import { FileValidator, File, FileDecoderBase } from './file'
import { NoEmpty } from './helper'
import { errorFactory } from '../utils'

export type UserAndGeo = D.TypeOf<typeof UserAndGeoDecoder>
export type User = D.TypeOf<typeof UserDecoder>
export type JobQueue = D.TypeOf<typeof JobQueueDecoder>
export type Instant = D.TypeOf<typeof InstantDecoder>

const UserDecoder = D.struct({ username: NoEmpty })
const GeoDecoder = D.struct({ latitude: OptionalNumber, longitude: OptionalNumber })
const UserAndGeoDecoder = pipe(UserDecoder, D.intersect(GeoDecoder))
const SharedDecoder = pipe(D.struct({ weight: D.number, timestamp: D.number }), D.intersect(UserAndGeoDecoder))

export const JobQueueDecoder = pipe(
  SharedDecoder,
  D.intersect(D.struct({ status: D.string })),
  D.intersect(FileDecoderBase),
)

const InstantDecoder = pipe(SharedDecoder, D.intersect(D.struct({ name: D.string })), D.intersect(UserAndGeoDecoder))

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

export const ImagePostValidator = (req: Request): E.Either<ErrorLine[], UserAndGeo & File> =>
  pipe(
    UserGeoValidator(req),
    E.chain((body) =>
      pipe(
        FileValidator(req),
        E.map((file) => ({ ...body, ...file })),
      ),
    ),
  )

export const JsonParser = <A, T extends D.Decoder<unknown, A>>(decoder: T, input: string, scope: string) =>
  pipe(
    input,
    J.parse,
    E.mapLeft((e) => D.error(e, `[${scope}] fails while parsing`)),
    E.chain(decoder.decode),
    E.mapLeft(flow(decodeErrorFormatter, errorFactory(scope))),
  )

export const parseInstant = (s: string): E.Either<NonEmptyArray<ErrorLine>, Instant> =>
  JsonParser(InstantDecoder, s, 'parseInstant')

export const parseJobQueue = (s: string): E.Either<NonEmptyArray<ErrorLine>, JobQueue> =>
  JsonParser(JobQueueDecoder, s, 'parseJobQueue')
