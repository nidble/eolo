import polka from 'polka'
import Redis from 'ioredis'
import { Request, Response } from 'express'
import { pipe } from 'fp-ts/lib/function'
import { match } from 'fp-ts/lib/TaskEither'
import { response } from './utils'
import { json, cors, logger, uploader } from './middleware'
import queue from './queue'
import { redisOpts, QNAME } from './config'
import RedisSMQ from 'rsmq'
import * as image from './api/v1/image'
import model from './model'

const app: polka.Polka = polka()

const redis = new Redis(redisOpts)
const rsmq = new RedisSMQ(redisOpts)
const m = model(redis)
const q = queue(m, rsmq, QNAME)

app.use(logger, json, cors)

app.get('healthz', async (_req, res) => {
  await redis.ping() // or db.execute("SELECT 1")
  res.end()
})

app.get('/api/v1/image/:username', (req: Request, res: Response) =>
  pipe(
    image.getInstantsByDate(m)(req),
    match(
      (errors) => response(res, errors, 422),
      (success) => response(res, success, 200),
    ),
  )(),
)

app.use(uploader).post('/api/v1/image', (req: Request, res: Response) =>
  pipe(
    image.saveJob(q)(req),
    match(
      (errors) => response(res, errors, 422),
      (success) => response(res, success, 202),
    ),
  )(),
)

export default app
