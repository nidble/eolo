/* eslint-disable no-underscore-dangle */
import * as D from 'io-ts/lib/Decoder'
import * as DE from 'io-ts/lib/DecodeError'

const child = (decodeError: DE.DecodeError<string>): string => {
  let message = ''
  switch (decodeError._tag) {
    case 'Leaf':
      message = `as '${decodeError.actual}' is not valid, should be ${decodeError.error}`
      break
    case 'Key':
      message = `${decodeError.kind} property '${decodeError.key}' ${formatter(decodeError.errors)}`
      break
  }

  return message
}

export const formatter = (error: D.DecodeError): Array<string> => {
  let result: Array<string> = []
  switch (error._tag) {
    case 'Concat':
      result = [...result, ...formatter(error.left)]
      result = [...result, ...formatter(error.right)]
      break
    case 'Of':
      result = [...result, child(error.value)]
      break
  }
  return result
}
