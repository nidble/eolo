import * as D from 'io-ts/lib/Decoder'
import { flow, pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as J from 'fp-ts/lib/Json'

import { Errors } from '@eolo-types/index'
import { decodeErrorFormatter } from '@eolo/domain/helper'
import { errorFactory } from '@eolo/utils'
import * as _ from '..'

export const JsonParserGeneric = <A, T extends D.Decoder<unknown, A>>(decoder: T, input: string, scope: string) =>
  pipe(
    input,
    J.parse,
    E.mapLeft((e) => D.error(e, `[${scope}] fails while parsing`)),
    E.chain(decoder.decode),
    E.mapLeft(flow(decodeErrorFormatter, errorFactory(scope))),
  )

export const parseInstant = (s: string): E.Either<Errors, _.Instant> =>
  JsonParserGeneric(_.InstantDecoder, s, 'parseInstant')

export const parseJobQueue = (s: string): E.Either<Errors, _.JobQueue> =>
  JsonParserGeneric(_.JobQueueDecoder, s, 'parseJobQueue')
