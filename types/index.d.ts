export interface SuccessPayload extends ResponsePayload {
  type: 'Success'
  data: {
    fieldname: string
    originalname: string
    mimetype: string
    size: number
    path: string
    username: string
    longitude: number | null
    latitude: number | null
    status: string
  }
}

export interface ErrorPayload extends ResponsePayload {
  type: 'Error'
  errors: Array<{
    message: string
    field?: string
  }>
}

export type ResponsePayload = SuccessPayload | ErrorPayload
