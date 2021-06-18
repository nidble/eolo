import send from '@polka/send-type'
import { time, logger, md5 } from '../../../utils'
import { Request, Response } from 'express'
import { Job, ResponsePayload } from '../../../../types'

type Dispatch = (j: Job) => Promise<string>

const response = (res: Response, payload: ResponsePayload, httpStatus = 200, headers = {}) => {
  send(res, httpStatus, payload, headers)
}

/*
fieldname: 'image', originalname: '32178.jpg', mimetype: 'image/jpeg', destination: 'uploads/',
filename: '48fafda...743', path: 'uploads/48fafda...743', size: 683305
*/
const ALLOWED_MIMETYPES = ['image/jpeg']
export const post = (queue: { enqueue: Dispatch }) => async (req: Request, res: Response) => {
  try {
    const { username = '', latitude, longitude } = req.body ?? {}
    if ('' === username) {
      const error = { message: 'username field is mandatory', field: 'username' }
      return response(res, { type: 'Error', errors: [error] }, 422)
    }
    const { fieldname, originalname, mimetype, size: weight, path } = req.file ?? {}
    if (!fieldname || !originalname || !weight || !path) {
      const error = { message: 'uploaded image is invalid or broken' }
      return response(res, { type: 'Error', errors: [error] }, 422)
    }
    if (!mimetype || !ALLOWED_MIMETYPES.includes(mimetype)) {
      const error = {
        message: `mimetype not supported, accepted only: ${ALLOWED_MIMETYPES.join(';')}`,
      }
      return response(res, { type: 'Error', errors: [error] }, 422)
    }
    // TODO: size/weight validator
    const payload = {
      fieldname,
      originalname,
      mimetype,
      weight,
      path,
      username: md5(username),
      longitude: Number(longitude) || null,
      latitude: Number(latitude) || null,
      timestamp: time(),
      status: 'ACCEPTED',
    }
    await queue.enqueue(payload)
    // accepted
    response(res, { type: 'Success', data: payload }, 202)
  } catch (e) {
    logger.error(e)
    // TODO: maybe choose different error verbosity between production and dev (generic vs detailed)
    response(res, { type: 'Error', errors: [{ message: e.message }] }, 500)
  }
}
