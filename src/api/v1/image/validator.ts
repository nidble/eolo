import { time } from '../../../utils'
import { Request } from 'express'
import { Job, ResponsePayload } from '../../../../types'

const ALLOWED_MIMETYPES = ['image/jpeg']

export const postValidatorLegacy = (req: Request): ResponsePayload<Job> => {
  const { username = '', latitude, longitude } = req.body ?? {}
  if ('' === username) {
    const error = { message: 'username field is mandatory', field: 'username' }
    return { type: 'Error', errors: [error] }
  }
  const { fieldname, originalname, mimetype, size: weight, path } = req.file ?? {}
  if (!fieldname || !originalname || !weight || !path) {
    const error = { message: 'uploaded image is invalid or broken' }
    return { type: 'Error', errors: [error] }
  }
  if (!mimetype || !ALLOWED_MIMETYPES.includes(mimetype)) {
    const error = {
      message: `mimetype not supported, accepted only: ${ALLOWED_MIMETYPES.join(';')}`,
    }
    return { type: 'Error', errors: [error] }
  }
  // TODO: size/weight validator?

  const data = {
    fieldname,
    originalname,
    mimetype,
    weight,
    path,
    username,
    longitude: Number(longitude) || null,
    latitude: Number(latitude) || null,
    timestamp: time(),
    status: 'ACCEPTED',
  }

  return { type: 'Success', data }
}

export const indexValidator = (req: Request): ResponsePayload<string> => {
  const { username } = req.params
  if ('' === username.trim()) {
    const error = { message: 'username not valid', field: 'username' }
    return { type: 'Error', errors: [error] }
  }

  return { type: 'Success', data: username }
}
