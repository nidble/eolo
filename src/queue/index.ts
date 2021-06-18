import { setInterval } from 'timers/promises'
import RedisSMQ from 'rsmq'
import { Redis } from 'ioredis'
import { logger, resize } from '../utils'
import { Job } from '../../types'

export const enqueue = (rsmq: RedisSMQ, qname: string) => (job: Job) => {
  const payload = {
    qname,
    message: JSON.stringify(job),
    delay: 2, // TODO: tuning me
  }
  return rsmq.sendMessageAsync(payload)
}

// popMessage return also empty object as valid :(, so:
const isValidQueueMessage = (m: Record<string, never> | RedisSMQ.QueueMessage): m is RedisSMQ.QueueMessage =>
  m && Object.keys(m).length !== 0

export const createQueue = (rsmq: RedisSMQ, qname: string) => async () => {
  try {
    await rsmq.createQueueAsync({ qname })
  } catch (error) {
    if (error.name !== 'queueExists') {
      logger.error(error, '[createQueue]: failed')
    } else {
      logger.info('[createQueue]: queue exists, resuming..')
    }
  }
}

// {"fieldname":"image","originalname":"32178.jpg","mimetype":"image/jpeg","weight":683305,
// "path":"uploads/cf...ea","username":"pluto","longitude":0,"latitude":0,"status":"ACCEPTED"}
export const polling = (redis: Redis, rsmq: RedisSMQ, qname: string) => async (delay: number, cap: number) => {
  let i = 0
  for await (const _startTime of setInterval(delay, Date.now())) {
    try {
      const resp = await rsmq.popMessageAsync({ qname })
      if (isValidQueueMessage(resp)) {
        const job: Job = JSON.parse(resp.message)
        await resize(job)
        // FIXME prefix must be dynamic
        await redis.zadd(`prefix:filename:${job.username}`, +new Date(), JSON.stringify({}))
        logger.info(job, '[polling]: job successfully processed, ready to start new one..')
      } else {
        logger.info('[polling]: no available message in queue..')
      }
    } catch (error) {
      logger.error(error, '[polling]: failed')
    }
    if (cap >= i) break
    i++
  }
}

export default (redis: Redis, rsmq: RedisSMQ, qname: string) => ({
  enqueue: enqueue(rsmq, qname),
  createQueue: createQueue(rsmq, qname),
  polling: polling(redis, rsmq, qname),
})
