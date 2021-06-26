import * as D from 'io-ts/lib/Decoder'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { flow, pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as J from 'fp-ts/lib/Json'

import { ErrorLine } from '../../../types'
import { decodeErrorFormatter } from './../helper'
import { errorFactory } from '../../utils'
import * as _ from '..'

export const JsonParserGeneric = <A, T extends D.Decoder<unknown, A>>(decoder: T, input: string, scope: string) =>
  pipe(
    input,
    J.parse,
    E.mapLeft((e) => D.error(e, `[${scope}] fails while parsing`)),
    E.chain(decoder.decode),
    E.mapLeft(flow(decodeErrorFormatter, errorFactory(scope))),
  )

export const parseInstant = (s: string): E.Either<NonEmptyArray<ErrorLine>, _.Instant> =>
  JsonParserGeneric(_.InstantDecoder, s, 'parseInstant')

export const parseJobQueue = (s: string): E.Either<NonEmptyArray<ErrorLine>, _.JobQueue> =>
  JsonParserGeneric(_.JobQueueDecoder, s, 'parseJobQueue')
