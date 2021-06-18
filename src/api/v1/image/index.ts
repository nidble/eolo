import send from '@polka/send-type'
import { logger } from '../../../utils'
import { Request, Response } from 'express'
import { Redis } from 'ioredis'
import { ResponsePayload } from '../../../../types'

type SendMessage = (m: string) => Promise<string>

const response = (res: Response, payload: ResponsePayload, httpStatus = 200, headers = {}) => {
  send(res, httpStatus, payload, headers)
}

/*
fieldname: 'image', originalname: '32178.jpg', mimetype: 'image/jpeg', destination: 'uploads/',
filename: '48fafda...743', path: 'uploads/48fafda...743', size: 683305
*/
const ALLOWED_MIMETYPES = ['image/jpeg']
export const post = (redis: Redis, mq: { sendMessage: SendMessage }) => async (req: Request, res: Response) => {
  try {
    const { username = '', latitude = 0, longitude = 0 } = req.body ?? {}
    if ('' === username) {
      const error = { message: 'username field is mandatory', field: 'username' }
      return response(res, { type: 'Error', errors: [error] }, 422)
    }
    const { fieldname, originalname, mimetype, size, path, filename } = req.file
    if (!ALLOWED_MIMETYPES.includes(mimetype)) {
      const error = {
        message: `image not supported, please upload only: ${ALLOWED_MIMETYPES.join(';')}`,
      }
      return response(res, { type: 'Error', errors: [error] }, 422)
    }
    // TODO: size validator
    const payload = {
      fieldname,
      originalname,
      mimetype,
      size,
      path,
      username,
      longitude: Number(longitude) ?? null,
      latitude: Number(latitude) ?? null,
      status: 'ACCEPTED',
    }
    // await redis.hset(`prefix:filename:${filename}`, payload)
    // const payload = JSON.stringify({ fieldname, originalname })
    // await redis.set(`prefix.${username}`, payload)
    await mq.sendMessage(JSON.stringify(payload))

    // accepted
    response(res, { type: 'Success', data: payload }, 202)
  } catch (e) {
    logger.error(e)
    // TODO: maybe choose different behavior between production and dev (generic vs detailed)
    response(res, { type: 'Error', errors: [{ message: e.message }] }, 500)
  }
}
