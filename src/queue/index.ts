import { setInterval } from 'timers/promises'
import RedisSMQ from 'rsmq'
import * as TE from 'fp-ts/lib/TaskEither'
import { match, toError } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'

import { errorFactory, logger } from '@eolo/utils'
import { Errors } from '@eolo-types/index'
import { processQueueMessage } from './helper'
import { Model } from '@eolo/model'
import { Instant, JobQueue } from '@eolo/domain'

export const createQueue = (rsmq: RedisSMQ, qname: string) => async () => {
  try {
    await rsmq.createQueueAsync({ qname })
  } catch (error) {
    if (toError(error).name !== 'queueExists') {
      logger.error(error, '[createQueue]: failed')
    } else {
      logger.info('[createQueue]: queue exists, resuming..')
    }
  }
}

export const polling = (model: Model, rsmq: RedisSMQ, qname: string) => async (delay: number, cap: number) => {
  const i = 0
  // eslint-disable-next-line max-len
  for await (const startTimeIgnored of setInterval(delay, Date.now())) { // lgtm [js/unused-loop-variable, js/unused-local-variable]
    pipe(
      await processQueueMessage(model, rsmq, qname)(),
      match(
        (errors: Errors) => logger.warn(errors),
        (i: Instant) => logger.info(i, '[polling]: instant successfully processed, ready to start new one..'),
      ),
    )
    if (cap >= i) {
      break
    }
  }
}

export function enqueueT(rsmq: RedisSMQ, qname: string) {
  return (job: JobQueue): TE.TaskEither<Errors, string> => {
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
    enqueueT: enqueueT(rsmq, qname),
    createQueue: createQueue(rsmq, qname),
    polling: polling(model, rsmq, qname),
  } as const)

export type Queue = ReturnType<typeof queue>

export default queue
