import * as D from 'io-ts/lib/Decoder'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'

import { Request } from 'express'
import { ErrorResponse } from '../../types'
import { formatter } from './formatters'

interface NoEmptyBrand {
  readonly NoEmpty: unique symbol
}
type NoEmpty = string & NoEmptyBrand

const NoEmpty: D.Decoder<unknown, NoEmpty> = pipe(
  D.string,
  D.refine((s: string): s is NoEmpty => s.trim() !== '', 'no empty'),
)

const optionalNumber: D.Decoder<unknown, number | null> = {
  decode: (u?) => (typeof u === 'number' ? D.success(u) : D.success(Number(u) || null)),
}

const BodyDecoder = D.struct({ latitude: optionalNumber, longitude: optionalNumber, username: NoEmpty })

type Body = D.TypeOf<typeof BodyDecoder>

export const BodyValidator = (req: Request): E.Either<ErrorResponse[], Body> =>
  pipe(
    BodyDecoder.decode(req.body),
    E.mapLeft((errors) => formatter(errors).map((e) => ({ message: e, field: 'username' }))),
  )
