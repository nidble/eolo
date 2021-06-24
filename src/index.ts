import polka from 'polka'
import Redis from 'ioredis'
import { json, cors, logger, uploader } from './middleware'
import queue from './queue'
import { redisOpts, QNAME } from './config'
import RedisSMQ from 'rsmq'
import * as image from './api/v1/image'
import { taskExecutor } from './utils'
import model from './model'

const app: polka.Polka = polka()

const redis = new Redis(redisOpts)
const rsmq = new RedisSMQ(redisOpts)
const m = model(redis)
const q = queue(m, rsmq, QNAME)

app.use(logger, json, cors)

app.get('healthz', (_req, res) => res.end())

app.get('/api/v1/image/:username', taskExecutor(image.index(m)))

app.use(uploader).post('/api/v1/image', taskExecutor(image.post(q)))

export default app
