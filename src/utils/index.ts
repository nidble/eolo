import crypto from 'crypto'
import fs from 'fs/promises'
import sharp from 'sharp'
import pino from 'pino'
import { Request, Response } from 'express'
import { Task } from 'fp-ts/lib/Task'
import { toError } from 'fp-ts/lib/Either'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'

import { JobQueue } from '../domain'
import { LOG_LEVEL, REDIS_PREFIX, UPLOADS_FOLDER } from '../config'
import { ErrorLine } from '../../types'

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

export const md5 = (s: string) => crypto.createHash('md5').update(s).digest('hex')

export const time = () => +new Date()

export const key = (username: string) => `${REDIS_PREFIX}:instant:${md5(username)}`

export const getImageName = (originalname: string) => `${dir}/${originalname}`

export function taskExecutor(task: (req: Request, res: Response) => Task<void>) {
  return (req: Request, res: Response) => task(req, res)()
}

export function errorFactory(scope: string) {
  return (cause: unknown): NonEmptyArray<ErrorLine> => [{ message: toError(cause).message, scope }]
}
