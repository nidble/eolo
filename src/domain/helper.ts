/* eslint-disable no-underscore-dangle */
/* eslint-disable no-confusing-arrow */
import * as D from 'io-ts/lib/Decoder'
import * as DE from 'io-ts/lib/DecodeError'
import { absurd, pipe } from 'fp-ts/lib/function'

interface NoEmptyBrand {
  readonly NoEmpty: unique symbol
}
type NoEmpty = string & NoEmptyBrand

export const NoEmpty: D.Decoder<unknown, NoEmpty> = pipe(
  D.string,
  D.refine((s: string): s is NoEmpty => s.trim() !== '', 'not empty'),
)

export const OptionalNumber: D.Decoder<unknown, number | null> = {
  decode: (u?) => (typeof u === 'number' ? D.success(u) : D.success(Number(u) || null)),
}

const ALLOWED_MIMETYPES = ['image/jpeg']
export const mimetypes = (u: string) =>
  ALLOWED_MIMETYPES.includes(u) ? D.success(u) : D.failure(u, ALLOWED_MIMETYPES.join(';'))

const child = (decodeError: DE.DecodeError<string>): string => {
  let message = ''
  switch (decodeError._tag) {
    case 'Leaf':
      message = `as '${decodeError.actual}' is not valid, should be ${decodeError.error}`
      break
    case 'Key':
      message = `${decodeError.kind} property '${decodeError.key}' ${decodeErrorFormatter(decodeError.errors)}`
      break
  }

  return message
}

export const decodeErrorFormatter = (error: D.DecodeError): Array<string> => {
  let result: Array<string> = []
  switch (error._tag) {
    case 'Concat':
      result = [...result, ...decodeErrorFormatter(error.left)]
      result = [...result, ...decodeErrorFormatter(error.right)]
      break
    case 'Of':
      result = [...result, child(error.value)]
      break
    default:
      absurd(error)
  }
  return result
}
