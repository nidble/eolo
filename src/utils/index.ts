import crypto from 'crypto'
import fs from 'fs/promises'
import sharp from 'sharp'
import pino from 'pino'
import { Response } from 'express'
import { of } from 'fp-ts/lib/Task'
import { toError } from 'fp-ts/lib/Either'
import send from '@polka/send-type'

import { JobQueue } from '../domain'
import { LOG_LEVEL, REDIS_PREFIX, UPLOADS_FOLDER } from '../config'
import { Errors, ResponsePayload } from '../../types'

export const logger = pino({ level: LOG_LEVEL })

const dir = `${UPLOADS_FOLDER}140x140`

export const resize = async ({ path, originalname }: JobQueue) => {
  try {
    const image = await fs.readFile(path)
    // TODO, width, height by env
    await sharp(image).resize(140, 140).toFile(getImageName(originalname))
  } catch (error) {
    logger.error(error, '[resize] failed')
  }
}

export const createFolder = async () => {
  try {
    await fs.mkdir(dir)
    logger.info(`[createFolder]: ${dir} successfully created`)
  } catch (err) {
    logger.error(err, '[createFolder] failed')
  }
}

export const md5 = (s: string) => crypto.createHash('md5').update(s).digest('hex') // lgtm [js/weak-cryptographic-algorithm]

export const time = () => +new Date()

export const key = (username: string) => `${REDIS_PREFIX}:instant:${md5(username)}`

export const getImageName = (originalname: string) => `${dir}/${originalname}`

// export function taskExecutor(task: (req: Request, res: Response) => Task<void>) {
//   return (req: Request, res: Response) => task(req, res)()
// }

export function errorFactory(scope: string) {
  return (cause: unknown): Errors => [{ message: toError(cause).message, scope }]
}

export const response = <T>(res: Response, payload: ResponsePayload<T>, httpStatus = 200, headers = {}) =>
  of(send(res, httpStatus, payload, headers))
