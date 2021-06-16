import polka from 'polka'
import multer from 'multer'
import Redis from 'ioredis'
import { json, cors, logger } from './middleware'
import * as image from './api/v1/image'
import * as config from './config'

const app: polka.Polka = polka()
const upload = multer()

const redisOpts = {
  port: config.REDIS_PORT,
  host: config.REDIS_HOST,
  family: config.REDIS_FAMILY,
  password: config.REDIS_PASSWORD,
  db: config.REDIS_DB,
}

const redis = new Redis(redisOpts)

app.use(logger, json, cors)

app.get('healthz', (_req, res) => res.end())

app.post('/api/v1/image', upload.single('image'), image.post(redis))

export default app
