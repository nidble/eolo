import * as D from 'io-ts/lib/Decoder'
import { pipe } from 'fp-ts/lib/function'

import { mimetypes, OptionalNumber } from './helper'
import { NoEmpty } from './helper'

export type UserAndGeo = D.TypeOf<typeof UserAndGeoDecoder>
export type User = D.TypeOf<typeof UserDecoder>
export type JobQueue = D.TypeOf<typeof JobQueueDecoder>
export type Instant = D.TypeOf<typeof InstantDecoder>
export type File = D.TypeOf<typeof FileDecoder>

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

export const UserDecoder = D.struct({ username: NoEmpty })
export const GeoDecoder = D.struct({ latitude: OptionalNumber, longitude: OptionalNumber })
export const UserAndGeoDecoder = pipe(UserDecoder, D.intersect(GeoDecoder))
export const SharedDecoder = pipe(D.struct({ weight: D.number, timestamp: D.number }), D.intersect(UserAndGeoDecoder))

export const JobQueueDecoder = pipe(
  SharedDecoder,
  D.intersect(D.struct({ status: D.string })),
  D.intersect(FileDecoderBase),
)

export const InstantDecoder = pipe(
  SharedDecoder,
  D.intersect(D.struct({ name: D.string })),
  D.intersect(UserAndGeoDecoder),
)
