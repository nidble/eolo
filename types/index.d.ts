export interface Instant {
  originalname: string
  username: string
  weight: number
  latitude: number | null
  longitude: number | null
  // timestamp
}

interface Job extends Instant {
  fieldname: string
  mimetype: string
  path: string
  status: string
}

export interface SuccessPayload extends ResponsePayload {
  type: 'Success'
  data: Job
}

export interface ErrorPayload extends ResponsePayload {
  type: 'Error'
  errors: Array<{
    message: string
    field?: string
  }>
}

export type ResponsePayload = SuccessPayload | ErrorPayload
