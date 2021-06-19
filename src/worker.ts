import Redis from 'ioredis'
import RedisSMQ from 'rsmq'
import queue from './queue'
import { redisOpts, QNAME, POLLING_TIME } from './config'
import { createFolder } from './utils'

const redis = new Redis(redisOpts)
const rsmq = new RedisSMQ(redisOpts)
const q = queue(redis, rsmq, QNAME)

await createFolder()

await q.createQueue()
await q.polling(POLLING_TIME, -1)

console.log(Date.now())
