import * as D from 'io-ts/lib/Decoder'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'

import { Request } from 'express'
import { ErrorResponse } from '../../types'
import { formatter } from './formatters'

const ALLOWED_MIMETYPES = ['image/jpeg']

const mimetypes = (u: string) =>
  ALLOWED_MIMETYPES.includes(u) ? D.success(u) : D.failure(u, ALLOWED_MIMETYPES.join(';'))

const FileDecoder = D.struct({
  fieldname: D.string,
  originalname: D.string,
  mimetype: pipe(D.string, D.parse(mimetypes)),
  size: D.number,
  path: D.string,
})

type File = D.TypeOf<typeof FileDecoder>

export const FileValidator = (req: Request): E.Either<ErrorResponse[], File> =>
  pipe(
    FileDecoder.decode(req.file),
    E.mapLeft((errors) => formatter(errors).map((e) => ({ message: e, field: 'image' }))),
  )