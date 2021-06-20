import * as D from 'io-ts/lib/Decoder'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'

import { Request } from 'express'
import { ErrorResponse, Job } from '../../../types'
import { formatter } from '../formatters'
import { FileValidator } from './file'
import { time } from '../../utils'

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

const UsernameDecoder = D.struct({ username: NoEmpty })
const GeoDecoder = D.struct({ latitude: OptionalNumber, longitude: OptionalNumber })

const UsernameGeoDecoder = pipe(UsernameDecoder, D.intersect(GeoDecoder))

type UsernameGeo = D.TypeOf<typeof UsernameGeoDecoder>
type Username = D.TypeOf<typeof UsernameDecoder>

export const UsernameGeoValidator = (req: Request): E.Either<ErrorResponse[], UsernameGeo> =>
  pipe(
    UsernameGeoDecoder.decode(req.body),
    E.mapLeft((errors) => formatter(errors).map((e) => ({ message: e, field: 'username' }))),
  )

export const UsernameValidator = (req: Request): E.Either<ErrorResponse[], Username> =>
  pipe(
    UsernameDecoder.decode(req.params),
    E.mapLeft((errors) => formatter(errors).map((e) => ({ message: e, field: 'username' }))),
  )

export const JobValidator = (req: Request): E.Either<ErrorResponse[], Job> =>
  pipe(
    UsernameGeoValidator(req),
    E.chain((body) =>
      pipe(
        FileValidator(req),
        E.map((file) => ({ ...body, ...file })),
      ),
    ),
    E.map(({ size, ...parsedReq }) => ({ ...parsedReq, weight: size, timestamp: time(), status: 'ACCEPTED' })),
  )
