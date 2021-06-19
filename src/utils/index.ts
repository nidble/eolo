import crypto from 'crypto'

import fs from 'fs/promises'
import sharp from 'sharp'
import pino from 'pino'
import { LOG_LEVEL, REDIS_PREFIX, UPLOADS_FOLDER } from '../config'
import { Job } from '../../types'

export const logger = pino({ level: LOG_LEVEL })

const dir = `${UPLOADS_FOLDER}140x140`

export const resize = async ({ path, originalname }: Job) => {
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

export const key = (username: string) => md5(`${REDIS_PREFIX}:instant:${username}`)

export const getImageName = (originalname: string) => `${dir}/${originalname}`
