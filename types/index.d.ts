// eslint-disable-next-line spaced-comment
/// <reference types="fp-ts" />
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'

export interface SuccessResponse<T> {
  type: 'Success'
  data: T
}

export interface ErrorLine {
  message: string
  scope: string
}

type Errors = NonEmptyArray<ErrorLine>

export interface ErrorsResponse {
  type: 'Error'
  errors: ReadonlyArray<ErrorLine>
}

export type ResponsePayload<T> = SuccessResponse<T> | ErrorsResponse
