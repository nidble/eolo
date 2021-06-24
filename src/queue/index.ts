import { setInterval } from 'timers/promises'
import RedisSMQ from 'rsmq'
import * as TE from 'fp-ts/lib/TaskEither'

import { errorFactory, logger } from '../utils'
import { ErrorLine, Job } from '../../types'
import { processMessage } from './helper'
import { Model } from '../model'

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

export const polling = (model: Model, rsmq: RedisSMQ, qname: string) => async (delay: number, cap: number) => {
  let i = 0
  for await (const startTimeIgnored of setInterval(delay, Date.now())) {
    await processMessage(model, rsmq, qname)()
    if (cap >= i) {
      break
    }
    i++
  }
}

export function enqueueTask(rsmq: RedisSMQ, qname: string) {
  return (job: Job): TE.TaskEither<Array<ErrorLine>, string> => {
    const payload = {
      qname,
      message: JSON.stringify(job),
      delay: 2, // TODO: tuning me
    }
    return TE.tryCatch(() => rsmq.sendMessageAsync(payload), errorFactory('enqueue'))
  }
}

const queue = (model: Model, rsmq: RedisSMQ, qname: string) =>
  ({
    enqueueTask: enqueueTask(rsmq, qname),
    createQueue: createQueue(rsmq, qname),
    polling: polling(model, rsmq, qname),
  } as const)

export type Queue = ReturnType<typeof queue>

export default queue
