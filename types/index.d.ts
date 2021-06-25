export interface SuccessPayload<T> {
  type: 'Success'
  data: T
}

export interface ErrorLine {
  message: string
  scope: string
}

type Errors = NEA.NonEmptyArray<ErrorLine>

export interface ErrorsResponse {
  type: 'Error'
  errors: ReadonlyArray<ErrorLine>
}

export type ResponsePayload<T> = SuccessPayload<T> | ErrorsResponse

export type Dispatch = (j: Job) => Promise<string>
