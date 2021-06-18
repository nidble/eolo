import polka from 'polka'
import multer from 'multer'
import Redis from 'ioredis'
import { json, cors, logger } from './middleware'
import queue from './queue'
import { redisOpts, QNAME, UPLOADS_FOLDER } from './config'
import RedisSMQ from 'rsmq'
import * as image from './api/v1/image'

const app: polka.Polka = polka()
const upload = multer({ dest: UPLOADS_FOLDER })

const redis = new Redis(redisOpts)
const rsmq = new RedisSMQ(redisOpts)
const q = queue(redis, rsmq, QNAME)

app.use(logger, json, cors)

app.get('healthz', (_req, res) => res.end())

app.post('/api/v1/image', upload.single('image'), image.post(q))

export default app
