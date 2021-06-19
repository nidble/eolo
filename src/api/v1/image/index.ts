import send from '@polka/send-type'
import { logger, key } from '../../../utils'
import { Request, Response } from 'express'
import { Queue, ResponsePayload } from '../../../../types'
import { Redis } from 'ioredis'
import { indexValidator, postValidator } from './validator'

const response = <T>(res: Response, payload: ResponsePayload<T>, httpStatus = 200, headers = {}) => {
  send(res, httpStatus, payload, headers)
}

export const post = (queue: Queue) => async (req: Request, res: Response) => {
  try {
    const item = postValidator(req)
    if ('Error' === item.type) {
      return response(res, item, 422)
    }
    await queue.enqueue(item.data)
    response(res, item, 202) // TODO: restrict info sent to client
  } catch (e) {
    logger.error(e)
    // TODO: maybe choose different error verbosity between production and dev (generic vs detailed)
    response(res, { type: 'Error', errors: [{ message: e.message }] }, 500)
  }
}

export const index = (redis: Redis) => async (req: Request, res: Response) => {
  const item = indexValidator(req)
  if ('Error' === item.type) {
    return response(res, item, 422)
  }

  // TODO: 0-100 must be dynamic
  // TODO: implement pagination
  const instants = await redis.zrange(key(item.data), 0, 100)
  response(res, { type: 'Success', data: instants.map((i) => JSON.parse(i)) }, 200)
}
