import RedisSMQ from 'rsmq'
import { Redis } from 'ioredis'
import { getImageName, key, logger, resize } from '../utils'
import { Instant, Job } from '../../types'

// popMessage return also empty object as valid :(, so:
const isValidQueueMessage = (m: Record<string, never> | RedisSMQ.QueueMessage): m is RedisSMQ.QueueMessage =>
  m && Object.keys(m).length !== 0

const buildInstant = ({ originalname, username, weight, latitude, longitude, timestamp }: Job): Instant => ({
  name: getImageName(originalname),
  username,
  weight,
  latitude,
  longitude,
  timestamp,
})

export const process = async (resp: Record<string, never> | RedisSMQ.QueueMessage, redis: Redis) => {
  if (isValidQueueMessage(resp)) {
    const job: Job = JSON.parse(resp.message)
    await resize(job)
    const instant = buildInstant(job)

    await redis.zadd(key(instant.username), instant.timestamp, JSON.stringify(instant))
    logger.info(job, '[polling]: job successfully processed, ready to start new one..')
  } else {
    logger.info('[polling]: no available message in queue..')
  }
}
