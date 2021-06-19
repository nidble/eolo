import send from '@polka/send-type'
import { time, logger, key } from '../../../utils'
import { Request, Response } from 'express'
import { Job, ResponsePayload } from '../../../../types'
import { Redis } from 'ioredis'

type Dispatch = (j: Job) => Promise<string>

const response = (res: Response, payload: ResponsePayload, httpStatus = 200, headers = {}) => {
  send(res, httpStatus, payload, headers)
}

const extractJob = (req: Request): ResponsePayload => {
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
  // TODO: size/weight validator
  return {
    type: 'Success',
    data: {
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
    },
  }
}

const ALLOWED_MIMETYPES = ['image/jpeg']
export const post = (queue: { enqueue: Dispatch }) => async (req: Request, res: Response) => {
  try {
    const job = extractJob(req)
    if ('Error' === job.type) {
      return response(res, job, 422)
    }

    await queue.enqueue(job.data)
    // accepted
    response(res, job, 202)
  } catch (e) {
    logger.error(e)
    // TODO: maybe choose different error verbosity between production and dev (generic vs detailed)
    response(res, { type: 'Error', errors: [{ message: e.message }] }, 500)
  }
}

export const index = (redis: Redis) => async (req: Request, res: Response) => {
  const { username } = req.params
  if ('' === username.trim()) {
    const error = { message: 'username not valid', field: 'username' }
    return response(res, { type: 'Error', errors: [error] }, 200)
  }

  const instants = await redis.zrange(key(username), 0, 100)
  response(res, { type: 'Success', data: instants.map((i) => JSON.parse(i)) }, 200)
}
