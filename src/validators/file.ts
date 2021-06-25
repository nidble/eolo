/* eslint-disable no-confusing-arrow */
import * as D from 'io-ts/lib/Decoder'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'

import { Request } from 'express'
import { ErrorLine } from '../../types'
import { decodeErrorFormatter } from './helper'

const ALLOWED_MIMETYPES = ['image/jpeg']

const mimetypes = (u: string) =>
  ALLOWED_MIMETYPES.includes(u) ? D.success(u) : D.failure(u, ALLOWED_MIMETYPES.join(';'))

export const FileDecoderBase = D.struct({
  fieldname: D.string,
  originalname: D.string,
  mimetype: pipe(D.string, D.parse(mimetypes)),
  path: D.string,
})

export const FileDecoder = pipe(
  FileDecoderBase,
  D.intersect(
    D.struct({
      size: D.number,
    }),
  ),
)

export type File = D.TypeOf<typeof FileDecoder>

export const FileValidator = (req: Request): E.Either<ErrorLine[], File> =>
  pipe(
    FileDecoder.decode(req.file),
    E.mapLeft((errors) => decodeErrorFormatter(errors).map((e) => ({ message: e, scope: 'image' }))),
  )
