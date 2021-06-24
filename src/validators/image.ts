import { QueueMessage } from 'rsmq'
import { Request } from 'express'

import * as D from 'io-ts/lib/Decoder'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { flow, pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as J from 'fp-ts/lib/Json'

import { ErrorLine, Instant, Job } from '../../types'
import { decodeErrorFormatter, OptionalNumber } from './helper'
import { FileValidator, File, FileDecoder } from './file'
import { NoEmpty } from './helper'
import { errorFactory } from '../utils'

export type UserAndGeo = D.TypeOf<typeof UserAndGeoDecoder>
export type User = D.TypeOf<typeof UserDecoder>

const UserDecoder = D.struct({ username: NoEmpty })
const GeoDecoder = D.struct({ latitude: OptionalNumber, longitude: OptionalNumber })
const UserAndGeoDecoder = pipe(UserDecoder, D.intersect(GeoDecoder))
const InstantDecoder = pipe(
  D.struct({ name: D.string, weight: D.number, timestamp: D.number }),
  D.intersect(UserAndGeoDecoder),
)
export const JobQueueDecoder = pipe(
  InstantDecoder,
  D.intersect(D.struct({ status: D.string })),
  D.intersect(FileDecoder),
)

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

export const parseInstant: (s: string) => E.Either<NonEmptyArray<ErrorLine>, Instant> = flow(
  J.parse,
  E.mapLeft((e) => D.error(e, '[parseInstant] fail')), // E.Either<unknown, J.Json> => E.Either<D.DecodeError,  J.Json>
  E.chain(InstantDecoder.decode), // E.Either<D.DecodeError,  J.Json> => E.Either<D.DecodeError, Instant>
  E.mapLeft(decodeErrorFormatter),
  E.mapLeft(errorFactory('json.parse')),
)

export const parseJob = ({ message }: QueueMessage): E.Either<NonEmptyArray<ErrorLine>, Job> =>
  pipe(
    message,
    J.parse,
    E.mapLeft((e) => D.error(e, '[parseJob] fail')),
    E.chain(JobQueueDecoder.decode),
    E.mapLeft(decodeErrorFormatter),
    E.mapLeft(errorFactory('json.parse')),
  )
