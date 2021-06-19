import { setInterval } from 'timers/promises'
import RedisSMQ from 'rsmq'
import { Redis } from 'ioredis'
import { logger } from '../utils'
import { Job } from '../../types'
import { process } from './helper'

export const enqueue = (rsmq: RedisSMQ, qname: string) => (job: Job) => {
  const payload = {
    qname,
    message: JSON.stringify(job),
    delay: 2, // TODO: tuning me
  }
  return rsmq.sendMessageAsync(payload)
}

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

export const polling = (redis: Redis, rsmq: RedisSMQ, qname: string) => async (delay: number, cap: number) => {
  let i = 0
  for await (const startTimeIgnored of setInterval(delay, Date.now())) {
    try {
      const resp = await rsmq.popMessageAsync({ qname })
      await process(resp, redis)
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
