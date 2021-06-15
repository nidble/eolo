import polka from 'polka'
import multer from 'multer'
import Redis from 'ioredis'
import { json, cors, logger } from './middleware'
import * as image from './api/v1/image'

const app: polka.Polka = polka()
const upload = multer()

// TODO: adding env
const redisOpts = {
  port: 6379,
  host: '127.0.0.1',
  family: 4,
  password: 'foobarbaz',
  db: 0,
}
const redis = new Redis(redisOpts)

app.use(logger, json, cors)

app.get('healthz', (_req, res) => res.end())

app.post('/api/v1/image', upload.single('image'), image.post(redis))

export default app
