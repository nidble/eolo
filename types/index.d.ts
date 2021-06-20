export interface Instant {
  name: string
  username: string
  weight: number
  latitude: number | null
  longitude: number | null
  timestamp: number
}

interface Job extends Omit<Instant, 'name'> {
  originalname: string
  fieldname: string
  mimetype: string
  path: string
  status: string
}

export interface SuccessPayload<T> {
  type: 'Success'
  data: T
}

export interface ErrorResponse {
  message: string
  field?: string
}

export interface ErrorsResponse {
  type: 'Error'
  errors: ReadonlyArray<ErrorResponse>
}

export type ResponsePayload<T> = SuccessPayload<T> | ErrorsResponse

export type Dispatch = (j: Job) => Promise<string>
export type Queue = { enqueue: Dispatch }
