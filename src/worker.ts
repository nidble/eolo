import RedisSMQ from 'rsmq'
import queue from './queue'
import { redisOpts, QNAME, POLLING_TIME } from './config'

// const redis = new Redis(redisOpts)
const rsmq = new RedisSMQ(redisOpts)
const q = queue(rsmq, QNAME)

await q.createQueue()
await q.polling(POLLING_TIME, -1)

console.log(Date.now())
